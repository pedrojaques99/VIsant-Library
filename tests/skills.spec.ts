import { expect, test } from "@playwright/test";

/*
 * As landings das skills: abrem, não rolam na horizontal, e endereço errado
 * parece errado. As demos têm verificação própria; aqui é o que não pode quebrar
 * calado num deploy.
 */

const PAGINAS = [
  { rota: "/skills", titulo: /Tire a cara de IA/ },
  { rota: "/skills/filme", titulo: /Tire a cara de IA/ },
  { rota: "/skills/killer", titulo: /Tire a cara de IA/ },
];

for (const { rota, titulo } of PAGINAS) {
  for (const largura of [1440, 390]) {
    test(`${rota} abre em ${largura}px sem rolar de lado`, async ({ page }) => {
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(e.message));
      await page.setViewportSize({ width: largura, height: 850 });
      await page.goto(rota);
      await expect(page.locator("h1").first()).toHaveText(titulo, { timeout: 20_000 });
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sobra).toBeLessThanOrEqual(0);
      expect(erros).toEqual([]);
    });
  }
}

test("a pílula pede o e-mail ali mesmo, copia ao confirmar e não pede de novo", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const enviados: { email?: string; origem?: string }[] = [];
  await page.route("**/api/interesse", (r) => {
    if (r.request().method() === "GET") return r.fulfill({ json: { contagens: true, interesse: true } });
    enviados.push(r.request().postDataJSON());
    return r.fulfill({ status: 204 });
  });
  for (const width of [360, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/skills", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("visant:skills-liberado"));
    await page.reload();
    const pilula = page.locator("[data-copiar-agente]");
    await expect(pilula).toBeInViewport({ ratio: 1 });
    await page.evaluate(() => navigator.clipboard.writeText("nada"));
    await pilula.click();

    const campo = page.locator("[data-pedir-email-pilula] input[type=email]");
    await expect(campo).toBeFocused();
    await campo.fill("sem-arroba");
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-pedir-email-pilula]")).toContainText("Confira o e-mail");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("nada");

    await campo.fill("pessoa@exemplo.com");
    await page.keyboard.press("Enter");
    await expect(pilula).toHaveText("Agora cole no agente");
    await expect(pilula).toBeFocused();
    const colado = await page.evaluate(() => navigator.clipboard.readText());
    expect(colado).toContain("npx skills add pedrojaques99/visant-skills-public --skill visant-killer");
    expect(colado).toContain("llms.txt");
    await expect.poll(() => enviados.at(-1)).toMatchObject({ email: "pessoa@exemplo.com", origem: "abertura" });

    // Na volta não pede mais: um toque copia.
    await page.reload();
    await page.evaluate(() => navigator.clipboard.writeText("nada"));
    await pilula.click();
    await expect(pilula).toHaveText("Agora cole no agente");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("npx skills add");
  }
});

test("Esc fecha o campo sem copiar; sem a tabela, a pílula copia direto", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  let tabela = true;
  await page.route("**/api/interesse", (r) => r.fulfill({ json: { contagens: true, interesse: tabela } }));
  await page.goto("/skills");
  const pilula = page.locator("[data-copiar-agente]");
  await pilula.click();
  await page.keyboard.press("Escape");
  await expect(pilula).toHaveText(/Copiar para o agente/);
  await expect(pilula).toBeFocused();

  tabela = false;
  await page.reload();
  await page.waitForResponse("**/api/interesse").catch(() => {});
  await page.waitForTimeout(200);
  await pilula.click();
  await expect(page.locator("[data-pedir-email-pilula]")).toHaveCount(0);
  await expect(pilula).toHaveText("Agora cole no agente");
});

test("o GitHub de /skills é o das skills, na barra e no rodapé; fora dela, o da library", async ({ page }) => {
  await page.goto("/skills");
  const skills = "https://github.com/pedrojaques99/visant-skills-public";
  await expect(page.locator("[data-dock] [data-repo]")).toHaveAttribute("href", skills);
  await expect(page.locator("[data-repo-rodape]")).toHaveAttribute("href", skills);
  await page.goto("/skills/como-usar");
  await expect(page.locator("[data-repo-rodape]")).toHaveAttribute("href", skills);
  await page.goto("/marca");
  await expect(page.locator("[data-repo-rodape]")).toHaveAttribute("href", /Vintageuiuxlibrary$/);
});

test("como usar: um passo por tela, do botão de /skills até o fim", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/skills");
  await page.locator("[data-como-usar-link]").click();
  await expect(page).toHaveURL(/\/skills\/como-usar$/);
  await expect(page.locator("h1")).toHaveText("Envie isso para o seu agente de IA.");
  await page.locator("[data-pedir-email] input[type=email]").fill("pessoa@exemplo.com");
  await page.locator("[data-liberar]").click();
  await expect(page.locator("[data-escrita]")).toHaveAttribute("aria-label", /llms\.txt/);
  await page.locator("[data-copiar-mensagem]").click();
  for (let i = 0; i < 3; i++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.locator("[data-continuar]").click();
    await page.waitForTimeout(350);
  }
  await expect(page.locator("h1")).toHaveText("Pronto.");
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page.locator("h1")).toHaveText("Peça um componente.");
});

test("e-mail: inválido não libera, válido libera, e o banco fora não segura ninguém", async ({ page }) => {
  await page.route("**/api/interesse", (r) => {
    if (r.request().method() === "GET") return r.fulfill({ json: { interesse: true } });
    const { email } = r.request().postDataJSON() as { email: string };
    return r.fulfill(email.includes("@") ? { status: 502, json: { error: "banco fora" } } : { status: 400, json: { error: "e-mail inválido" } });
  });
  await page.goto("/skills/como-usar");
  await page.locator("[data-pedir-email] input[type=email]").fill("sem-arroba");
  await page.locator("[data-liberar]").click();
  await expect(page.locator("[data-pedir-email]")).toContainText("Confira o e-mail");
  await expect(page.locator("[data-copiar-mensagem]")).toHaveCount(0);
  await page.locator("[data-pedir-email] input[type=email]").fill("pessoa@exemplo.com");
  await page.locator("[data-liberar]").click();
  await expect(page.locator("[data-copiar-mensagem]")).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-copiar-mensagem]")).toBeVisible();
});

test("sair da lista: o link do pedido leva ao formulário, e ele confirma", async ({ page }) => {
  await page.route("**/api/interesse", (r) => (r.request().method() === "GET" ? r.fulfill({ json: { interesse: true } }) : r.fulfill({ status: 204 })));
  await page.goto("/skills/como-usar");
  await page.getByRole("link", { name: "Sair da lista" }).click();
  await expect(page).toHaveURL(/sair=1/);
  await page.locator("[data-sair-da-lista] input[type=email]").fill("pessoa@exemplo.com");
  await page.locator("[data-sair]").click();
  await expect(page.locator("h1")).toHaveText("Pronto, saiu.");
});

test("sem a tabela no ar, não pede e-mail: nada se perde", async ({ page }) => {
  await page.route("**/api/interesse", (r) => r.fulfill({ json: { interesse: false } }));
  await page.goto("/skills/como-usar");
  await expect(page.locator("[data-copiar-mensagem]")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-pedir-email]")).toHaveCount(0);
});

test("feedback: ao fim do como usar, envia e agradece", async ({ page }) => {
  await page.route("**/api/interesse", (r) => (r.request().method() === "GET" ? r.fulfill({ json: { interesse: true } }) : r.fulfill({ status: 204 })));
  await page.goto("/skills/como-usar");
  await expect(page.locator("[data-continuar]")).toBeHidden();
  await page.locator("[data-pedir-email] input[type=email]").fill("pessoa@exemplo.com");
  await page.locator("[data-liberar]").click();
  for (let i = 0; i < 3; i++) {
    await page.locator("[data-continuar]").click();
    await page.waitForTimeout(350);
  }
  await page.locator("[data-pedir-feedback] textarea").fill("faltou exemplo");
  await page.locator("[data-enviar-feedback]").click();
  await expect(page.locator("[data-feedback-enviado]")).toContainText("Recebido");
});

test("endereço que não existe mostra 404, e a volta do OAuth não", async ({ page }) => {
  for (const rota of ["/skills/nada", "/nada-aqui"]) {
    await page.goto(rota);
    await expect(page.getByRole("heading", { name: "Essa página não existe." })).toBeVisible();
    await expect(page).toHaveTitle(/não encontrada/);
  }
  await page.goto("/callback");
  await expect(page.getByRole("heading", { name: "Essa página não existe." })).toHaveCount(0);
});

test("a aba Tudo abre pelos destaques do admin", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/catalogo");
  const primeira = page.locator("article[data-name]").first();
  await expect(primeira).toHaveAttribute("data-name", "book-3d");
});
