#!/usr/bin/env node
/**
 * pnpm lab:behance — pick today's component inspiration from Behance's curated
 * galleries, without login.
 *
 *   pnpm lab:behance                 # random featured project not used before
 *   pnpm lab:behance --url <project> [--gallery ui-ux]  # a given project (logged as used)
 *   pnpm lab:behance --dry           # pick and print, don't log or download
 *
 * Why a browser: a plain fetch of behance.net answers 403 (bot wall), but the
 * same page renders in headless Chromium (Playwright, already in the repo). So
 * this goes straight to Playwright: open the gallery, collect `/gallery/<id>/`
 * links, open one project, read title + creators from its JSON-LD and the first
 * `project_modules` images, then download 3 of them from the public CDN.
 *
 * Galleries, in order: ui-ux, then graphic-design, then motion.
 * Used projects: lab/behance-used.json (committed). Images: lab/.refs/<date>-<slug>/
 * (gitignored: references to look at, never shipped).
 *
 * If it fails (Behance changes markup or blocks headless): open the gallery in a
 * normal browser, pick a project, save 3 images into lab/.refs/<date>-<slug>/,
 * then run `pnpm lab:behance --url <project-url>` (it skips the gallery step), or
 * fill `source` in the component meta by hand. Never block the daily run on it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const USED = path.join(ROOT, "lab", "behance-used.json");
const argv = process.argv.slice(2);
const opt = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
const DRY = argv.includes("--dry");
const GALLERIES = ["ui-ux", "graphic-design", "motion"].map((g) => `https://www.behance.net/galleries/${g}`);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const today = () => new Date().toISOString().slice(0, 10);
const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "projeto";
const idOf = (url) => url.match(/\/gallery\/(\d+)/)?.[1];
const used = fs.existsSync(USED) ? JSON.parse(fs.readFileSync(USED, "utf8")) : [];

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ userAgent: UA, locale: "en-US", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  let url = opt("url");
  let gallery = opt("gallery") ?? (url ? "?" : null);
  if (!url) {
    for (const g of GALLERIES) {
      await page.goto(g, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
      await page.waitForTimeout(3500);
      const links = await page
        .$$eval('a[href*="/gallery/"]', (as) => [...new Set(as.map((a) => a.href.split("?")[0]))])
        .catch(() => []);
      const fresh = links.filter((l) => idOf(l) && !used.some((u) => u.id === idOf(l)));
      console.log(`lab:behance: ${g} → ${links.length} projects, ${fresh.length} not used yet`);
      if (fresh.length) {
        url = fresh[Math.floor(Math.random() * fresh.length)];
        gallery = g.split("/").pop();
        break;
      }
    }
  }
  if (!url) throw new Error("no project found in any gallery (see the fallback in this file's header)");

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3500);
  const info = await page.evaluate(() => {
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => {
        try {
          return JSON.parse(s.textContent || "");
        } catch {
          return null;
        }
      })
      .find((j) => j && j.creator);
    const creators = (ld?.creator ?? []).map((c) => c.name).filter(Boolean);
    return {
      title: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || document.querySelector("h1")?.textContent?.trim() || "",
      creators,
      images: [...new Set([...document.querySelectorAll('img[src*="project_modules"]')].map((i) => i.currentSrc || i.src))],
    };
  });
  // A studio account among the co-owners wins over the list of people.
  const team = info.creators.find((c) => /studio|agency|team|lab|design co|collective/i.test(c));
  const studio =
    team ?? (info.creators.length > 2 ? `${info.creators.slice(0, 2).join(", ")} +${info.creators.length - 2}` : info.creators.join(", "));
  const slug = slugify(info.title);
  const dir = path.join(ROOT, "lab", ".refs", `${today()}-${slug}`);
  const refs = [];
  if (!DRY) {
    fs.mkdirSync(dir, { recursive: true });
    for (const src of info.images.slice(0, 3)) {
      const res = await ctx.request.get(src);
      if (!res.ok()) continue;
      const ext = (src.match(/\.(png|jpe?g|webp|gif)(\?|$)/)?.[1] ?? "webp").replace("jpeg", "jpg");
      const file = path.join(dir, `ref-${refs.length + 1}.${ext}`);
      fs.writeFileSync(file, await res.body());
      refs.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    }
    used.push({ id: idOf(url), url, title: info.title, studio, gallery, date: today() });
    fs.writeFileSync(USED, JSON.stringify(used, null, 2) + "\n");
  }
  console.log(JSON.stringify({ title: info.title, url, studio, gallery, slug, refs }, null, 2));
  console.log(`\nnext: look at the refs, then build lab/components/${today()}-<slug>.tsx (lab/RULES.md, "The component")`);
} finally {
  await browser.close();
}
