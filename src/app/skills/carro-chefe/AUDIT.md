# Audit: src

O relatório do card final de `reu.ts`. `captura.mjs` entrega este arquivo ao
killer-scan `--report`, e a página mostra o GATE OPEN que sai daí.

## Surfaces

| File | Surface (A/B/C) | Business variable it moves | Notes |
|---|---|---|---|
| src/Pricing.tsx | A | clique no plano, a conversão da página de preço | card de demonstração |

## Screen seen

- /skills/killer, 1440 e 390, dado fixo de demonstração: o card final renderizado pela mesma árvore que foi escaneada; preço é o maior elemento, um botão, nada cortado, sem rolagem lateral.

## Not checked

- Backend parado: o card não tem backend. Produto real: o plano e o preço são de demonstração.

## Findings

Nenhum detector com achado no card final.
