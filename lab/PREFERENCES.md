# Interaction lab: preferences

The memory of the lab. Every keep and every discard lands here with a reason, so
the next generator run learns the taste instead of guessing it. Read this before
inventing anything (see `RULES.md`, "The run").

The owner's "Aprovar" / "Descartar" on `/lab?admin` land here through
`pnpm lab:sync` on the next daily run, as do `pnpm lab:keep <id> "why"` and `pnpm lab:discard <id> "why"`
locally. The taste block below is generated from the numbers; write by hand only outside it.

## What the taste looks like so far

<!-- lab:taste (written by pnpm lab:sync; edits here are overwritten) -->
- 11 de 16 aprovados até aqui.
- Gosta de mechanical (family, 4/4) e subtle (intensity, 7/8).
- Rejeita optics (family, 0/2) e bold (intensity, 0/2).

| dimensão | valor | kept | discarded | taxa (Beta 1,1) |
|---|---|---|---|---|
| input | drag | 3 | 0 | 80% |
| input | tilt | 1 | 0 | 67% |
| input | scroll | 3 | 1 | 67% |
| input | pointer | 3 | 1 | 67% |
| input | press | 1 | 3 | 33% |
| family | mechanical | 4 | 0 | 83% |
| family | light | 3 | 0 | 80% |
| family | fluid | 1 | 0 | 67% |
| family | typography | 2 | 1 | 60% |
| family | material | 1 | 1 | 50% |
| family | ink-print | 0 | 1 | 33% |
| family | optics | 0 | 2 | 25% |
| intensity | subtle | 7 | 1 | 80% |
| intensity | medium | 4 | 2 | 63% |
| intensity | bold | 0 | 2 | 25% |
| response | snap | 5 | 2 | 67% |
| response | spring | 5 | 2 | 67% |
| response | inertia | 1 | 0 | 67% |
| response | direct | 0 | 1 | 33% |

Motivos ao aprovar: nenhum. Ao descartar: nenhum.
Fontes: behance/ui-ux 5/7 (67%), behance/graphic-design 1/1 (67%), lab 5/8 (60%).
<!-- /lab:taste -->

## Prontos pra colher

Components the owner approved on `/lab`. Approval does NOT publish: moving one
into `registry/` is a separate step, only when the owner asks.

<!-- lab:colher (written by pnpm lab:sync) -->
- `2026-11-01-fechar-posicao` · Fechar posição · lab/components/2026-11-01-fechar-posicao.tsx · https://www.behance.net/gallery/239914091/CFI
- `2026-11-01-arranjo` · Arranjo · lab/components/2026-11-01-arranjo.tsx · https://www.behance.net/gallery/248693823/AYNI-Andean-Boutique-Hotel
- `2026-11-04-perfil-rota` · Perfil de rota · lab/components/2026-11-04-perfil-rota.tsx · https://www.behance.net/gallery/236308597/TheTrail-App-Travel-Dashboard-UX-UI-Design
- `2026-11-07-pastas` · Pastas · lab/components/2026-11-07-pastas.tsx · https://www.behance.net/gallery/257301831/Mosbys-Files
- `2026-11-05-fuso` · Leitor de fuso · lab/components/2026-11-05-fuso.tsx · https://www.behance.net/gallery/257630935/Artemii-Lebedev-Portfolio-26
- `2026-11-06-teclas-modo` · Teclas de modo · lab/components/2026-11-06-teclas-modo.tsx · https://www.behance.net/gallery/230911983/Solithic-Energy-SaaS-Dashboard-UX-UI-Design
<!-- /lab:colher -->

## Log

<!-- lab:log (newest last, one line per decision; written by scripts/lab.mjs) -->
- 2026-11-04 · discarded · `2026-11-01-herbario` · mt slop de ia, mt informação inútil · via /lab
- 2026-11-04 · kept · `2026-11-01-fechar-posicao` · bom mas o fundo ficou ruim, e ta um colorido feio, conseguimos melhorar e limpar? · via /lab
- 2026-11-04 · discarded · `2026-11-01-trilha` · inútil e mt slop de ia, não serve pro catálogo · via /lab
- 2026-11-04 · kept · `2026-11-01-arranjo` · a ideia é legla, mas as cores são slop, e poderia ter uma forma menos blocada pra apenas 4 caracters? tenta escrever visant e faça ser nível visant · via /lab
- 2026-11-04 · kept · `2026-11-04-perfil-rota` · tem mt label aparecendo , limpar · via /lab
- 2026-11-04 · kept · `2026-10-29-compass` · poderia ser com efeitos de profundidado ou perspectiva interativar com hover, pra dar um movimento e profundidade pro componente · via /lab
- 2026-11-04 · discarded · `2026-10-29-loupe` · mt obvio · via /lab
- 2026-11-04 · kept · `2026-10-29-level` · cópia descancarada, pense numa forma mais shader fluida drip de fazer isso, minimal e elegante · via /lab
- 2026-11-04 · kept · `2026-10-30-ratchet` · dahora, mas faltou ivda, tem como ser mais metálico a saw? ou dar mais vida ao vetor · via /lab
- 2026-11-04 · discarded · `2026-10-31-stamp` · paia · via /lab
- 2026-11-04 · discarded · `2026-11-01-shutter` · paia · via /lab
- 2026-11-04 · kept · `2026-11-04-raking` · esse ficou foda, add mais textura, grain etc, pra dar mais vida e organicidade · via /lab
- 2026-11-07 · kept · `2026-11-07-pastas` · dahora, poderia ter mais respiro visual e melhorar a emenda dos shapes pra ficar mais arredondado e suave · via /lab
- 2026-11-07 · kept · `2026-11-05-fuso` · tá massa, poderia ter mais umas opcoes de layout tipo numero / list - e ux de dragg vertical scroll · via /lab
- 2026-11-07 · kept · `2026-11-06-teclas-modo` · seria massa se mudasse o tema levemente conforme a opcao · via /lab
- 2026-11-07 · kept · `2026-11-07-louver` · meio inutil, mas ta dahora o conceito, poderia ter mais profundidade · via /lab
