import type { Tela } from "./telas";

/* Os cenários reais de visant-motion: movimento só existe em vídeo, cada um com as duas tomadas. */
const tomadas = (nome: string) => ({
  antes: `/media/skills/motion/${nome}-antes.mp4`,
  depois: `/media/skills/motion/${nome}-depois.mp4`,
});

export const TELAS: Tela[] = [
  {
    id: "mot-gaveta",
    nome: "Ficha do hóspede em pousada",
    video: tomadas("gaveta"),
    marcas: {
      antes: [
        { x: 4.4, y: 22.3, w: 46.7, h: 71, t: "Lista inteira é empurrada" },
        { x: 55.7, y: 22.3, w: 39.9, h: 49.9, t: "Texto quebra ao abrir" },
        { x: 55.7, y: 82.5, w: 39.9, h: 10.8, t: "Botão estica em linear" },
      ],
      depois: [
        { x: 4.4, y: 26, w: 27, h: 63.7, t: "Lista fica parada" },
        { x: 55.6, y: 22.3, w: 40, h: 49.9, t: "Texto não quebra" },
        { x: 55.6, y: 82.5, w: 40, h: 10.8, t: "Botão desliza inteiro" },
      ],
    },
  },
  {
    id: "mot-sacola",
    nome: "Tirar um item da sacola",
    video: tomadas("sacola"),
    marcas: {
      antes: [
        { x: 4.4, y: 39.5, w: 59.6, h: 35.8, t: "Abre buraco e tudo salta" },
        { x: 4.4, y: 75.4, w: 59.6, h: 17.9, t: "Aviso aparece de repente" },
        { x: 69.3, y: 65.6, w: 23.6, h: 10.1, t: "Total pula de valor" },
      ],
      depois: [
        { x: 4.4, y: 39.5, w: 59.6, h: 35.8, t: "Ovos e café deslizam" },
        { x: 4.4, y: 75.4, w: 59.6, h: 17.9, t: "Aviso sobe e assenta" },
        { x: 69.3, y: 65.6, w: 23.6, h: 10.1, t: "Total troca suave" },
      ],
    },
  },
  {
    id: "mot-extrato",
    nome: "Trocar o mês no extrato",
    video: tomadas("extrato"),
    marcas: {
      antes: [
        { x: 50.4, y: 32.4, w: 45.1, h: 20.2, t: "Aviso chega e empurra" },
        { x: 4.4, y: 55.5, w: 23.4, h: 36.2, t: "Some tudo no Carregando…" },
        { x: 77.4, y: 57.6, w: 18.1, h: 32, t: "Lista salta 80 px" },
      ],
      depois: [
        { x: 50.4, y: 32.4, w: 45.1, h: 20.2, t: "Aviso não empurra nada" },
        { x: 4.4, y: 55.5, w: 23.4, h: 36.2, t: "Espera com a mesma forma" },
        { x: 77.4, y: 57.6, w: 18.1, h: 32, t: "Valores não saltam" },
      ],
    },
  },
  {
    id: "mot-avisos",
    nome: "Avisos em sequência numa gráfica",
    video: tomadas("avisos"),
    marcas: {
      antes: [
        { x: 44.9, y: 26.4, w: 16, h: 44.6, t: "Aprovado surge de repente" },
        { x: 63.6, y: 44.4, w: 31.1, h: 15.9, t: "Avisos cobrem a prova" },
        { x: 63.6, y: 76.1, w: 31.1, h: 15.9, t: "Novo empurra os antigos" },
      ],
      depois: [
        { x: 44.9, y: 44, w: 16, h: 27, t: "Afunda e vira Aprovado" },
        { x: 64.2, y: 22.6, w: 30.7, h: 49.6, t: "Prova segue à vista" },
        { x: 63.6, y: 73.5, w: 31.1, h: 18.4, t: "Novo vai à frente" },
      ],
    },
  },
  {
    id: "mot-agenda",
    nome: "Cartaz que vira página",
    video: tomadas("agenda"),
    marcas: {
      antes: [
        { x: 4.4, y: 6.7, w: 37.3, h: 86.5, t: "Cartaz nasce do centro" },
        { x: 44.4, y: 16.9, w: 51.1, h: 34.1, t: "Tudo cresce do zero" },
        { x: 44.4, y: 69.6, w: 51.1, h: 23.6, t: "Começa lento, para seco" },
      ],
      depois: [
        { x: 4.4, y: 6.7, w: 37.3, h: 86.5, t: "Cresce de onde tocou" },
        { x: 44.4, y: 16.9, w: 51.1, h: 34.1, t: "Texto só entra depois" },
        { x: 44.4, y: 69.6, w: 51.1, h: 23.6, t: "Sai rápido, chega calmo" },
      ],
    },
  },
];
