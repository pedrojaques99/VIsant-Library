import type { Tela } from "./telas";

/* Os cenários reais de visant-refine. */
export const TELAS: Tela[] = [
  {
    id: "ref-caixa",
    nome: "Saldo de caixa de uma marcenaria",
    marcas: {
      antes: [
        { x: 5.3, y: 17.5, w: 89.3, h: 14.8, t: "Três blocos, mesmo peso" },
        { x: 56.1, y: 45.5, w: 38, h: 19, t: "Queda sem data nem limite" },
        { x: 9.4, y: 72.6, w: 84.8, h: 7.3, t: "Duas linhas emboladas" },
      ],
      depois: [
        { x: 5.3, y: 9, w: 41.3, h: 22, t: "Saldo contra o mínimo" },
        { x: 60.9, y: 9, w: 33.8, h: 16.8, t: "Entradas e saídas à parte" },
        { x: 53.6, y: 46.1, w: 41.1, h: 34.8, t: "Fura o mínimo em 16 dez" },
        { x: 13.3, y: 71.3, w: 34.4, h: 5.4, t: "Limite vira linha" },
      ],
    },
  },
  {
    id: "ref-preco",
    nome: "Simulador de preço de uma padaria",
    marcas: {
      antes: [
        { x: 18.7, y: 25.1, w: 61.8, h: 29.3, t: "Sem o preço de hoje" },
        { x: 5.3, y: 74.4, w: 21.7, h: 17.5, t: "15120 sem R$" },
        { x: 50.4, y: 74.4, w: 21.7, h: 17.5, t: "8964, comparado a quê?" },
      ],
      depois: [
        { x: 5.3, y: 29.4, w: 54.2, h: 43.2, t: "Hoje marcado no trilho" },
        { x: 64.9, y: 12.1, w: 27.1, h: 22.3, t: "Lucro comparado a hoje" },
        { x: 3.6, y: 82.5, w: 21.7, h: 9.4, t: "Voltar ao real em um toque" },
      ],
    },
  },
  {
    id: "ref-luz",
    nome: "Inspetor de um refletor de palco",
    marcas: {
      antes: [
        { x: 5.3, y: 31.6, w: 89.3, h: 19.4, t: "Duas réguas para um ponto" },
        { x: 5.3, y: 61.7, w: 89.3, h: 9.4, t: "Temperatura em barra azul" },
        { x: 5.3, y: 82.5, w: 44.4, h: 9.4, t: "Resetar sempre à vista" },
      ],
      depois: [
        { x: 15.5, y: 36, w: 3.6, h: 5.4, t: "Ponto, não duas réguas" },
        { x: 46.7, y: 52.9, w: 48, h: 19.2, t: "A barra já mostra a cor" },
        { x: 80.5, y: 9, w: 15.5, h: 7.9, t: "Resetar virou Desfazer" },
      ],
    },
  },
  {
    id: "ref-pousada",
    nome: "Indicadores de uma pousada",
    marcas: {
      antes: [
        { x: 85.8, y: 23.6, w: 7.1, h: 10.8, t: "Cifrão só enfeita" },
        { x: 7.1, y: 59.4, w: 14, h: 12.8, t: "9,2% e nenhum alerta" },
        { x: 52.2, y: 75.7, w: 40.7, h: 9.4, t: "Sem meta" },
      ],
      depois: [
        { x: 52.2, y: 21.6, w: 42.4, h: 19.6, t: "Cifrão deu lugar à tabela" },
        { x: 5.3, y: 58.8, w: 42.4, h: 19.6, t: "Alerta só onde passou" },
        { x: 52.2, y: 79.8, w: 42.4, h: 12.1, t: "Linha com meta" },
      ],
    },
  },
  {
    id: "ref-fabrica",
    nome: "Medidores de energia de um laticínio",
    marcas: {
      antes: [
        { x: 7.2, y: 24.5, w: 25.4, h: 43.2, t: "Escala acaba em 500 kW" },
        { x: 67.4, y: 24.5, w: 25.4, h: 43.2, t: "Alarme falso em 0,94" },
        { x: 85.2, y: 85.2, w: 8.1, h: 5.4, t: "Multa lá no rodapé" },
      ],
      depois: [
        { x: 8, y: 25.6, w: 26.3, h: 23.6, t: "Problema vem primeiro" },
        { x: 65.9, y: 30.7, w: 26.1, h: 13.5, t: "Quanto passou, e a multa" },
        { x: 5.3, y: 60.9, w: 43.3, h: 31, t: "Marca o ritmo esperado" },
        { x: 51.3, y: 60.9, w: 43.3, h: 31, t: "Sem alarme: mínimo é 0,92" },
      ],
    },
  },
];
