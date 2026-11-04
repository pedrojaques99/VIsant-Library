import type { Tela } from "./telas";

/* Os cenários reais de visant-design. */
export const TELAS: Tela[] = [
  {
    id: "dsg-clinica",
    nome: "Agendamento de clínica",
    marcas: {
      antes: [
        {x: 5.3, y: 31.5, w: 89.3, h: 36.1, t: "Seis campos antes da hora"},
        {x: 5.3, y: 68.9, w: 89.3, h: 9.1, t: "Nenhum horário, sem saída"},
        {x: 5.3, y: 82.5, w: 46.8, h: 9.4, t: "Dois botões iguais"},
      ],
      depois: [
        {x: 5.3, y: 44.4, w: 53.8, h: 47.5, t: "Escolha só dia e hora"},
        {x: 64.4, y: 22.9, w: 27.6, h: 19.9, t: "Resumo à vista"},
        {x: 64.4, y: 71.8, w: 27.6, h: 10.8, t: "Botão diz a hora"},
      ],
    },
  },
  {
    id: "dsg-pedido",
    nome: "Pedido de restaurante no celular",
    marcas: {
      antes: [
        {x: 4.4, y: 5.4, w: 42.2, h: 28, t: "Cupom antes do cardápio"},
        {x: 53.3, y: 56.3, w: 42.2, h: 18.1, t: "Taxa só na próxima etapa"},
        {x: 53.3, y: 83.8, w: 42.2, h: 9.4, t: "Botões brigam"},
      ],
      depois: [
        {x: 4.4, y: 11.5, w: 42.2, h: 11.6, t: "Prazo e frete no topo"},
        {x: 4.4, y: 82.5, w: 42.2, h: 10.8, t: "Sacola mostra o valor"},
        {x: 53.3, y: 11.5, w: 42.2, h: 50.9, t: "Frete e endereço já aqui"},
        {x: 53.3, y: 72.3, w: 42.2, h: 20.9, t: "Total no próprio botão"},
      ],
    },
  },
  {
    id: "dsg-extrato",
    nome: "Extrato de banco no celular",
    marcas: {
      antes: [
        {x: 5.8, y: 24.6, w: 39.6, h: 42.7, t: "Códigos no lugar de nomes"},
        {x: 4.4, y: 88.5, w: 42.2, h: 4.7, t: "Saldo só no rodapé"},
        {x: 53.3, y: 26, w: 42.2, h: 48.1, t: "Seis linhas, mesmo peso"},
        {x: 53.3, y: 83.8, w: 42.2, h: 9.4, t: "Sem como cancelar"},
      ],
      depois: [
        {x: 4.4, y: 11.5, w: 42.2, h: 14.7, t: "Saldo primeiro, em grande"},
        {x: 4.4, y: 46.2, w: 42.2, h: 34.6, t: "Nomes no lugar de códigos"},
        {x: 53.3, y: 19.6, w: 42.2, h: 25.3, t: "Nome e valor em destaque"},
        {x: 53.3, y: 72.3, w: 42.2, h: 20.9, t: "Cancelar fica à mão"},
      ],
    },
  },
  {
    id: "dsg-landing",
    nome: "Landing B2B para construtoras",
    marcas: {
      antes: [
        {x: 1.8, y: 2.7, w: 96.4, h: 12.1, t: "Sete links e um botão"},
        {x: 11.8, y: 18.9, w: 76.4, h: 15.3, t: "Título serve a qualquer um"},
        {x: 26, y: 46.7, w: 48, h: 9.4, t: "Botões iguais"},
        {x: 5.3, y: 58.8, w: 89.3, h: 33.1, t: "Nenhuma prova"},
      ],
      depois: [
        {x: 5.3, y: 18.9, w: 41.8, h: 30.2, t: "Título diz o resultado"},
        {x: 5.3, y: 75.9, w: 41.8, h: 16, t: "Um botão só, sem cartão"},
        {x: 49.8, y: 18.9, w: 44.9, h: 73, t: "A prova é uma cotação"},
      ],
    },
  },
  {
    id: "dsg-portal",
    nome: "Portal da companhia de água",
    marcas: {
      antes: [
        {x: 5.3, y: 17.5, w: 89.3, h: 6.8, t: "Título não fala da conta"},
        {x: 5.3, y: 25, w: 89.3, h: 10.7, t: "Dois avisos do mesmo peso"},
        {x: 5.3, y: 37, w: 89.3, h: 54.9, t: "Doze botões"},
      ],
      depois: [
        {x: 8.9, y: 24.3, w: 40.9, h: 31.7, t: "Quanto e até quando"},
        {x: 8.9, y: 68.8, w: 40.9, h: 11.5, t: "Pagar sem procurar"},
        {x: 56, y: 18.9, w: 38.7, h: 10.8, t: "Compara com outubro"},
        {x: 56, y: 77.2, w: 38.7, h: 14.7, t: "Aviso fala da sua rua"},
      ],
    },
  },
];
