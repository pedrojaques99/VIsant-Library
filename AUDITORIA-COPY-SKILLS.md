# Auditoria de copy: /skills, /skills/killer e /skills/filme

Feita em 2026-11-04, com o `references/audit.md` novo da `visant-copy`.

**Tiques:** zero no texto escrito à mão dessas páginas, fora as amostras ruins de propósito. Os problemas abaixo o linter não enxerga.

**Não lidos:** `amostras.ts`, `reu.ts` e `scan.generated.json` (amostras e saídas gravadas), cabeçalho e rodapé do site.

Nada desta tabela foi aplicado. Escolha por linha.

## 1. Precisam da sua decisão

| onde | hoje | problema | proposta |
|---|---|---|---|
| `Hub.tsx:39`, `hub/resto.tsx` e `Filme.tsx:112,142` | "Seis skills" em /skills, "As 12 skills" em /skills/filme | São 6 de interface entre 12 públicas, e nenhuma das páginas diz isso. | Em /skills/filme: "12 skills grátis, 6 delas de interface." |
| `CarroChefe.tsx:54` e `App.tsx:155` | Dois `document.title` diferentes para /skills/killer | Não conferi qual vence. | Manter um só: "visant-killer e visant-design: tire a cara de IA da tela". |

## 2. Linha sob o nome da skill

| onde | hoje | problema | proposta |
|---|---|---|---|
| `filme/roteiro.ts:90` | Escreve e tira o tique | "tique" é vocabulário de dentro | Texto que não parece escrito por IA |
| `filme/roteiro.ts:91` | Gráfico, medidor e painel | lista de substantivos | Gráfico e painel da mesma família |
| `filme/roteiro.ts:93` | Movimento e espera | lista de substantivos | Animação e espera no tempo certo |

As linhas de `visant-design` e `visant-frontend` estão boas e ficam.

## 3. Jargão de dentro

| onde | hoje | proposta |
|---|---|---|
| `CarroChefe.tsx:68` | Quatro detectores no código, a tela aberta e um veredito discutido. | Roda quatro detectores no código, abre a tela e discute o próprio veredito. |
| `CarroChefe.tsx:86` | Os playbooks que a visant-design chama, e o portão de copy da killer, vêm no conjunto de interface: | Para a visant-design e a killer rodarem completas, instale o conjunto de interface: |
| `carro-chefe/secoes.tsx:118` | Portão aberto é o mínimo. O próprio scan lista o que falta. | Passar nos detectores é o mínimo. O próprio scan lista o que falta. |
| `carro-chefe/secoes.tsx:350` | Os sinais 47 a 57 do catálogo ainda são suspeita: nenhum tem caso medido em rodada. | Os sinais 47 a 57 do catálogo ainda são suspeita: nenhum tem caso medido. |

## 4. O que já está na voz

Servem de referência e não devem ser mexidos:

- "O script liberou. O card continua ruim."
- "Testado em repos de outra gente."
- "A gente só testou no Claude Code."
- "Os dados são de exemplo."
- Toda a série "de mentira" do filme.

## 5. Fora dessas páginas

O linter achou 10 ocorrências no resto de `src/`, sem contar `uso.json`, amostras e arquivos gerados. São 6 pontos separadores e 4 travessões, em `demos/glass-board-demo.tsx`, `catalog.tsx`, `controls.overrides.json`, `ItemDocs.tsx` e `kits/brand-system.tsx`. Não mexi.
