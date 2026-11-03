/*
 * O roteiro do filme: tudo que a página afirma mora aqui.
 *
 * Cada capítulo só usa a passada que o próprio reel credita àquela skill (as
 * legendas `Step.s` em visant-slop-reel/src/{Mata,Kit,Pauta,Settings}.tsx). A skill
 * de motion não aparece em nenhum reel, então o capítulo dela não tem vídeo: é a
 * curva e as regras escritas no SKILL.md.
 */

export const COMANDO = "npx skills add pedrojaques99/visant-skills-public";

export type Tema = { bg: string; fg: string; fg2: string };

const ESCURO: Tema = { bg: "var(--casa-bg)", fg: "var(--casa-fg)", fg2: "var(--casa-fg-2)" };
const MATA: Tema = { bg: "#E6DFCF", fg: "#1E1B16", fg2: "#5C5448" };
const PAUTA: Tema = { bg: "#E6E8EC", fg: "#14161B", fg2: "#4E535C" };

export type Capitulo = {
  id: string;
  palavra: string;
  skill: string;
  tema: Tema;
  clipe: string;
  quadros: number;
  legendas: string[];
  nota?: string;
};

export const CAPITULOS: Capitulo[] = [
  {
    id: "corta",
    palavra: "Corta.",
    skill: "visant-frontend",
    tema: MATA,
    clipe: "mata",
    quadros: 114,
    legendas: ["O selo de desconto e o gradiente saem. Sobra a foto do café."],
    nota: "Mata é um café de mentira.",
  },
  {
    id: "escreve",
    palavra: "Escreve.",
    skill: "visant-copy",
    tema: ESCURO,
    clipe: "kit",
    quadros: 89,
    legendas: ["O alarme de urgência vira uma frase que conta as vagas."],
    nota: "Esse R$ 97 é de um produto de mentira.",
  },
  {
    id: "burila",
    palavra: "Burila.",
    skill: "visant-refine",
    tema: PAUTA,
    clipe: "pauta",
    quadros: 168,
    legendas: ["Cada evento perde o confete e mostra nome e hora.", "A grade quase some, e o horário continua na tela."],
  },
  {
    id: "caca",
    palavra: "Caça.",
    skill: "visant-killer",
    tema: ESCURO,
    clipe: "settings",
    quadros: 114,
    legendas: ["Sai o emoji, entra ícone de biblioteca. O item ativo para de gritar rosa."],
  },
];

export const REGRAS_MOTION = [
  "Tudo que entra ou sai usa ease-out.",
  "Um clique responde em menos de 300 ms.",
  "Uma entrada começa em scale(.95).",
];

export type Par = { id: string; nome: string; tema: Tema };

export const ABERTURA: Par = { id: "checkout", nome: "Um checkout de mentira.", tema: ESCURO };

export const PARES: Par[] = [
  { id: "mata", nome: "A loja de um café de mentira.", tema: MATA },
  { id: "settings", nome: "As configurações de um app de mentira.", tema: ESCURO },
  { id: "pauta", nome: "A agenda de um app de mentira.", tema: PAUTA },
];

/* Os créditos: a função de cada skill, do README público. O nome e o comando vêm do JSON. */
export const FUNCAO: Record<string, string> = {
  "visant-design": "Porta de entrada",
  "visant-frontend": "Decide o que fica na tela",
  "visant-copy": "Escreve e tira o tique",
  "visant-refine": "Gráfico, medidor e painel",
  "visant-killer": "Audita antes do PR",
  "visant-motion": "Movimento e espera",
  "visant-preflight": "Confere antes do projeto grande",
  "visant-methodology": "Método de marca em 9 etapas",
  "visant-mcp-connect": "Conecta o MCP da Visant",
  "site-reels": "Grava o site em vídeo",
  "visant-video-editor": "Corta vlog e aula",
  "visant-premiere-editor": "Monta o corte no Premiere",
};

export const midia = (nome: string) => `/media/skills/filme/${nome}`;
