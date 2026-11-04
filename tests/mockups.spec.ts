import { expect, test } from "@playwright/test";

/*
 * O close centra o ponto de foco fazendo a conta da projeção à mão (`pontoDeFoco`), sem medir a
 * tela: se a conta divergir do CSS, o foco cai no lugar errado e nada quebra. E o quadro do ponto
 * já nasceu com largura zero dentro do painel, sem erro nenhum. É isso que esta suíte prende.
 */

const cena = (modelo: string, rot: object, foco: object) => ({
  modelo,
  rot,
  telaId: "neon",
  foco: { ativo: true, zoom: 1.6, area: 45, desfoque: 10, ...foco },
});

const abrir = async (page, c: object) => {
  await page.goto("/mockups", { waitUntil: "domcontentloaded" });
  await page.evaluate((v) => localStorage.setItem("visant:mockup:2", JSON.stringify(v)), c);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".mk-camada .device-frame");
};

for (const [modelo, rot] of [
  ["phone", { x: 14, y: -12, z: 6 }],
  ["tablet", { x: 14, y: -12, z: 6 }],
  ["laptop", { x: -14, y: -22, z: 0 }],
] as const) {
  test(`${modelo}: o close põe o ponto escolhido no centro do quadro`, async ({ page }) => {
    await abrir(page, cena(modelo, rot, { x: 45, y: 45 }));
    const erro = await page.evaluate(() => {
      const m = document.createElement("span");
      m.style.cssText = "position:absolute;left:45%;top:45%;width:0;height:0";
      document.querySelector(".mk-camada:not(.mk-camada-copia) .device-frame-tela")!.appendChild(m);
      const r = m.getBoundingClientRect();
      const q = document.querySelector(".mk-quadro")!.getBoundingClientRect();
      m.remove();
      return Math.hypot(r.left - (q.left + q.width / 2), r.top - (q.top + q.height / 2));
    });
    expect(erro).toBeLessThan(1);
  });
}

test("o ponto de foco tem tamanho e segue o arrasto", async ({ page }) => {
  await abrir(page, cena("laptop", { x: -14, y: -22, z: 0 }, { x: 50, y: 50 }));
  const alvo = page.getByRole("slider", { name: "Área em foco" });
  await alvo.scrollIntoViewIfNeeded();
  const c = (await alvo.boundingBox())!;
  expect(c.width).toBeGreaterThan(80);
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await page.mouse.down();
  await page.mouse.move(c.x + c.width * 0.25, c.y + c.height * 0.3, { steps: 3 });
  await page.mouse.up();
  await expect(alvo).toHaveAttribute("aria-valuetext", "25% na horizontal, 30% na vertical");
});

test("sem foco não existe cópia; o notebook troca de pose e o Sensor sai da lista", async ({ page }) => {
  await page.goto("/mockups", { waitUntil: "networkidle" });
  await page.waitForSelector(".device-frame");
  await expect(page.locator(".mk-camada-copia")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Sensor" })).toHaveCount(1);

  await page.getByRole("radio", { name: "MacBook" }).click();
  await expect(page.getByRole("textbox", { name: "Rotação X" })).toHaveValue("-14°");
  await expect(page.getByRole("radio", { name: "Sensor" })).toHaveCount(0);

  await page.getByRole("radio", { name: "Close", exact: true }).click();
  await expect(page.locator(".mk-camada-copia")).toHaveCount(1);
  await expect(page.getByRole("radio", { name: "Com foco" })).toHaveAttribute("aria-checked", "true");
});
