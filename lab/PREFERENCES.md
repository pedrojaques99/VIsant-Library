# Interaction lab: preferences

The memory of the lab. Every keep and every discard lands here with a reason, so
the next generator run learns the taste instead of guessing it. Read this before
inventing anything (see `RULES.md`, "The run").

The owner's "Aprovar" / "Descartar" on `/lab?admin` land here through
`pnpm lab:sync` on the next daily run, as do `pnpm lab:keep <id> "why"` and `pnpm lab:discard <id> "why"`
locally. The taste block below is generated from the numbers; write by hand only outside it.

## Standing rules from the owner (2026-11-09)

- **Objeto físico + função real de interface (os dois juntos):** todo card precisa ser uma peça física com presença tátil e resolver uma ação óbvia de UI (confirmar, arquivar, trancar, trocar modo, navegar, filtrar) que qualquer pessoa entende em 2 segundos sem ler a dica.
- **Zero vetor chapado ou form padrão:** proibido SVG 2D cru (palitos e bolinhas lisas como no `governor`) e proibido empilhar barrinhas cinzas com cara de formulário (`alcance`). Exige luz, sombra projetada e relevo que reagem ao gesto + textura/grain/profundidade de superfície.
- **Zero caso de uso inventado:** nunca inventar métrica ou mecânica forçada (como escolher plano medindo "% de folga" num paquímetro, ou regulador de máquina a vapor que não controla nada real). Use tanto ações de decisão/confirmação (Canhoto, Fechar posição) quanto navegação/filtro/troca de estado (Pastas, Fuso, Teclas de modo), desde que o caso de uso exista de verdade num SaaS ou site.

## Standing rule from the owner (2026-11-11): nível hardware, nunca SVG porco

- Recusados por isso: `iris` (lâminas = triângulos SVG chapados) e `encaixe` (dois blocos SVG com zigue-zague e listras).
- A régua são peças de hardware de alto nível: tecla esc/F1 num poço rebaixado com aro, knob de plugin de áudio com anel e marcas, skins metálicas de player dos anos 2000.
- Construir o objeto em camadas de DOM/CSS: aro (bezel) → poço rebaixado (sombra interna) → peça (gradiente de material, face côncava, chanfro claro em cima e escuro embaixo) → sombras externas em 2 ou 3 camadas (contato + longa e suave) → reflexo especular que se move com o gesto.
- SVG só para detalhe fino (marcas de escala, ícone), nunca para o corpo do objeto.

## What the taste looks like so far

<!-- lab:taste (written by pnpm lab:sync; edits here are overwritten) -->
- 14 de 24 aprovados até aqui.
- Gosta de tilt (input, 2/2) e mechanical (family, 6/8).
- Rejeita optics (family, 0/2) e bold (intensity, 0/2).

| dimensão | valor | kept | discarded | taxa (Beta 1,1) |
|---|---|---|---|---|
| input | tilt | 2 | 0 | 75% |
| input | scroll | 3 | 1 | 67% |
| input | pointer | 3 | 2 | 57% |
| input | drag | 5 | 4 | 55% |
| input | press | 1 | 3 | 33% |
| family | mechanical | 6 | 2 | 70% |
| family | fluid | 1 | 0 | 67% |
| family | light | 3 | 1 | 67% |
| family | typography | 2 | 1 | 60% |
| family | material | 2 | 3 | 43% |
| family | ink-print | 0 | 1 | 33% |
| family | optics | 0 | 2 | 25% |
| intensity | subtle | 9 | 5 | 63% |
| intensity | medium | 5 | 3 | 60% |
| intensity | bold | 0 | 2 | 25% |
| response | snap | 8 | 5 | 60% |
| response | spring | 5 | 3 | 60% |
| response | inertia | 1 | 1 | 50% |
| response | direct | 0 | 1 | 33% |

Motivos ao aprovar: nenhum. Ao descartar: nenhum.
Fontes: behance/graphic-design 1/1 (67%), lab 7/12 (57%), behance/ui-ux 6/11 (54%).
<!-- /lab:taste -->

## Prontos pra colher

Components the owner approved on `/lab`. Approval promotes: `lab:sync` moves each
one into `registry/` with `lab:promote` (one file per piece, lab/RULES.md).

<!-- lab:colher (written by pnpm lab:sync) -->
- `2026-11-01-fechar-posicao` · Fechar posição · @visant/detent-slider · https://www.behance.net/gallery/239914091/CFI
- `2026-11-01-arranjo` · Arranjo · @visant/word-dial · https://www.behance.net/gallery/248693823/AYNI-Andean-Boutique-Hotel
- `2026-11-04-perfil-rota` · Perfil de rota · @visant/route-profile · https://www.behance.net/gallery/236308597/TheTrail-App-Travel-Dashboard-UX-UI-Design
- `2026-11-07-pastas` · Pastas · @visant/folder-tabs · https://www.behance.net/gallery/257301831/Mosbys-Files
- `2026-11-05-fuso` · Leitor de fuso · @visant/zone-reader · https://www.behance.net/gallery/257630935/Artemii-Lebedev-Portfolio-26
- `2026-11-06-teclas-modo` · Teclas de modo · @visant/mode-keys · https://www.behance.net/gallery/230911983/Solithic-Energy-SaaS-Dashboard-UX-UI-Design
- `2026-11-08-canhoto` · Canhoto · @visant/ticket-stub · https://www.behance.net/gallery/257768777/Chande-Bootcamp-2026
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
- 2026-11-08 · kept · `2026-11-08-canhoto` · precisa melhorar a animacao de rasgando, e ter feedback visual depois de rasgar - deixe mais burilado e refinado no design end to end · via /lab
- 2026-11-08 · kept · `2026-11-08-detent` · dahora a ideia, mas precisa melhorar a animacao e birular o design end to end, principalemnte da bolinha de metal q ta mt cru e nao ˜gira~ ainda, mt fake e nao fliuido · via /lab
- 2026-11-09 · discarded · `2026-11-09-governor` · visual chapado/vetor cru (dois palitos e bolinhas 2D sem 3D/textura), gesto desconectado da resposta e metáfora abstrata sem função real em UI
- 2026-11-09 · discarded · `2026-11-09-alcance` · visual sem graça com cara de form padrão (barrinhas cinzas empilhadas sem presença de objeto físico) e caso de uso forçado (ninguém escolhe plano medindo folga num paquímetro)
- 2026-11-10 · discarded · `2026-11-09-despacho` · esse já tem po, faz outro · via /lab
- 2026-11-10 · kept · `2026-11-09-toggle` · precisa ser mais minimal, suave, tem mt linha e ta meio tosco · via /lab
- 2026-11-11 · discarded · `2026-11-10-iris` · svg mt porco: lâminas em triângulo chapado, nada de nível hardware
- 2026-11-11 · discarded · `2026-11-10-encaixe` · svg mt porco: blocos chapados com listras, nada de nível hardware
- 2026-11-11 · promoted · `2026-11-07-louver` → registry `louver`
- 2026-11-11 · promoted · `2026-11-08-detent` → registry `detent-tray`
- 2026-11-11 · promoted · `2026-11-09-toggle` → registry `toggle-lever`
- 2026-11-11 · promoted · `2026-11-05-fuso` → registry `zone-reader`
- 2026-11-11 · promoted · `2026-11-06-teclas-modo` → registry `mode-keys`
- 2026-11-11 · promoted · `2026-11-07-pastas` → registry `folder-tabs`
- 2026-11-11 · promoted · `2026-11-08-canhoto` → registry `ticket-stub`
- 2026-11-11 · dedup · os 7 aprovados de 04/11 (compass, level, ratchet, raking, arranjo, fechar-posicao, perfil-rota) saem de lab/: a versão do registry é a única (estilo lab no catálogo)
