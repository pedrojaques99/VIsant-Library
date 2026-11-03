import { defineConfig, devices } from "@playwright/test";

/**
 * A vitrine tinha dois bugs que só apareceram porque o dono do repo olhou a tela
 * — faixa branca no scroll e rolagem órfã ao filtrar. Nenhum dos dois quebra
 * build, typecheck ou portão de registry: são invariantes de layout, e é isso
 * que esta suíte trava.
 *
 * Um browser só (Chromium). A vitrine não é um produto multi-engine; rodar três
 * triplicaria o tempo para cobrir o mesmo defeito.
 */
/*
 * A suíte sobe o próprio servidor e não reaproveita o que achar na porta. Ela já
 * rodou inteira contra outro projeto que estava na 5199 e devolveu centenas de
 * resultados sem relação com este app. Com porta ocupada, agora falha na largada.
 * Para reusar um servidor nosso de pé: PW_REUSAR=1.
 */
const PORTA = process.env.PW_PORTA ?? "5188";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: process.env.PW_REUSAR === "1",
    timeout: 60_000,
  },
});
