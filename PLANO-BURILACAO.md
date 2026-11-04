# Plano: rota de burilação de copy

**Status:** fases 1 e 2 construídas em 2026-11-04. Para ir ao ar, falta aplicar `burilacao/supabase.sql` e publicar. Fases 3 e 4 pendentes. Decisões tomadas: todo admin vota, 5 duelos por dia, geração manual na primeira semana.

**Ideia:** todo dia o admin responde alguns duelos A ou B de títulos e descrições. Cada resposta ensina a `visant-copy`.

## O que o repo já tem

Quase tudo existe no `/lab`, então não entra lib nova.

| peça | onde | uso aqui |
|---|---|---|
| Placar e escolha do próximo teste (Beta e Thompson sampling, com testes) | `scripts/lab-taste.mjs` | decide qual dúvida testar hoje |
| Motivos de um toque | `lab/motivos.json` | "por que perdeu" |
| Login de admin | `api/_lab-auth.ts`, `api/curadoria.ts` | mesma sessão |
| Notas de admin no Supabase | `curadoria/supabase.sql` | votos em tabela nova |

## Como funciona

**A tela (`/burilar`, só admin, celular primeiro).** Um duelo por vez: onde a frase vai morar, A e B lado a lado, mais "nenhuma" e "escrever a minha". Depois do voto, um toque no motivo: soa IA, vago, promete demais, frio, longo. A rodada tem 5 duelos e leva menos de 2 minutos.

**O que torna o teste inteligente:**

1. **Uma dúvida por duelo.** A e B mudam uma coisa só, senão o voto não ensina nada. As dúvidas viram as dimensões do placar:
   - tarefa ou consequência
   - benefício ou mecanismo
   - "eu" ou "a gente"
   - "para" ou "pra"
   - número ou cena
   - curto ou longo
2. **O placar escolhe o duelo.** O Thompson sampling já usado no lab prefere as dimensões ainda incertas. O que já está decidido para de ser perguntado.
3. **Frases de verdade.** Os duelos partem de linhas que estão no site, como as da `AUDITORIA-COPY-SKILLS.md`. As duas opções passam no `copy-lint`.
4. **Consistência.** Um duelo antigo volta com os lados trocados. Se o voto muda, a dimensão ainda não está madura para virar regra.
5. **Teste de imitação.** Um duelo por rodada põe uma frase real do Club contra uma gerada: "qual foi a gente que escreveu?". O índice de acerto é a nota da skill: quanto mais perto de 50%, mais ela soa como vocês.

**"Escrever a minha"** é o dado mais valioso, porque é a própria voz. Vai direto para o acervo de exemplos.

## Como a skill melhora

- Com 8 votos ou mais e 80% ou mais para um lado, o script **propõe** a regra em um `.md` com os votos.
- Você aprova. Nada muda sozinho na skill nem no site.
- O vencedor de um duelo vira linha de proposta para a página, com o `file:line`.

## Fases

| fase | entrega | pronto quando |
|---|---|---|
| 1 | `npm run burilar -- next` diz o que testar, e a rodada sai com a skill. `/burilar` vota e grava no Supabase. | Uma semana de rodadas respondidas |
| 2 | Placar, dimensões e teste de imitação em `scripts/burilar.mjs`, sobre o modelo do `lab-taste` | O script escolhe sozinho o duelo do dia |
| 3 | Rodada diária automática, na mesma linha da rodada do lab | Rodada pronta sem abrir o terminal |
| 4 | Proposta automática de regra | Primeira regra aprovada com votos |

## Riscos

- **Pouco volume:** com um admin só, cada conclusão leva semanas. Por isso o limiar existe e as regras só valem como proposta.
- **Regra pública:** gosto de vocês entra numa skill MIT, e votos e frases escritas saem em `GET /api/burilacao` e no repo, sem o nome de quem votou, como os vereditos do lab.
- **Cena inventada:** o gerador segue proibido de criar memória pessoal, e o duelo marca isso como `[cena real]`.

