import type { Tela } from "./telas";

/* Os cenários reais de visant-killer. As marcas saem medidas do HTML de cada tela. */
export const TELAS: Tela[] = [
  {
    id: "painel",
    nome: "painel",
    marcas: {
      antes: [
        { x: 69.3, y: 6.7, w: 26.3, h: 7.4, t: "Botões brigam" },
        { x: 13.8, y: 20.2, w: 24, h: 70.3, t: "Seis métricas iguais" },
        { x: 40, y: 55.7, w: 27.6, h: 37.5, t: "Atraso no meio" },
      ],
      depois: [
        { x: 12, y: 22.9, w: 56.9, h: 25.6, t: "Uma decisão por tela" },
        { x: 12, y: 58.7, w: 56.9, h: 12.1, t: "Um botão resolve" },
        { x: 71.6, y: 22.9, w: 24, h: 47.9, t: "Onde atrasa" },
        { x: 12, y: 81.8, w: 83.6, h: 11.5, t: "Métricas viram rodapé" },
      ],
    },
  },
  {
    id: "planos",
    nome: "planos",
    marcas: {
      antes: [
        { x: 6.2, y: 33.1, w: 87.6, h: 10.1, t: "Mesma frase nos três" },
        { x: 6.2, y: 62.7, w: 26.2, h: 13.5, t: "Repetido nos três" },
        { x: 6.2, y: 81.8, w: 87.6, h: 8.8, t: "Três botões iguais" },
      ],
      depois: [
        { x: 6.3, y: 33.2, w: 26, h: 10.1, t: "Para quem é" },
        { x: 37, y: 33.2, w: 26, h: 49.1, t: "Um plano indicado" },
        { x: 4.4, y: 87.9, w: 91.1, h: 5.4, t: "Comum aos três" },
      ],
    },
  },
  {
    id: "geracao",
    nome: "gráfico",
    marcas: {
      antes: [
        { x: 37, y: 17, w: 26, h: 4.4, t: "Rótulo em código" },
        { x: 4.8, y: 33.7, w: 2.8, h: 53.6, t: "Eixo cortado engana" },
        { x: 8.9, y: 44.4, w: 83.5, h: 9.2, t: "Linha a mais confunde" },
        { x: 50.4, y: 81.6, w: 4.4, h: 10.6, t: "O dia 17 passa batido" },
      ],
      depois: [
        { x: 35.1, y: 14.8, w: 29.8, h: 13.5, t: "Com nome e unidade" },
        { x: 4.4, y: 51.8, w: 3.2, h: 39.3, t: "Eixo começa no zero" },
        { x: 44.5, y: 37.1, w: 19.8, h: 11, t: "Dia 17 ganha o motivo" },
        { x: 86.9, y: 47, w: 8.6, h: 5.2, t: "Uma linha só" },
      ],
    },
  },
  {
    id: "filtros",
    nome: "filtros",
    marcas: {
      antes: [
        { x: 37.5, y: 11, w: 6.2, h: 4.4, t: "Aplicar lá em cima" },
        { x: 4.4, y: 10.8, w: 6.3, h: 4.7, t: "Seis filtros" },
        { x: 4.4, y: 78.2, w: 42.2, h: 8.1, t: "Pequeno para o dedo" },
        { x: 53.3, y: 33.4, w: 10.7, h: 59.9, t: "Fotos miúdas" },
      ],
      depois: [
        { x: 4.4, y: 10.8, w: 9, h: 6.7, t: "Quatro filtros" },
        { x: 4.4, y: 39.1, w: 42.2, h: 9.4, t: "Cabe o dedo" },
        { x: 4.4, y: 71.5, w: 42.2, h: 21.8, t: "Ao alcance do polegar" },
        { x: 53.3, y: 68.3, w: 42.2, h: 12.8, t: "Um imóvel por vez" },
      ],
    },
  },
  {
    id: "contratos",
    nome: "primeiro uso",
    marcas: {
      antes: [
        { x: 75.1, y: 6.7, w: 20.4, h: 22.9, t: "Vídeo de 12 min" },
        { x: 24, y: 32.5, w: 3.6, h: 35.1, t: "Cinco passos para ler" },
        { x: 24, y: 85.8, w: 61.7, h: 7.4, t: "Quatro botões iguais" },
      ],
      depois: [
        { x: 67.1, y: 20.1, w: 28.4, h: 59.9, t: "No lugar do vídeo" },
        { x: 24, y: 56.7, w: 40.4, h: 12.1, t: "Um botão só" },
        { x: 24, y: 76.3, w: 40.4, h: 5.4, t: "Passos só se pedir" },
      ],
    },
  },
];
