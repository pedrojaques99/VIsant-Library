import type { Tela } from "./telas";

/* Os cenários reais de visant-copy. */
export const TELAS: Tela[] = [
  {
    id: "cpy-talhao",
    nome: "Landing de software de safra",
    marcas: {
      antes: [
        { x: 5.3, y: 19.7, w: 74.2, h: 22.7, t: "Sem tarefa" },
        { x: 5.3, y: 42.6, w: 89.3, h: 12.7, t: "Elogio" },
        { x: 5.3, y: 58.1, w: 89.3, h: 12.1, t: "Pede reunião" },
        { x: 63.6, y: 79.4, w: 31.1, h: 12.5, t: "R$ 86 de quê?" },
      ],
      depois: [
        { x: 5.3, y: 19.7, w: 69.1, h: 22.7, t: "Diz a tarefa" },
        { x: 5.3, y: 42.6, w: 89.3, h: 12.7, t: "Quem lança" },
        { x: 5.3, y: 58.1, w: 89.3, h: 12.1, t: "Testa na safra" },
        { x: 63.6, y: 79.4, w: 31.1, h: 12.5, t: "R$ 86 a menos por hectare" },
      ],
    },
  },
  {
    id: "cpy-recusa",
    nome: "Cartão recusado na passagem",
    marcas: {
      antes: [
        { x: 5.3, y: 28.3, w: 81.6, h: 43.4, t: "Ops, erro vago, sem prazo" },
        { x: 5.3, y: 79.8, w: 50.1, h: 12.1, t: "Repete o que falhou" },
        { x: 55.9, y: 79.8, w: 38.8, h: 12.1, t: "Voltar perde a poltrona" },
      ],
      depois: [
        { x: 5.3, y: 28.3, w: 53.9, h: 22.3, t: "Diz o que aconteceu" },
        { x: 5.3, y: 51.9, w: 89.3, h: 20.2, t: "Prazo, nada cobrado" },
        { x: 5.3, y: 79.8, w: 50.1, h: 12.1, t: "Saída que cai na hora" },
        { x: 55.9, y: 79.8, w: 38.8, h: 12.1, t: "Ou troca o cartão" },
      ],
    },
  },
  {
    id: "cpy-cesta",
    nome: "Cancelar a assinatura da cesta",
    marcas: {
      antes: [
        { x: 5.3, y: 19.9, w: 80.7, h: 24.1, t: "Drama no lugar da resposta" },
        { x: 5.3, y: 44.5, w: 89.3, h: 13.1, t: "Medo" },
        { x: 5.3, y: 66.6, w: 89.3, h: 25.3, t: "Qual botão cancela?" },
      ],
      depois: [
        { x: 5.3, y: 19.9, w: 56.8, h: 24.1, t: "Diz quando acaba" },
        { x: 5.3, y: 44.5, w: 89.3, h: 13.1, t: "Sem cobrança depois" },
        { x: 5.3, y: 66.6, w: 89.3, h: 25.3, t: "Botão diz: cancelar" },
      ],
    },
  },
  {
    id: "cpy-box",
    nome: "Oficina sem nenhuma ordem",
    marcas: {
      antes: [
        { x: 5.3, y: 20.9, w: 72, h: 26.5, t: "Só constata o vazio" },
        { x: 5.3, y: 48.7, w: 89.3, h: 12.3, t: "Frase vaga" },
        { x: 5.3, y: 63.7, w: 40, h: 12.1, t: "Item?" },
        { x: 45.8, y: 63.7, w: 33.3, h: 12.1, t: "Saiba o quê?" },
      ],
      depois: [
        { x: 5.3, y: 20.9, w: 56.8, h: 26.5, t: "Manda abrir a primeira" },
        { x: 5.3, y: 48.7, w: 89.3, h: 12.3, t: "Orçamento em 2 min" },
        { x: 5.3, y: 63.7, w: 40, h: 12.1, t: "Pela placa" },
        { x: 45.8, y: 63.7, w: 33.3, h: 12.1, t: "Traz a planilha" },
      ],
    },
  },
  {
    id: "cpy-email",
    nome: "E-mail de boas-vindas",
    marcas: {
      antes: [
        { x: 5.3, y: 22.2, w: 75, h: 36.9, t: "Festa, e só fala de si" },
        { x: 5.3, y: 63.8, w: 45.3, h: 12.1, t: "Pra quê?" },
        { x: 50.7, y: 85.8, w: 44, h: 6.1, t: "Ninguém pra responder" },
      ],
      depois: [
        { x: 5.3, y: 22.2, w: 66.3, h: 22.2, t: "Diz o que falta" },
        { x: 5.3, y: 46.1, w: 89.3, h: 13.6, t: "Pede só o CNPJ" },
        { x: 5.3, y: 63.8, w: 45.3, h: 12.1, t: "Diz a tarefa" },
        { x: 47.8, y: 85.8, w: 46.9, h: 6.1, t: "Alguém lê a resposta" },
      ],
    },
  },
];
