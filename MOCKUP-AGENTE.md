# Estúdio de mockups por agente (API e MCP)

O `/mockups` (beta) renderiza por código. Um agente manda uma cena em JSON e recebe MP4 e PNG em 1920×1080, prontos para showreel (HyperFrames, Remotion, Premiere).

## Como funciona

Nada de render novo. O motor abre o próprio `/mockups?agente=1` num Chrome sem janela, monta a cena por `window.estudioAgente` e exporta com o exportador do app (`modern-screenshot` + `mediabunny`, quadro a quadro, determinístico). O arquivo é o mesmo que alguém baixaria clicando em Exportar.

- A ponte `window.estudioAgente` (em `Estudio.tsx`) só existe com `?agente` na URL. Ela expõe `cena`, `definir`, `receber`, `irPara`, `exportar` e `aviso`.
- O catálogo (presets, poses, movimentos, aparelhos) é lido do `modelo.ts` vivo pelo Vite. Nada foi copiado, então o que o estúdio ganhar, o agente também ganha.
- O Vite sobe sozinho na porta 5189 (`MOCKUP_PORTA`), ou use um já de pé com `MOCKUP_BASE`.
- Usa o Chrome instalado, que traz H.264 no WebCodecs. Sem ele, cai no Chromium do Playwright, exporta WebM, e o ffmpeg converte para MP4.
- Chamadas a `/api/**` são bloqueadas no render, para não contar visita na métrica do estúdio.
- Os renders entram numa fila e saem um por vez.

Arquivos: `scripts/mockup-agente/` (`motor.mjs`, `receitas.mjs`, `cenas.mjs`, `api.mjs`, `mcp.mjs`, `cli.mjs`).

## Rodar

```bash
pnpm mockup:presets                         # o catálogo em JSON
pnpm mockup:render cena.json [--pasta DIR]  # uma spec ou lista de specs por arquivo
pnpm mockup:api                             # API em http://127.0.0.1:4319 (MOCKUP_API_PORTA)
claude mcp add mockup-estudio -- node Z:/Cursor/Vintageuiuxlibrary/scripts/mockup-agente/mcp.mjs
```

Pasta padrão de saída: `test-results/mockup-agente/`. As cenas criadas ficam em `test-results/mockup-agente/cenas/<id>.json`, e a API e o MCP leem a mesma pasta.

## MCP (stdio)

| Tool | O que faz |
|---|---|
| `list_presets` | Receitas de showreel, presets, poses por aparelho, movimentos, aparelhos, acabamentos e telas demo |
| `create_scene` | Valida e guarda uma spec. Devolve `{ id, cena }` com a cena resolvida |
| `render_scene` | `{ id }` ou `{ spec }`, mais `pasta?` e `esperar?` (padrão true). Devolve os caminhos, a medida, o codec e a duração |
| `get_render` | Status de um render iniciado com `esperar: false` |

## API HTTP

| Rota | Corpo | Resposta |
|---|---|---|
| `GET /presets` | | catálogo |
| `POST /cenas` | spec | `201 { id, cena }` |
| `GET /cenas/:id` | | spec guardada |
| `POST /cenas/:id/render` | `{ pasta? }` | `202 { id, status }` |
| `GET /renders/:id` | | `fila`, `renderizando`, `pronto` (com `arquivos`) ou `erro` |
| `POST /render` | `{ spec, pasta? }` | espera e devolve o render pronto |

```bash
curl -X POST http://127.0.0.1:4319/render -H 'content-type: application/json' \
  -d '{"pasta":"Z:/saida","spec":{"nome":"teste","tela":"Z:/arte.png","receita":"perspectiva-entrada"}}'
```

Spec inválida devolve 400 com o erro do zod. Preset, pose ou receita desconhecidos devolvem a lista de opções.

## A spec da cena

Só `tela` é obrigatória. A ordem de aplicação é: padrão do estúdio, preset, receita, pose, campos soltos e, por último, `cena`.

| Campo | Valores |
|---|---|
| `tela` | arquivo local (png, jpg, webp, mp4, webm), URL http(s), ou `demo:<id>` (`pagina`, `mesa`, `marca`, `composicao`, `vazia`) |
| `nome` | base dos arquivos de saída e id da cena |
| `receita` | ver a tabela abaixo |
| `preset` | `estudio`, `papel`, `noite`, `foto`, `plano`, `contorno` |
| `modelo` | `phone`, `tablet`, `laptop` |
| `pose` | phone e tablet: `frente`, `heroi`, `esquerda`, `direita`, `mesa`, `queda`. Laptop: `frente`, `heroi`, `esquerda`, `direita`, `mesa`, `baixo` |
| `rot`, `pos`, `tamanho` | giro livre `{x,y,z}` em graus, posição de -100 a 100, e tamanho em % (20 a 300) |
| `orientacao` | `retrato` ou `paisagem`. Sem ela, segue a forma do arquivo |
| `ajuste` | `cover` (padrão) ou `contain` |
| `acabamento` | `grafite`, `prata`, `titanio`, `areia`, `noite` |
| `estilo` | `real`, `plano`, `contorno` |
| `movimento` | `{ tipo, duracao (s), intensidade (0 a 100) }`. Tipos: `parado`, `cenas`, `rolar`, `flutuar`, `balancar`, `pendulo`, `aproximar`, `entrada`, `varredura`, `close` |
| `chaves` | câmera por cenas: `[{ pose \| rot, tamanho?, pos?, rolagem? }, ...]`, com 2 ou mais. Liga o movimento `cenas` |
| `fundo` | `{ modo: cor \| degrade \| foto \| nenhum, cor, a, b, angulo, foto, desfoque }`. `foto` aceita arquivo local ou URL. `nenhum` sai em WebM com alfa |
| `proporcao` | `16:9` (padrão), `9:16`, `4:5`, `1:1` |
| `saida` | `{ largura: 1080 \| 1440 \| 2160, fps: 30 \| 60 }`. A largura é o lado menor: 1080 em 16:9 dá 1920×1080 |
| `formatos` | `["mp4","png"]` (padrão), `webm`, `png` |
| `poster` | instante do PNG, de 0 a 1. O padrão é a pose final, ou 0,25 nos loops |
| `cena` | campos crus da `Cena` de `modelo.ts` (foco, reflexo, sombra, lente...) |

Com vídeo na tela e sem `duracao`, o movimento dura o vídeo, até 30 s.

## Receitas de showreel

| id | Aparelho | O que faz |
|---|---|---|
| `perspectiva-entrada` | phone | Chega girando e assenta no herói |
| `mesa-para-heroi` | phone | Câmera: mesa, herói, frente, aproximando |
| `notebook-varredura` | laptop | Gira devagar de um lado ao outro |
| `notebook-orbita` | laptop | Câmera: esquerda, herói, mesa de cima |
| `rolar-pagina` | phone | Imagem comprida descendo na tela |
| `close-detalhe` | tablet | A lente vai até um ponto e volta, e o resto desfoca |
| `flutuar-loop` | phone | Loop sem emenda |
| `contorno-pendulo` | phone | Só o traço, balançando |
| `plano-aproximar` | tablet | Aparelho chapado com zoom lento em loop |

Qualquer receita aceita `modelo` e os demais campos por cima.

## Exemplo: câmera em tablet

```json
{
  "nome": "vsn-tablet-camera-marca3d",
  "tela": "Z:/Cursor/jaques-sh/studio-hf/visant-360/assets/vsn/fig/marca3d.png",
  "modelo": "tablet",
  "preset": "noite",
  "chaves": [{ "pose": "mesa", "tamanho": 62 }, { "pose": "heroi", "tamanho": 80 }, { "pose": "frente", "tamanho": 98 }],
  "movimento": { "duracao": 6 }
}
```

Leva de 15 a 40 s por cena de 4 a 6 s a 1920×1080 numa máquina com GPU.

## Limites

- O aparelho é CSS, não 3D com luz real (ver `PLANO-MOCKUPS.md`, etapa 3).
- Um aparelho por cena. Não existe tela solta em perspectiva sem aparelho: o mais perto disso é o estilo `plano` ou `contorno`.
- Arquivo de proporção diferente da tela é cortado em `cover`. Em `contain`, ele encosta no topo e sobra faixa vazia. Escolha um aparelho de forma parecida com o arquivo.
- Os renders vivem na memória do processo. As cenas ficam em disco.
