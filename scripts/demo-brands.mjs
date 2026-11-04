#!/usr/bin/env node
/**
 * As marcas de demonstração da vitrine — inventadas, não de cliente.
 *
 * A vitrine precisa provar que trocar de marca repinta a interface inteira, e
 * isso só se prova com mais de uma marca no seletor. Até agora ela provava com
 * as 22 marcas reais do vault: nome, tagline, logo, paleta e completude de
 * clientes pagantes, num JSON público com CORS aberto. Bonito, e indefensável.
 *
 * Estas quatro entram no lugar:
 *
 *   · Visant®    a casa — a única real, e é nossa
 *   · Norte Verde, Grão Editora, Vega Noturno — fictícias, escritas aqui
 *
 * Passam pelo MESMO compilador das marcas reais (`buildBrandThemeItem`), então
 * a demonstração continua honesta: os tokens saem da mesma derivação, com o
 * mesmo contraste AA por construção. O que muda é a origem do dado.
 *
 *   node scripts/demo-brands.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBrandThemeItem } from "./brand-theme-item.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "r");

/**
 * O formato é o mesmo que a API do vault devolve — `colors` com papel e hex,
 * `typography` com papel, família e tamanho. O tamanho importa: é ele que diz
 * ao compilador qual face carrega título e qual carrega texto corrido.
 */
const DEMOS = [
  {
    id: "demo-norte-verde",
    name: "Norte Verde",
    tagline: "Cultivo de precisão",
    colors: [
      { role: "primary", hex: "#0F6B3F", usageRank: 1 },
      { role: "background", hex: "#F3F6F1", usageRank: 2 },
      { role: "foreground", hex: "#111813", usageRank: 3 },
      { role: "accent", hex: "#C6E36B", usageRank: 4 },
    ],
    typography: [
      { role: "display", family: "Archivo", size: 72 },
      { role: "body", family: "Inter", size: 16 },
    ],
    currentVersion: 1,
    extraction: { completeness: 100 },
    livro: {
      essencia: "Medir o talhão antes de decidir a safra.",
      descricao:
        "A Norte Verde mede solo, água e clima talhão por talhão e diz ao produtor o que fazer nesta semana.",
      tom: ["direto", "técnico", "de campo"],
      voz: "Fala como agrônomo na porteira: o número primeiro, o termo técnico só quando ajuda.",
      faz: [
        "Dá o número e a unidade: 12 mm até quinta",
        "Diz o que fazer hoje em cada talhão",
        "Mostra a data de cada medição",
      ],
      naoFaz: ["Promete revolução no campo", "Usa sigla sem explicar", "Fala do futuro do agro em vez da safra"],
      valoresTitulo: "Valores",
      valores: [
        { nome: "Medida", texto: "Toda recomendação sai de dado do talhão, com a data da coleta ao lado." },
        { nome: "Solo", texto: "Solo bem cuidado rende nesta safra e na próxima." },
        { nome: "Presença", texto: "Agrônomo pisa na fazenda antes da primeira recomendação." },
      ],
    },
  },
  {
    id: "demo-grao-editora",
    name: "Grão Editora",
    tagline: "Livros que pesam na mão",
    colors: [
      { role: "primary", hex: "#8C3B1E", usageRank: 1 },
      { role: "background", hex: "#FAF4EA", usageRank: 2 },
      { role: "foreground", hex: "#1E1712", usageRank: 3 },
      { role: "accent", hex: "#D9A441", usageRank: 4 },
    ],
    typography: [
      { role: "display", family: "Fraunces", size: 80 },
      { role: "body", family: "Karla", size: 16 },
    ],
    currentVersion: 1,
    extraction: { completeness: 100 },
    livro: {
      essencia: "Fazer livro que dá vontade de guardar.",
      descricao:
        "A Grão Editora publica ensaio e ficção em tiragem curta, com papel encorpado, miolo costurado e capa dura.",
      tom: ["culto", "caloroso", "sem pressa"],
      voz: "Escreve como quem indica um livro pra um amigo: conta a cena, cita a página e deixa a pessoa decidir.",
      faz: [
        "Cita um trecho em vez de elogiar o autor",
        "Diz o papel, a gramatura e a tiragem",
        "Deixa a frase longa quando ela merece",
      ],
      naoFaz: ["Chama livro de conteúdo", "Escreve imperdível na quarta capa", "Vende com caixa alta"],
      valoresTitulo: "Valores",
      valores: [
        { nome: "Peso", texto: "Papel, costura e capa escolhidos pra durar décadas na estante." },
        { nome: "Leitura", texto: "O editor lê cada original até o fim antes de responder ao autor." },
        { nome: "Tiragem", texto: "Cada título sai em número pequeno, e o número vem impresso no colofão." },
      ],
    },
  },
  {
    id: "demo-vega-noturno",
    name: "Vega Noturno",
    tagline: "Som para a madrugada",
    colors: [
      { role: "primary", hex: "#6C4BF6", usageRank: 1 },
      { role: "background", hex: "#0E0E14", usageRank: 2 },
      { role: "foreground", hex: "#F2F0FF", usageRank: 3 },
      { role: "accent", hex: "#25E5C1", usageRank: 4 },
    ],
    typography: [
      { role: "display", family: "Space Grotesk", size: 76 },
      { role: "body", family: "IBM Plex Sans", size: 16 },
    ],
    currentVersion: 1,
    extraction: { completeness: 100 },
    livro: {
      essencia: "Fazer companhia pra quem tá acordado às três da manhã.",
      descricao:
        "A Vega Noturno é um selo de música eletrônica lenta, com sessões feitas pra tocar entre a meia-noite e o amanhecer.",
      tom: ["baixo", "íntimo", "noturno"],
      voz: "Fala baixo, em frase curta, como locutor de rádio de madrugada.",
      faz: [
        "Diz a hora e o lugar em que cada faixa foi gravada",
        "Usa frase curta e deixa espaço entre elas",
        "Escreve pra uma pessoa, de fone, no escuro",
      ],
      naoFaz: ["Usa ponto de exclamação", "Chama alguém pra pista", "Promete foco ou produtividade"],
      valoresTitulo: "Valores",
      valores: [
        { nome: "Silêncio", texto: "Cada faixa deixa espaço: pouco elemento, muito ar." },
        { nome: "Companhia", texto: "A curadoria pensa em quem ouve sozinho, tarde da noite." },
        { nome: "Constância", texto: "Sessão nova toda sexta, à meia-noite." },
      ],
    },
  },
];

mkdirSync(OUT, { recursive: true });

const resumos = [];
for (const brand of DEMOS) {
  const item = buildBrandThemeItem(brand);
  writeFileSync(join(OUT, `${item.name}.json`), JSON.stringify(item, null, 2) + "\n");

  const slug = item.name.replace(/^theme-/, "");
  resumos.push({
    id: brand.id,
    slug,
    name: brand.name,
    tagline: brand.tagline,
    logo: null,
    palette: brand.colors.map((c) => ({ hex: c.hex, name: null, role: c.role })),
    fonts: {
      display: brand.typography[0].family,
      sans: brand.typography[1].family,
    },
    preview: {
      light: item.cssVars.light ?? {},
      dark: item.cssVars.dark ?? {},
    },
    theme: item.name,
    themeUrl: `/r/${item.name}.json`,
    version: brand.currentVersion,
    completeness: brand.extraction.completeness,
    updatedAt: null,
    // Ficção assumida: a página lê este selo e avisa em uma linha.
    ficticia: true,
    livro: { fonte: "ficticia", ...brand.livro },
  });
  console.log(`  ${brand.name} → ${item.name}.json`);
}

writeFileSync(join(OUT, "demo-brands.json"), JSON.stringify(resumos, null, 2) + "\n");
console.log(`\n${resumos.length} marcas de demonstração · public/r/demo-brands.json`);
