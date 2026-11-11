#!/usr/bin/env node
/**
 * Portão: a peça responde ao DEDO, sem brigar com a rolagem da página.
 *
 * `interacao-check` prova mouse e teclado. Mouse não descobre o que quebra no
 * celular: o navegador decide em poucos pixels se o arrasto é da página ou da
 * peça, e quando decide pela página a peça recebe `pointercancel` no meio do gesto.
 * Aqui o Chromium roda com toque de verdade (`hasTouch`, `isMobile`, 390x844) e os
 * gestos saem por CDP (`Input.dispatchTouchEvent`), que passa pelo mesmo
 * reconhecedor de gesto da tela: rolagem real, `touch-action` real, `click` real.
 *
 * Pra cada peça visual, em três contextos:
 *   ficha   /c/<nome>
 *   alto    card na grade da família, com ?nivel=alto
 *   padrao  card na grade da família, no nível que o celular mede sozinho
 *
 * Mede: toque nos controles, arrasto horizontal, arrasto vertical, press longo.
 * Cada resultado cai em uma de três: responde, conflito, sem gesto por natureza.
 *
 *   npm run check:toque                          # tudo, 4 trabalhadores
 *   node scripts/toque-check.mjs --only kanban,knob
 *   node scripts/toque-check.mjs --familia controles --ctx ficha,padrao
 *   node scripts/toque-check.mjs --continuar     # pula o que já está no progresso
 *   node scripts/toque-check.mjs --workers 6
 *   node scripts/toque-check.mjs --alvos         # só a área de toque, sem gestos: perf/toque/alvos.json
 *
 * Progresso, uma linha por medição: perf/toque/progresso.jsonl
 * Tabela no fim:                    perf/toque/relatorio.md
 *
 * `--cru` tira o `touch-action` do palco da vitrine e mede o que a peça traz
 * sozinha, que é o que quem instala recebe.
 *
 * Dev server em :5182 (BASE= muda).
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE ?? "http://localhost:5182";
// Fora de test-results/: o Playwright apaga aquela pasta a cada rodada da suíte.
const SAIDA = join(ROOT, "perf", "toque");
const PROGRESSO = join(SAIDA, "progresso.jsonl");
const RELATORIO = join(SAIDA, "relatorio.md");

const args = process.argv.slice(2);
const valor = (flag) => {
  const i = args.indexOf(flag);
  return i > -1 ? args[i + 1] : undefined;
};
const only = valor("--only")?.split(",");
const familiaPedida = valor("--familia");
const contextos = args.includes("--alvos") ? ["ficha"] : valor("--ctx")?.split(",") ?? ["ficha", "alto", "padrao"];
const workers = Number(valor("--workers") ?? 4);
const continuar = args.includes("--continuar");
const cru = args.includes("--cru");
const soAlvos = args.includes("--alvos");
const ALVOS = join(SAIDA, "alvos.json");
/** A régua: 44px menos um de folga, porque o centro cai em fração quando o vizinho tem largura de texto. */
const ALVO_MIN = 43;
const parcial = Boolean(only || familiaPedida || valor("--ctx") || soAlvos);

/**
 * Quem pode segurar o arrasto vertical, e por quê. Fora desta lista, arrasto
 * vertical sobre a peça é da página. O portão reprova qualquer outra.
 */
const SEGURA_VERTICAL = {
  "pull-to-refresh": "puxar pra baixo é o gesto; pra cima a página rola",
  "time-dial": "o dial gira nos dois eixos, em área reservada",
  "date-reel": "o carretel rola na vertical",
  "signature-pad": "desenhar usa os dois eixos: a área é reservada",
  "sticker-peel": "descolar usa os dois eixos: a área é o próprio adesivo",
  "page-curl": "virar a página usa os dois eixos em área reservada",
  "folding-bill": "dobrar a conta é arrastar em pé",
  "orbit-menu": "o botão segura o dedo pra escolher em volta, área de um botão",
  "vintage-knob": "o knob gira arrastando em pé, área do próprio knob",
  "vintage-large-knob": "o knob gira arrastando em pé, área do próprio knob",
  "vintage-eq": "cada fader é vertical",
  "vintage-xy-pad": "o campo usa os dois eixos: a área é reservada",
  "vintage-parametric-eq": "as alças andam nos dois eixos",
  compass: "gesto circular só no mostrador redondo: fora dele a página rola",
  ratchet: "gesto circular só na roda: fora dela a página rola",
  "word-dial": "gesto circular só no anel: fora dele a página rola",
};

/** Gritos combinados: o mesmo filtro de tests/vitrine.spec.ts e do interacao-check. */
const AVISO_COMBINADO = /\[OctahedronLoader\]|\[palco\]|Download the React DevTools|WebGL|GPU stall/;

/** Controles que se sobrepõem por desenho: o da frente é o que recebe o toque. */
const SOBREPOSTO = { "carousel-3d": "cartões em 3D em volta do eixo: o da frente recebe o toque" };

const PECAS_GPU = new Set(Object.keys(JSON.parse(readFileSync(join(ROOT, "src", "app", "gpu.generated.json"), "utf8"))));
const TELA = { width: 390, height: 844 };
const MIN_DIFF = 0.0025;

/* ── Dentro da página ─────────────────────────────────────────────────────── */

/** Registra quem escuta ponteiro no DOM: as peças que usam `addEventListener` e framer-motion não aparecem nas props do React. */
const INIT = () => {
  const escutas = new WeakMap();
  const orig = EventTarget.prototype.addEventListener;
  const INTERESSA = /^(pointer|mouse|touch|click|wheel|contextmenu|drag)/;
  EventTarget.prototype.addEventListener = function (tipo, fn, op) {
    if (typeof tipo === "string" && INTERESSA.test(tipo) && this instanceof Element) {
      if (!escutas.has(this)) escutas.set(this, new Set());
      escutas.get(this).add(tipo);
    }
    return orig.call(this, tipo, fn, op);
  };
  window.__tq = {
    escutas,
    c: {},
    zerar() {
      this.c = {};
    },
  };
  for (const t of ["pointerdown", "pointermove", "pointerup", "pointercancel", "touchcancel", "contextmenu", "click"])
    orig.call(window, t, () => (window.__tq.c[t] = (window.__tq.c[t] ?? 0) + 1), true);
};

const SEL_CONTROLE =
  'button, a[href], input:not([type="hidden"]), select, textarea, [role="slider"], [role="switch"], [role="tab"], [role="radio"], [role="checkbox"], [role="button"], [role="combobox"], [role="menuitem"], [role="option"], [role="spinbutton"]';

const inventariar = ([raizSel, SEL]) => {
  const raiz = document.querySelector(raizSel);
  if (!raiz) return null;
  const rp = raiz.getBoundingClientRect();
  const reactDe = (el) => {
    const k = Object.keys(el).find((x) => x.startsWith("__reactProps$"));
    return k ? el[k] : null;
  };
  const nomeDe = (el) =>
    `${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[${el.getAttribute("role")}]` : ""}${
      (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24) ? `"${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 24)}"` : ""
    }`;
  const desc = (el) => (el ? `${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(" ").slice(0, 2).join(".")}` : "nada");
  const naTela = (r) => {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return r.width > 2 && r.height > 2 && cx >= Math.max(rp.left, 0) && cx <= Math.min(rp.right, innerWidth) && cy >= Math.max(rp.top, 0) && cy <= Math.min(rp.bottom, innerHeight);
  };
  const visivel = (el) => {
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[inert]") && !el.closest('[aria-hidden="true"]');
  };

  let id = 0;
  const controles = [];
  const arrastos = [];
  const hover = [];
  const touchActions = new Set();
  const todos = [...raiz.querySelectorAll("*")];
  for (const el of todos) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || !visivel(el)) continue;
    const cs = getComputedStyle(el);
    const p = reactDe(el) ?? {};
    const nat = window.__tq.escutas.get(el) ?? new Set();
    const desce = p.onPointerDown || p.onMouseDown || p.onTouchStart || nat.has("pointerdown") || nat.has("mousedown") || nat.has("touchstart");
    const move = p.onPointerMove || p.onMouseMove || p.onTouchMove || nat.has("pointermove") || nat.has("mousemove") || nat.has("touchmove");
    const so_hover = !desce && (p.onMouseEnter || p.onPointerEnter || p.onMouseMove || p.onPointerMove || nat.has("pointerenter") || nat.has("mouseenter") || nat.has("pointermove") || nat.has("mousemove"));
    if (cs.touchAction !== "auto" && cs.touchAction !== "manipulation") touchActions.add(cs.touchAction);
    const cursorArrasto = /^(grab|grabbing|ew-resize|ns-resize|col-resize|row-resize|move)$/.test(cs.cursor);
    const ehSlider = el.getAttribute("role") === "slider" || (el.tagName === "INPUT" && el.type === "range");
    if (!naTela(r)) continue;
    if (el.matches(SEL) || p.onClick) {
      const i = id++;
      el.setAttribute("data-tq-i", String(i));
      controles.push({ i, nome: nomeDe(el), x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, area: r.width * r.height });
    }
    if (desce || cursorArrasto || ehSlider || cs.touchAction === "none" || cs.touchAction.startsWith("pan-")) {
      arrastos.push({
        nome: nomeDe(el),
        desc: desc(el),
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        w: r.width,
        h: r.height,
        ta: cs.touchAction,
        cursor: cs.cursor,
        slider: ehSlider,
        move: Boolean(move),
        grab: cursorArrasto,
      });
    } else if (so_hover) {
      hover.push(nomeDe(el));
    }
  }
  /*
   * A área de toque é o que o DEDO acerta, não a caixa: `getBoundingClientRect` não
   * vê o `::after` invisível, e o vizinho por cima conta contra. Mesma medida em cruz
   * de tests/mobile.spec.ts. `esc` é a redução do palco: a peça dá 44px no espaço
   * dela e a régua desconta o que a vitrine encolheu (quem instala não tem palco).
   */
  for (const c of controles) {
    const el = raiz.querySelector(`[data-tq-i="${c.i}"]`);
    if (!el) continue;
    const slider = el.getAttribute("role") === "slider";
    const meu = (x, y) => {
      const t = document.elementFromPoint(x, y);
      if (!t) return false;
      if (t === el || el.contains(t) || t.closest("[data-bug-botao]") || el.closest("label")?.contains(t)) return true;
      // Num slider o dedo pega a trilha inteira, não só a alça.
      if (slider) {
        let a = t;
        while (a && a !== raiz) {
          if (a.contains(el) && (reactDe(a) ?? {}).onPointerDown) return true;
          a = a.parentElement;
        }
      }
      return false;
    };
    c.esc = +(el.offsetWidth ? c.w / el.offsetWidth : (el.getScreenCTM?.()?.a ?? 1)).toFixed(2);
    c.desligado = el.disabled === true || getComputedStyle(el).pointerEvents === "none";
    if (!meu(c.x, c.y)) {
      c.tw = c.th = 0;
      continue;
    }
    const andar = (dx, dy) => {
      let n = 0;
      while (n < 40 && meu(c.x + dx * (n + 1), c.y + dy * (n + 1))) n++;
      return n;
    };
    c.tw = andar(-1, 0) + andar(1, 0) + 1;
    c.th = andar(0, -1) + andar(0, 1) + 1;
  }
  // O próprio palco/raiz podem escutar.
  const cobertos = [];
  for (const c of controles.slice(0, 14)) {
    const el = raiz.querySelector(`[data-tq-i="${c.i}"]`);
    if (!el) continue;
    const hit = document.elementFromPoint(c.x, c.y);
    // O botão de reportar bug só existe em dev: não é cobertura de quem visita.
    if (hit?.closest("[data-bug-botao]")) continue;
    const meu = hit && (hit === el || el.contains(hit) || hit.contains(el) || hit.closest("label")?.contains(el) || el.closest("label")?.contains(hit));
    if (!meu) cobertos.push(`${c.nome} ⟵ ${desc(hit)}`);
  }
  const fotos = [...raiz.querySelectorAll("img[data-foto-palco]")].filter((f) => parseFloat(getComputedStyle(f).opacity) > 0.5);
  return {
    palco: { x: rp.left, y: rp.top, w: rp.width, h: rp.height },
    controles,
    arrastos,
    hover,
    cobertos,
    touchActions: [...touchActions],
    foto: fotos.length > 0,
  };
};

/** Conta mudanças no DOM do palco e em portais. */
const armarMutacao = (raizSel) => {
  const raiz = document.querySelector(raizSel);
  window.__tqMut?.disconnect();
  window.__tqN = 0;
  window.__tqPortal = 0;
  const mo = new MutationObserver((ls) => {
    for (const m of ls) {
      if (m.target === document.body) {
        if (m.addedNodes.length) window.__tqPortal++;
      } else if (m.type === "attributes" && /^(aria-|data-state|value|checked|open)/.test(m.attributeName ?? "")) window.__tqN++;
    }
  });
  if (raiz) mo.observe(raiz, { subtree: true, attributes: true, attributeFilter: ["aria-checked", "aria-pressed", "aria-expanded", "aria-selected", "aria-valuenow", "aria-valuetext", "data-state", "value", "checked", "open"] });
  mo.observe(document.body, { childList: true });
  window.__tqMut = mo;
};

/* ── Comparação de imagem, numa página à parte ────────────────────────────── */

async function novoComparador(nav) {
  const pg = await (await nav.newContext()).newPage();
  await pg.goto("about:blank");
  return async (a, b) => {
    if (a === b) return 0;
    return pg.evaluate(
      async ([x, y]) => {
        const carregar = (s) =>
          new Promise((ok, erro) => {
            const i = new Image();
            i.onload = () => ok(i);
            i.onerror = erro;
            i.src = `data:image/png;base64,${s}`;
          });
        const [i, j] = await Promise.all([carregar(x), carregar(y)]);
        if (i.width !== j.width || i.height !== j.height) return 1;
        const pix = (im) => {
          const c = document.createElement("canvas");
          c.width = im.width;
          c.height = im.height;
          const g = c.getContext("2d", { willReadFrequently: true });
          g.drawImage(im, 0, 0);
          return g.getImageData(0, 0, im.width, im.height).data;
        };
        const p = pix(i);
        const q = pix(j);
        let n = 0;
        for (let k = 0; k < p.length; k += 4) {
          if (Math.abs(p[k] - q[k]) + Math.abs(p[k + 1] - q[k + 1]) + Math.abs(p[k + 2] - q[k + 2]) > 30) n++;
        }
        return n / (p.length / 4);
      },
      [a, b],
    );
  };
}

/* ── Gestos ───────────────────────────────────────────────────────────────── */

function dedos(cdp, p) {
  const envia = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  return {
    async toque(x, y) {
      await envia("touchStart", x, y);
      await p.waitForTimeout(40);
      await envia("touchEnd");
    },
    /** Arrasto com foto no meio: `durante` roda com o dedo ainda na tela. */
    async arrastar(x0, y0, x1, y1, durante) {
      const n = 14;
      await envia("touchStart", x0, y0);
      await p.waitForTimeout(30);
      for (let i = 1; i <= n; i++) {
        await envia("touchMove", x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
        await p.waitForTimeout(16);
      }
      const r = durante ? await durante() : null;
      await envia("touchEnd");
      return r;
    },
    async segurar(x, y, ms, durante) {
      await envia("touchStart", x, y);
      await p.waitForTimeout(ms);
      const r = durante ? await durante() : null;
      await envia("touchEnd");
      return r;
    },
  };
}

/** O ponto de partida do arrasto: o que declara ser arrastável, antes do miolo do palco. */
function escolherAlvo(inv) {
  const { palco, arrastos } = inv;
  const nota = (a) =>
    (a.slider ? 100 : 0) + (a.ta === "none" || a.ta.startsWith("pan-") ? 50 : 0) + (a.grab ? 40 : 0) + (a.move ? 20 : 0) + (/^(button|a)\b/.test(a.nome) ? -30 : 0) + Math.min(10, (a.w * a.h) / 2000);
  const melhor = [...arrastos].sort((a, b) => nota(b) - nota(a))[0];
  return melhor && nota(melhor) > 0 ? melhor : { x: palco.x + palco.w / 2, y: palco.y + palco.h / 2, nome: "miolo do palco", desc: "palco", ta: "auto", cursor: "auto" };
}

async function medir(job, nav, comparar) {
  const { nome, familia, ctx: tipo } = job;
  const r = { nome, familia, ctx: tipo, erros: [], motivos: [] };
  const ctx = await nav.newContext({ viewport: TELA, screen: TELA, hasTouch: true, isMobile: true, deviceScaleFactor: 1, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  await ctx.addInitScript(INIT);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => r.erros.push("pageerror: " + String(e).slice(0, 160)));
  p.on("console", (m) => m.type() === "error" && !AVISO_COMBINADO.test(m.text()) && !/Failed to load resource|net::ERR/.test(m.text()) && r.erros.push("console: " + m.text().slice(0, 160)));
  const cdp = await ctx.newCDPSession(p);
  const d = dedos(cdp, p);

  const raizSel = tipo === "ficha" ? "[data-ficha] [data-palco]" : `article[data-name="${nome}"] [data-palco]`;
  const url = tipo === "ficha" ? `${BASE}/c/${nome}` : `${BASE}/catalogo/${familia}${tipo === "alto" ? "?nivel=alto" : ""}`;
  const urlInicial = () => new URL(p.url()).pathname;
  let caminho = "";

  async function abrir() {
    await p.goto(url, { waitUntil: "load" });
    caminho = urlInicial();
    const ok = await p.waitForSelector(raizSel, { timeout: 15000 }).then(() => true, () => false);
    if (!ok) return false;
    if (tipo === "ficha") {
      await p.waitForTimeout(1400);
      // Cena WebGL carrega devagar no software: sem isto os controles dela ainda não escutam nada.
      if (PECAS_GPU.has(nome)) await p.waitForTimeout(3500);
    } else {
      await p.evaluate((s) => document.querySelector(s).closest("article").scrollIntoView({ block: "center" }), raizSel);
      await p.waitForTimeout(600);
      // A peça tem tempo de acordar sozinha, se a regra do nível deixar.
      const inicio = Date.now();
      await p
        .waitForFunction(
          (s) => {
            const a = document.querySelector(s)?.closest("article");
            if (!a?.hasAttribute("data-viva")) return false;
            const f = a.querySelector("img[data-foto-palco]");
            return !f || parseFloat(getComputedStyle(f).opacity) < 0.1;
          },
          raizSel,
          { timeout: tipo === "alto" ? 6000 : 2500 },
        )
        .then(() => (r.vivaMs = Date.now() - inicio), () => {});
      await p.waitForTimeout(400);
    }
    if (cru) await p.addStyleTag({ content: "[data-palco]{touch-action:auto!important}" });
    await p.evaluate(armarMutacao, raizSel);
    return true;
  }

  const inv = async () => p.evaluate(inventariar, [raizSel, SEL_CONTROLE]);
  const foto = async (caixa) => {
    const { x, y, w, h } = caixa;
    const cx = Math.min(Math.max(0, x), TELA.width - 2);
    const cy = Math.min(Math.max(0, y), TELA.height - 2);
    const clip = { x: cx, y: cy, width: Math.max(1, Math.min(w, TELA.width - cx)), height: Math.max(1, Math.min(h - (cy - y), TELA.height - cy)) };
    return (await p.screenshot({ clip, animations: "allow" })).toString("base64");
  };
  const lerEstado = () =>
    p.evaluate(() => {
      const c = window.__tq.c;
      const s = { scrollY, scrollX, zoom: visualViewport?.scale ?? 1, c: { ...c }, mut: window.__tqN ?? 0, portal: window.__tqPortal ?? 0 };
      return s;
    });
  const zerar = () => p.evaluate(() => { window.__tq.zerar(); window.__tqN = 0; window.__tqPortal = 0; });
  const internos = (raiz) =>
    p.evaluate((s) => {
      const r = document.querySelector(s);
      if (!r) return 0;
      let t = 0;
      for (const e of [r, ...r.querySelectorAll("*")]) t += e.scrollTop + e.scrollLeft;
      return t;
    }, raiz);
  const abriuFicha = () => urlInicial() !== caminho;

  if (!(await abrir())) {
    r.semPalco = true;
    await ctx.close();
    classificar(r);
    return r;
  }

  /* ── Parado: o que há aqui, e o quanto a peça mexe sozinha ─────────────── */
  let i0 = await inv();
  r.fotoInicial = i0.foto;
  r.controles = i0.controles.length;
  r.arrastos = i0.arrastos.map((a) => `${a.nome}|${a.ta}|${a.cursor}`).slice(0, 6);
  r.touchActions = i0.touchActions;
  r.hover = i0.hover.slice(0, 3);
  r.cobertos = i0.cobertos;
  if (tipo === "ficha") {
    // `pequenos` é a caixa desenhada (cortada em 6 por peça); `curtos` é o que o dedo acerta, todos.
    r.pequenos = i0.controles.filter((c) => c.w < 40 || c.h < 40).map((c) => `${c.nome} ${Math.round(c.w)}x${Math.round(c.h)}`).slice(0, 6);
    r.curtos = i0.controles.filter((c) => !c.desligado && (c.tw < ALVO_MIN * (c.esc ?? 1) || c.th < ALVO_MIN * (c.esc ?? 1))).map((c) => `${c.nome} ${c.tw}x${c.th}${c.esc < 0.98 ? ` @${c.esc}` : ""}`);
  }
  if (soAlvos) {
    r.caixa = i0.controles.filter((c) => c.w < 40 || c.h < 40).length;
    await ctx.close();
    r.cat = "alvos";
    return r;
  }

  const a0 = await foto(i0.palco);
  await p.waitForTimeout(500);
  const a1 = await foto(i0.palco);
  const idle = await comparar(a0, a1);
  r.idle = +idle.toFixed(4);
  const muTela = Math.max(MIN_DIFF, idle * 2);
  const mudou = (v) => v > muTela;

  /* ── Foto: toque no palco acorda? ─────────────────────────────────────── */
  if (i0.foto) {
    await zerar();
    const t = Date.now();
    await d.toque(i0.palco.x + i0.palco.w / 2, i0.palco.y + i0.palco.h / 2);
    await p.waitForTimeout(150);
    r.toqueNaFotoAbriu = abriuFicha();
    if (r.toqueNaFotoAbriu) {
      await abrir();
    } else {
      const acordou = await p
        .waitForFunction(
          (s) => {
            const a = document.querySelector(s)?.closest("article");
            if (!a?.hasAttribute("data-viva")) return false;
            const f = a.querySelector("img[data-foto-palco]");
            return !f || parseFloat(getComputedStyle(f).opacity) < 0.1;
          },
          raizSel,
          { timeout: 6000 },
        )
        .then(() => true, () => false);
      r.fotoAcordou = acordou;
      r.fotoAcordouMs = acordou ? Date.now() - t : null;
      await p.waitForTimeout(400);
      i0 = await inv();
      r.controles = i0.controles.length;
      r.arrastos = i0.arrastos.map((a) => `${a.nome}|${a.ta}|${a.cursor}`).slice(0, 6);
      r.touchActions = i0.touchActions;
      r.cobertos = i0.cobertos;
    }
  }

  /* ── Arrasto horizontal ───────────────────────────────────────────────── */
  const alvo = escolherAlvo(i0);
  r.alvo = `${alvo.nome} (ta:${alvo.ta}, cursor:${alvo.cursor})`;
  r.escala = await p.evaluate((s) => {
    const m = document.querySelector(s)?.firstElementChild;
    return m ? +(m.getBoundingClientRect().width / (m.offsetWidth || 1)).toFixed(2) : null;
  }, raizSel);
  const ehArrasto = Boolean(alvo.slider || alvo.grab || alvo.ta === "none" || alvo.ta?.startsWith("pan-") || alvo.move);
  r.ehArrasto = ehArrasto;
  const yFinal = alvo.y;

  async function arrastoH(x0, y0, x1, y1) {
    const antes = await foto(i0.palco);
    const sc = await internos(raizSel);
    await zerar();
    const s0 = await lerEstado();
    const fotoDurante = await d.arrastar(x0, y0, x1, y1, () => foto(i0.palco));
    await p.waitForTimeout(450);
    const s1 = await lerEstado();
    const fim = abriuFicha() ? antes : await foto(i0.palco);
    const dDurante = await comparar(antes, fotoDurante);
    const dFim = await comparar(antes, fim);
    return {
      dDurante: +dDurante.toFixed(4),
      dFim: +dFim.toFixed(4),
      interna: (await internos(raizSel)) !== sc,
      // Peça animada: a foto não distingue. O ponteiro chegar inteiro no que arrasta, sem cancelar, é a medida.
      mudou:
        mudou(dDurante) || mudou(dFim) || s1.mut > 0 || s1.portal > 0 || (await internos(raizSel)) !== sc ||
        (idle > 0.01 && ehArrasto && !s1.c.pointercancel && (s1.c.pointermove ?? 0) >= 5),
      moves: s1.c.pointermove ?? 0,
      cancel: s1.c.pointercancel ?? 0,
      desceu: s1.c.pointerdown ?? 0,
      clique: s1.c.click ?? 0,
      dy: s1.scrollY - s0.scrollY,
      dx: s1.scrollX - s0.scrollX,
      zoom: s1.zoom,
      abriu: abriuFicha(),
    };
  }

  const margem = 14;
  const esq = i0.palco.x + margem;
  const dir = Math.min(i0.palco.x + i0.palco.w, TELA.width) - margem;
  const destinoX = alvo.x < (esq + dir) / 2 ? Math.min(dir, alvo.x + 130) : Math.max(esq, alvo.x - 130);
  r.H = await arrastoH(alvo.x, yFinal, destinoX, yFinal);
  if (r.H.abriu) await abrir();
  // Trilho que só anda pro outro lado, ou peça de canto.
  if (!r.H.mudou && !r.H.abriu) {
    const voltaX = destinoX > alvo.x ? Math.max(esq, alvo.x - 130) : Math.min(dir, alvo.x + 130);
    const r2 = await arrastoH(alvo.x, yFinal, voltaX, yFinal);
    r.H2 = r2;
    if (r2.mudou || r2.abriu) r.H = { ...r2, cancel: Math.min(r2.cancel, r.H.cancel) };
    if (r2.abriu) await abrir();
  }

  // Arrastar depois de segurar: o gesto do kanban (o sensor espera 250ms pra não tomar a rolagem).
  if (!r.H.mudou && !r.H.abriu && ehArrasto) {
    const antes = await foto(i0.palco);
    await zerar();
    await d.segurar(alvo.x, yFinal, 330);
    await p.waitForTimeout(60);
    const sLonga = await foto(i0.palco);
    await zerar();
    const envia = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await envia("touchStart", alvo.x, yFinal);
    await p.waitForTimeout(330);
    let durante = null;
    for (let i = 1; i <= 14; i++) {
      await envia("touchMove", alvo.x + ((destinoX - alvo.x) * i) / 14, yFinal);
      await p.waitForTimeout(16);
    }
    durante = await foto(i0.palco);
    await envia("touchEnd");
    await p.waitForTimeout(450);
    const s1 = await lerEstado();
    const fim = abriuFicha() ? antes : await foto(i0.palco);
    r.P = { mudou: mudou(await comparar(sLonga, durante)) || mudou(await comparar(antes, fim)), cancel: s1.c.pointercancel ?? 0, abriu: abriuFicha() };
    if (r.P.mudou) r.H = { ...r.H, mudou: true, cancel: 0, peloPress: true };
    if (r.P.abriu) await abrir();
  }

  /* ── Arrasto vertical: a página tem de rolar ──────────────────────────── */
  await p.evaluate(() => window.scrollTo({ top: Math.min(scrollY, 200), behavior: "instant" }));
  if (tipo !== "ficha") await p.evaluate((s) => document.querySelector(s).closest("article").scrollIntoView({ block: "center" }), raizSel);
  await p.waitForTimeout(250);
  const iV = await inv();
  if (!iV) throw new Error("o palco sumiu depois do arrasto horizontal");
  const alvoV = escolherAlvo(iV);
  {
    const antes = await foto(iV.palco);
    const sc = await internos(raizSel);
    await zerar();
    const s0 = await lerEstado();
    const folga = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
    r.V_semFolga = folga < 60 && s0.scrollY < 60;
    await d.arrastar(alvoV.x, alvoV.y, alvoV.x, folga >= 60 ? Math.max(90, alvoV.y - 240) : Math.min(TELA.height - 10, alvoV.y + 240));
    await p.waitForTimeout(650);
    const s1 = await lerEstado();
    r.V = {
      dy: Math.round(s1.scrollY - s0.scrollY),
      interna: (await internos(raizSel)) !== sc,
      cancel: s1.c.pointercancel ?? 0,
      abriu: abriuFicha(),
      ponto: alvoV.nome,
    };
    // A página não rolou: a peça é de arrasto vertical? O gesto vale nos dois sentidos.
    // Quem puxa pra baixo (pull-to-refresh) rola a página pra cima: o gesto dele é o outro sentido.
    if ((Math.abs(r.V.dy) < 40 || SEGURA_VERTICAL[r.nome]) && !r.V.abriu) {
      if (Math.abs(r.V.dy) >= 40) await zerar();
      const dep = await foto(iV.palco);
      const inter = await d.arrastar(alvoV.x, alvoV.y, alvoV.x, Math.min(TELA.height - 10, alvoV.y + 160), () => foto(iV.palco));
      await p.waitForTimeout(350);
      r.V.dFim = +(await comparar(antes, dep)).toFixed(4);
      r.V.mudou = mudou(r.V.dFim) || mudou(await comparar(antes, inter));
    }
    if (abriuFicha()) {
      r.V.abriu = true;
      await abrir();
    }
  }

  /* ── Press longo ──────────────────────────────────────────────────────── */
  await abrir();
  const iL = await inv();
  const alvoL = (iL.controles.find((c) => c.w > 20) ?? escolherAlvo(iL));
  {
    const antes = await foto(iL.palco);
    await zerar();
    const durante = await d.segurar(alvoL.x, alvoL.y, 800, () => foto(iL.palco));
    await p.waitForTimeout(350);
    const s1 = await lerEstado();
    const fim = abriuFicha() ? antes : await foto(iL.palco);
    r.L = {
      mudou: mudou(await comparar(antes, durante)) || mudou(await comparar(antes, fim)) || s1.mut > 0 || s1.portal > 0,
      menu: s1.c.contextmenu ?? 0,
      abriu: abriuFicha(),
    };
  }

  /* ── Toque: um por controle, do maior pro menor ───────────────────────── */
  await abrir();
  if (process.env.TQ_DEBUG === nome) console.error("TQ_DEBUG apos abrir()", JSON.stringify(await lerEstado()));
  const iT = await inv();
  r.toques = [];
  const fila = [...iT.controles].sort((a, b) => b.area - a.area).slice(0, 4);
  if (!fila.length) fila.push({ nome: "miolo do palco", x: iT.palco.x + iT.palco.w / 2, y: iT.palco.y + iT.palco.h / 2 });
  for (const c of fila) {
    const antes = await foto(iT.palco);
    const texto = () => p.evaluate((s) => document.querySelector(s)?.innerText ?? "", raizSel);
    const t0 = await texto();
    await zerar();
    const s0 = await lerEstado();
    await d.toque(c.x, c.y);
    await p.waitForTimeout(450);
    const s1 = await lerEstado();
    const abriu = abriuFicha();
    const fim = abriu ? antes : await foto(iT.palco);
    const dv = await comparar(antes, fim);
    const textoMudou = !abriu && (await texto()) !== t0;
    const botao = /^(button|a)\b/.test(c.nome);
    r.toques.push({
      nome: c.nome,
      // Botão numa peça que anima sozinha: a foto já difere sem toque, e o clique chegar é a medida.
      mudou: mudou(dv) || s1.mut > 0 || s1.portal > 0 || textoMudou || (idle > 0.01 && botao && (s1.c.click ?? 0) > 0),
      abriu,
      dy: s1.scrollY - s0.scrollY,
      clique: s1.c.click ?? 0,
      botao,
    });
    if (abriu || s1.portal > 0 || (await p.locator('[role="dialog"]').count())) break;
  }

  /* ── Depois de tudo: a rolagem não ficou presa ───────────────────────── */
  if (!abriuFicha() && !(await p.locator('[role="dialog"], [data-radix-popper-content-wrapper]').count())) {
    const s0 = await lerEstado();
    const folga = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
    /* De um ponto que é da casa, não de uma peça vizinha: o rodapé do card, ou o pé da ficha. */
    const ponto = await p.evaluate((s) => {
      const a = document.querySelector(s)?.closest("article");
      const r = a?.getBoundingClientRect();
      const palco = document.querySelector(s)?.getBoundingClientRect();
      /* Rodapé coberto pela barra sticky ou alto demais pro arrasto de 240px não vale: o dedo cairia na barra e andaria 10px. */
      const y = r ? r.bottom - 8 : 0;
      if (a && a.matches("[data-name]") && r && palco && r.bottom > palco.bottom + 8 && r.bottom < innerHeight && y >= 330 && a.contains(document.elementFromPoint(40, y))) return { x: 40, y };
      return { x: 195, y: Math.max(palco ? palco.bottom + 30 : 0, 600) };
    }, raizSel);
    const py = Math.min(ponto.y, TELA.height - 20);
    /* Palco maior que a tela e com rolagem própria (pinned-scene): o dedo só cai nele, e quem rola é ele. */
    const dentroDoPalco = await p.evaluate(([s, x, y]) => Boolean(document.querySelector(s)?.contains(document.elementFromPoint(x, y))), [raizSel, ponto.x, py]);
    if (process.env.TQ_DEBUG === nome) {
      const diag = await p.evaluate(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        const cadeia = [];
        for (let e = hit; e; e = e.parentElement) cadeia.push(`${e.tagName.toLowerCase()}.${String(e.className).split(" ").slice(0, 2).join(".")} [ta:${getComputedStyle(e).touchAction} pos:${getComputedStyle(e).position}]`);
        return { scrollY, scrollHeight: document.documentElement.scrollHeight, innerHeight, hitTag: hit?.tagName, cadeia: cadeia.slice(0, 8) };
      }, [ponto.x, py]);
      console.error("TQ_DEBUG", JSON.stringify({ ponto, py, folga, dentroDoPalco, ...diag }, null, 1));
    }
    if (dentroDoPalco && r.V?.interna) r.presaIgnorada = true;
    else if (folga >= 60) await d.arrastar(ponto.x, py, ponto.x, Math.max(90, py - 240));
    else await d.arrastar(ponto.x, py, ponto.x, Math.min(TELA.height - 10, py + 240));
    await p.waitForTimeout(500);
    const s1 = await lerEstado();
    r.presa = !r.presaIgnorada && Math.abs(s1.scrollY - s0.scrollY) < 20 && !(folga < 60 && s0.scrollY < 60);
    r.corpo = await p.evaluate(() => `${getComputedStyle(document.body).overflow}/${getComputedStyle(document.documentElement).touchAction}`);
    if (process.env.TQ_DEBUG === nome) console.error("TQ_DEBUG depois", JSON.stringify({ scrollYantes: s0.scrollY, scrollYdepois: s1.scrollY, presa: r.presa }));
  }

  await ctx.close();
  classificar(r);
  return r;
}

function classificar(r) {
  const m = r.motivos;
  m.push(...r.erros);
  if (r.quebrou) m.push(`teste quebrou: ${r.quebrou}`);
  if (r.cobertos?.length && !SOBREPOSTO[r.nome]) m.push(`controle coberto: ${r.cobertos.slice(0, 2).join("; ")}`);
  if (r.toqueNaFotoAbriu) m.push("toque na foto abriu a ficha");
  if (r.fotoInicial && r.fotoAcordou === false) m.push("o toque não acordou a foto");
  if (r.H?.abriu || r.V?.abriu || r.L?.abriu) m.push("arrasto ou press abriu a ficha");
  if (r.toques?.some((t) => t.abriu && !/^a\b/.test(t.nome))) m.push(`toque abriu a ficha: ${r.toques.find((t) => t.abriu).nome}`);
  if (r.H && Math.abs(r.H.dy) > 30) m.push(`arrasto horizontal rolou a página ${Math.round(r.H.dy)}px`);
  if (r.H && Math.abs(r.H.dx) > 8) m.push(`arrasto horizontal empurrou a página ${Math.round(r.H.dx)}px de lado`);
  if (r.H?.zoom && Math.abs(r.H.zoom - 1) > 0.02) m.push("a tela deu zoom");
  if (r.V && !r.V_semFolga && Math.abs(r.V.dy) < 40 && !r.V.interna && !r.V.abriu && !SEGURA_VERTICAL[r.nome]) m.push(`arrasto vertical não rolou a página (${r.V.dy}px, em ${r.V.ponto})`);
  if (r.ehArrasto && r.H && r.H.cancel > 0 && !r.H.mudou && !r.V?.mudou) m.push("o navegador tomou o arrasto (pointercancel) e a peça não andou");
  // Trilho com rolagem nativa recebe pointercancel e anda sozinho: é o caminho certo.
  if (r.ehArrasto && r.H && r.H.cancel > 0 && r.H.mudou && !r.H.interna && !r.H.peloPress && !SEGURA_VERTICAL[r.nome]) m.push("pointercancel no meio do arrasto");
  if (r.presa) m.push(`a rolagem ficou presa depois dos gestos (${r.corpo})`);
  /* Efeito que segue o ponteiro (shader, cursor): o ponteiro chega até ela no toque, sem cancelar. */
  const ponteiroChega = Boolean(r.hover?.length && r.H && r.H.moves >= 5 && !r.H.cancel);
  const respondeu = Boolean(r.H?.mudou || r.V?.mudou || r.L?.mudou || r.toques?.some((t) => t.mudou) || ponteiroChega);
  /* Só botão sem efeito de demo (um CTA sem destino) e o clique chegou: nada a responder, nada quebrado. */
  const soBotaoInerte = (r.controles ?? 0) > 0 && !r.ehArrasto && r.toques?.length && r.toques.every((t) => t.botao && t.clique > 0);
  const temGesto = !soBotaoInerte && ((r.controles ?? 0) > 0 || r.ehArrasto || (r.arrastos?.length ?? 0) > 0);
  if (r.semPalco) r.cat = "fora";
  else if (m.length) r.cat = "conflito";
  else if (respondeu) r.cat = "responde";
  else if (temGesto || r.hover?.length) {
    r.cat = "conflito";
    m.push(r.hover?.length && !r.controles ? "só escuta hover: nada responde ao toque" : "tem controle e nada mudou no palco");
  } else r.cat = "sem-gesto";
}

/* ── Fila e relatório ─────────────────────────────────────────────────────── */

async function catalogo(nav) {
  const c = await nav.newContext();
  const pg = await c.newPage();
  await pg.goto(BASE, { waitUntil: "load" });
  const lista = await pg.evaluate(async () => {
    const m = await import("/src/app/catalog.tsx");
    return m.CATALOG.filter(m.ehPecaVisual).map((i) => ({ nome: i.name, familia: i.family }));
  });
  await c.close();
  return lista;
}

function escreverRelatorio(todos) {
  const porCtx = (ctx) => todos.filter((r) => r.ctx === ctx);
  const conta = (lista, cat) => lista.filter((r) => r.cat === cat).length;
  const linhas = ["# Portão de toque", "", "| contexto | responde | conflito | sem gesto | fora da grade |", "|---|---|---|---|---|"];
  for (const ctx of ["ficha", "alto", "padrao"]) {
    const l = porCtx(ctx);
    if (l.length) linhas.push(`| ${ctx} | ${conta(l, "responde")} | ${conta(l, "conflito")} | ${conta(l, "sem-gesto")} | ${conta(l, "fora")} |`);
  }
  const motivos = new Map();
  for (const r of todos) for (const m of r.motivos ?? []) {
    const chave = m.replace(/\(.*?\)|-?\d+px|"[^"]*"|⟵.*$/g, "").trim().slice(0, 60);
    motivos.set(chave, (motivos.get(chave) ?? 0) + 1);
  }
  linhas.push("", "## Padrões", "", ...[...motivos].sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${v}x ${k}`));
  linhas.push("", "## Por peça", "", "| peça | família | ficha | alto | padrão |", "|---|---|---|---|---|");
  const nomes = [...new Set(todos.map((r) => r.nome))].sort();
  for (const n of nomes) {
    const de = (c) => todos.find((r) => r.nome === n && r.ctx === c)?.cat ?? "-";
    linhas.push(`| ${n} | ${todos.find((r) => r.nome === n).familia} | ${de("ficha")} | ${de("alto")} | ${de("padrao")} |`);
  }
  linhas.push("", "## Conflitos", "");
  for (const r of todos.filter((x) => x.cat === "conflito")) linhas.push(`- **${r.nome}** (${r.ctx}): ${r.motivos.join("; ")}`);
  writeFileSync(RELATORIO, linhas.join("\n") + "\n");
  return linhas.slice(0, 7 + motivos.size + 3).join("\n");
}

mkdirSync(SAIDA, { recursive: true });
if (!continuar && !parcial && existsSync(PROGRESSO)) rmSync(PROGRESSO);

const nav = await chromium.launch();
const pecas = await catalogo(nav);
let alvos = pecas;
if (only) alvos = alvos.filter((p) => only.includes(p.nome));
if (familiaPedida) alvos = alvos.filter((p) => p.familia === familiaPedida);

const lerProgresso = () =>
  existsSync(PROGRESSO)
    ? readFileSync(PROGRESSO, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : [];

const feitos = new Set(continuar ? lerProgresso().map((r) => `${r.nome}|${r.ctx}`) : []);
const jobs = [];
for (const peca of alvos)
  for (const ctx of contextos) {
    if (feitos.has(`${peca.nome}|${ctx}`)) continue;
    // Shader não tem card na família: a aba é o ShaderLab, medido na ficha.
    if (ctx !== "ficha" && peca.familia === "shaders") continue;
    jobs.push({ nome: peca.nome, familia: peca.familia, ctx });
  }

console.log(`${jobs.length} medições em ${alvos.length} peças, ${workers} trabalhadores. Progresso: ${PROGRESSO}`);
let feitasAgora = 0;
const medidas = [];

async function trabalhador() {
  const comparar = await novoComparador(nav);
  while (jobs.length) {
    const job = jobs.shift();
    let r;
    try {
      const tentar = () =>
        Promise.race([
          medir(job, nav, comparar),
          new Promise((_, erro) => setTimeout(() => erro(new Error("passou de 120s")), 120_000)),
        ]);
      // Uma segunda chance: o dev server recarrega a página quando alguém salva um arquivo.
      r = await tentar().catch(tentar);
    } catch (e) {
      r = { nome: job.nome, familia: job.familia, ctx: job.ctx, erros: [], motivos: [], quebrou: String(e.message).split("\n")[0].slice(0, 140) };
      classificar(r);
    }
    medidas.push(r);
    if (soAlvos) continue;
    appendFileSync(PROGRESSO, JSON.stringify(r) + "\n");
    feitasAgora++;
    console.log(`${r.cat === "conflito" ? "x" : r.cat === "responde" ? "." : "-"} ${r.ctx.padEnd(6)} ${r.nome.padEnd(24)} ${r.cat}${r.motivos.length ? ": " + r.motivos.join("; ").slice(0, 160) : ""}`);
  }
}

await Promise.all(Array.from({ length: workers }, trabalhador));
await nav.close();

if (soAlvos) {
  const com = medidas.filter((r) => r.curtos?.length).sort((a, b) => a.familia.localeCompare(b.familia) || a.nome.localeCompare(b.nome));
  const total = com.reduce((n, r) => n + r.curtos.length, 0);
  writeFileSync(ALVOS, JSON.stringify(com.map(({ nome, familia, curtos }) => ({ nome, familia, curtos })), null, 1) + "\n");
  for (const r of com) console.log(`${r.familia}/${r.nome}: ${r.curtos.join(" | ")}`);
  const quebradas = medidas.filter((r) => r.quebrou).map((r) => r.nome);
  console.log(`\n${medidas.length} peças; ${com.length} com alvo abaixo de 44px; ${total} alvos. Caixa desenhada abaixo de 40px: ${medidas.reduce((n, r) => n + (r.caixa ?? 0), 0)}.${quebradas.length ? ` Quebraram: ${quebradas.join(", ")}` : ""}`);
  process.exit(0);
}

// O relatório junta o que já estava no progresso: a medição mais nova de cada par vale.
const finais = new Map();
for (const r of lerProgresso()) finais.set(`${r.nome}|${r.ctx}`, r);
console.log("\n" + escreverRelatorio([...finais.values()]));
console.log(`\nRelatório: ${RELATORIO}`);
const conflitos = medidas.filter((r) => r.cat === "conflito").length;
console.log(`${feitasAgora} medidas agora, ${conflitos} com conflito.`);
process.exit(conflitos ? 1 : 0);
