/**
 * Receitas de showreel: combinações prontas de preset, pose e movimento do estúdio.
 *
 * Nada aqui desenha: cada receita só escolhe valores que o `/mockups` já tem (PRESETS,
 * POSES, MOVIMENTOS de src/app/mockups/modelo.ts). Pose é por nome e se resolve no
 * aparelho escolhido, então a mesma receita serve em celular, tablet e notebook.
 *
 * `chaves` é a câmera feita à mão (movimento "cenas"): de pose em pose, com repouso.
 */

export const RECEITAS = {
  "perspectiva-entrada": {
    nome: "Entrada em perspectiva",
    para: "Abrir um bloco: o aparelho chega girando e assenta na pose herói.",
    modelo: "phone",
    preset: "estudio",
    movimento: { tipo: "entrada", duracao: 4, intensidade: 60 },
  },
  "mesa-para-heroi": {
    nome: "Da mesa ao herói",
    para: "Câmera: começa deitado na mesa, sobe para o herói e termina de frente, aproximando.",
    modelo: "phone",
    preset: "noite",
    chaves: [
      { pose: "mesa", tamanho: 70 },
      { pose: "heroi", tamanho: 82 },
      { pose: "frente", tamanho: 96 },
    ],
    movimento: { tipo: "cenas", duracao: 5 },
  },
  "notebook-varredura": {
    nome: "Notebook em varredura",
    para: "Site ou dashboard: o notebook gira devagar de um lado ao outro.",
    modelo: "laptop",
    preset: "noite",
    movimento: { tipo: "varredura", duracao: 5, intensidade: 45 },
  },
  "notebook-orbita": {
    nome: "Órbita do notebook",
    para: "Câmera em três cenas: esquerda, herói e mesa vista de cima.",
    modelo: "laptop",
    preset: "estudio",
    chaves: [
      { pose: "esquerda", tamanho: 60 },
      { pose: "heroi", tamanho: 68 },
      { pose: "mesa", tamanho: 74 },
    ],
    movimento: { tipo: "cenas", duracao: 6 },
  },
  "rolar-pagina": {
    nome: "Rolar a página",
    para: "Imagem comprida (site, feed): a tela desce por dentro do celular.",
    modelo: "phone",
    preset: "papel",
    pose: "heroi",
    movimento: { tipo: "rolar", duracao: 6, intensidade: 50 },
  },
  "close-detalhe": {
    nome: "Close no detalhe",
    para: "Lente vai até um ponto da tela e volta; o resto desfoca.",
    modelo: "tablet",
    preset: "estudio",
    cena: { foco: { ativo: true, x: 50, y: 40, zoom: 1.8, area: 40, desfoque: 10 } },
    movimento: { tipo: "close", duracao: 5 },
  },
  "flutuar-loop": {
    nome: "Flutuar em loop",
    para: "Loop sem emenda para fundo de bloco: o aparelho respira.",
    modelo: "phone",
    preset: "foto",
    movimento: { tipo: "flutuar", duracao: 6, intensidade: 50 },
  },
  "contorno-pendulo": {
    nome: "Contorno em pêndulo",
    para: "Linguagem 2D minimalista: só o traço do aparelho, balançando.",
    modelo: "phone",
    preset: "contorno",
    movimento: { tipo: "pendulo", duracao: 4, intensidade: 60 },
  },
  "plano-aproximar": {
    nome: "Plano aproximando",
    para: "Arte chapada num tablet plano, com zoom lento em loop.",
    modelo: "tablet",
    preset: "plano",
    movimento: { tipo: "aproximar", duracao: 5, intensidade: 60 },
  },
};
