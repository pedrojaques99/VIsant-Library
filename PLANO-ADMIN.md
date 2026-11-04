# Painel admin (`/admin`)

Só para admin do Visant Labs, com a mesma sessão do `/lab`. Serve para responder: **o que eu faço com a library esta semana?**

## Fontes

| Métrica | Fonte | Decisão que ela apoia | Estado |
|---|---|---|---|
| Instalações por skill | API do skills.sh | Qual skill merece divulgação ou conserto | Funciona (endpoint não documentado) |
| Estrelas e forks | API pública do GitHub | Alcance do repositório | Funciona |
| Views e clones (14 dias) | API do GitHub com `GITHUB_TOKEN` | Interesse recente | Falta a variável |
| Visitas, páginas, origens, países | Vercel Web Analytics | De onde vem gente e o que ela vê | Falta ligar e criar `VERCEL_ANALYTICS_TOKEN` |
| Downloads por peça | `middleware.ts` conta `/r/<peça>.json` pedido fora de navegador | O que é usado de verdade | Falta rodar `admin/supabase.sql` |
| Comando copiado por peça | `/api/conta`, chamado pelo `useCopy` | Quem queria instalar | Falta rodar `admin/supabase.sql` |
| Notas, votos, vereditos | Supabase | Curadoria | Funciona |
| Reportes | `bugs/reports.jsonl` do build | O que está quebrado | Funciona, com o dado do último deploy |

## Limites honestos

- Download conta pedido ao registry: o `shadcn add` também baixa dependências, então a peça base infla. Agentes contam, navegadores não.
- Downloads e cópias só existem a partir do dia em que a tabela entrar no ar. Não há histórico para recuperar.
- Nada identifica pessoa: só peça, tipo, dia e total. Sem cookie e sem IP.
- "Inteligente" aqui são regras sobre os números, sempre com a evidência visível. Sem LLM e sem previsão.

## Telas

1. **O que olhar agora**: até 5 leituras, cada uma com o número que a sustenta.
2. **Indicadores** com período 7, 30 ou 90 dias e comparação com o período anterior.
3. **Série diária** de downloads e, se ligado, de visitas, em gráficos separados.
4. **Peças**: tabela ordenável com downloads, cópias, nota e reportes abertos.
5. **Skills, origens, curadoria**.
6. **Fontes**: o que está ligado e o que falta, com o passo para ligar.
