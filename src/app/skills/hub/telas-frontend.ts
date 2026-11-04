import type { Tela } from "./telas";

/* Os cenários reais de visant-frontend. */
export const TELAS: Tela[] = [
  {
    id: "fnt-produto",
    nome: "Página de produto em marketplace",
    marcas: {
      antes: [
        { x: 40.9, y: 16.9, w: 32.4, h: 6.1, t: "Três selos disputam" },
        { x: 40.9, y: 38.9, w: 54.7, h: 7.3, t: "Preço sem peso" },
        { x: 40.9, y: 52.8, w: 54.7, h: 40.5, t: "8 botões e campos" },
      ],
      depois: [
        { x: 49.3, y: 16.9, w: 46.2, h: 5.1, t: "Sem selos" },
        { x: 49.3, y: 40.4, w: 46.2, h: 12.8, t: "Preço com peso" },
        { x: 49.3, y: 73.4, w: 46.2, h: 19.9, t: "Frete dito, um botão só" },
      ],
    },
  },
  {
    id: "fnt-lead",
    nome: "Ficha de lead no CRM",
    marcas: {
      antes: [
        { x: 63.6, y: 8.1, w: 31.9, h: 8.1, t: "Cinco botões" },
        { x: 12.4, y: 27.7, w: 83.1, h: 32.8, t: "Campos todos iguais" },
        { x: 12.4, y: 76.9, w: 83.1, h: 16.4, t: "Sinal no fim" },
      ],
      depois: [
        { x: 12.4, y: 20.2, w: 83.1, h: 27.1, t: "O sinal virou título" },
        { x: 12.4, y: 59.1, w: 83.1, h: 12.8, t: "Um botão: ligar" },
        { x: 12.4, y: 80.5, w: 83.1, h: 12.8, t: "Doze campos viram três" },
      ],
    },
  },
  {
    id: "fnt-caixa",
    nome: "Caixa de entrada",
    marcas: {
      antes: [
        { x: 4.4, y: 14, w: 18.7, h: 7.4, t: "47 iguais" },
        { x: 27.6, y: 14.3, w: 68, h: 23.5, t: "Automáticas na frente" },
        { x: 27.6, y: 47.6, w: 68, h: 12.4, t: "Urgente na 4ª linha" },
      ],
      depois: [
        { x: 8.1, y: 26.6, w: 83.8, h: 18, t: "O urgente virou título" },
        { x: 8.1, y: 60.4, w: 24.6, h: 11.5, t: "Responder em um clique" },
        { x: 5.3, y: 78.8, w: 89.3, h: 13.2, t: "47 viram 1, 2 e 44" },
      ],
    },
  },
  {
    id: "fnt-hotel",
    nome: "Resultados de busca de hotel",
    marcas: {
      antes: [
        { x: 4.4, y: 26.4, w: 20.4, h: 66.8, t: "Oito filtros" },
        { x: 81.3, y: 25, w: 12.9, h: 8.9, t: "Diária, sem o total" },
        { x: 42.7, y: 39, w: 12.7, h: 5.4, t: "Pressão, não dado" },
      ],
      depois: [
        { x: 45.8, y: 16.9, w: 49.8, h: 12.9, t: "Uma indicada, com motivo" },
        { x: 45.8, y: 54, w: 49.8, h: 11.5, t: "Total, com taxas" },
        { x: 4.4, y: 88, w: 39, h: 5.2, t: "Alternativa sem disputa" },
      ],
    },
  },
  {
    id: "fnt-ajustes",
    nome: "Configurações de notas fiscais",
    marcas: {
      antes: [
        { x: 61.8, y: 7.1, w: 33.7, h: 8.1, t: "Excluir ao lado" },
        { x: 84.9, y: 51, w: 10.7, h: 29, t: "Três campos abertos" },
        { x: 26.7, y: 82.9, w: 16.1, h: 8.3, t: "10/11 na última linha" },
      ],
      depois: [
        { x: 4.4, y: 13.5, w: 17.8, h: 7.4, t: "Agora em 1º" },
        { x: 29.4, y: 21.1, w: 63.3, h: 8.4, t: "Prazo virou o título" },
        { x: 26.7, y: 86.5, w: 68.9, h: 6.7, t: "Campos raros recolhidos" },
      ],
    },
  },
];
