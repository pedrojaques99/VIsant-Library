# Plano: /mockups de beta a produto

## Situação em 2026-11-05 (depois do "corrija todos")

No ar desde 2026-11-05 (14a8fb6). Etapas 1 e 2 prontas, os 15 defeitos corrigidos. O 3D fica como opção futura; o dono prefere 2D minimalista e contorno.

| Antes | Agora |
|---|---|
| Site em volta | `/mockups` é tela inteira, com barra de 44 px e caminho de volta |
| 8 seções, 2,8 telas de rolagem | 4 abas: Tela, Cena, Aparelho, Movimento. A aba Cena cabe sem rolar a 1917×921 |
| "1080p" dava 2004×1080 | 1920×1080 em qualquer janela; em `cheio`, guia no palco quando ele é mais largo que o arquivo |
| 184 ms por quadro a 1530×1080 (com vídeo) | 95 a 98 ms por quadro a 1920×1080, medidos no dev server e **sem vídeo na tela**; comparar com os 112 ms antigos sem vídeo |
| Aba escondida: cerca de 1 quadro/s | 12,5 quadros/s, com rAF do navegador em 1/s |
| Estimativa fixa, 3,6× errada | Só mostra tempo depois de medir nesta máquina |
| Arquivo some ao recarregar | Guardado no navegador (Cache API), até 8 arquivos |
| Reflexo: faixa única | Sem, Janela, Estúdio, Faixa |
| Sombra única | Suave e longa |
| Vídeo transparente: não existia | WebM VP9 com alfa, conferido com ffprobe (`alpha_mode=1`) |
| Tela larga sem tratamento | Aparelho deita sozinho ao receber arquivo largo; conferido com arquivo real |

Portão: 4/4 detectores em zero, `motion-lint` limpo, `casa-lint` limpo, `tsc` sem erro nestes arquivos, build de produção ok. Revisor isolado rodou nas telas novas; os defeitos confirmados dele foram corrigidos, e os abaixo ficaram.

### Decisão do dono sobre o estilo

"3d como opção, mas eu curto 2d minimalista, até uma versão outline seria foda". Entrou Realista, Plano e Contorno na aba Aparelho, com traço de cor automática e tela Vazia. Painéis flutuam com margem mínima e raio em todas as superfícies. O 3D vira quarta opção, sem substituir nada, e continua pendente de modelo e licença.

### Rodada da referência (análise do vídeo do Rotato, em áudio do dono)

"Movimentou a câmera e adicionou como uma nova cena", "uma coisa por vez", "exportar tanto mídia animada quanto estática".

| Meta | Como ficou |
|---|---|
| Animação por cenas marcadas | Movimento "Cenas": gira, marca (K ou +), e a animação passa só por elas. Cena aberta é editável |
| Exportação estática | Botão de imagem ao lado do vídeo, sempre do quadro na tela |
| Pedido na própria tela | "Solte sua tela aqui" dentro do aparelho; nada flutua sobre a obra |
| Zoom | Roda e pinça no ponteiro, dois dedos, + e −, 0 e duplo clique enquadram, controle à vista |
| Arrastar para fora | Só no "Baixar de novo", no Chrome, e **sem teste de arrasto real até o sistema**. Arrastar a cena direto exige renderizar antes de soltar |

### Rolagem, e a captura própria que vem depois

Pronto: `rolagem` (0 a 100) na cena e em cada cena marcada, movimento Rolar, mapa da página, Shift + roda e teclas. Vale para qualquer imagem ou vídeo mais comprido que a tela, sem servidor. Decisão do dono: **sem API externa**; a captura será própria.

Contrato para quando ela existir, sem mudar o estúdio:

| Parte | Como |
|---|---|
| Entrada | `POST /api/captura` com `{ url, largura }`, onde a largura vem do aparelho: 430 no celular, 1440 no notebook |
| Saída | Imagem da página inteira. O estúdio chama `receber(blob)`, a mesma porta do arquivo solto |
| Antes da foto | Descer a página até o fim, para o carregamento tardio entrar, e voltar ao topo. `scripts/build-telas-mockup.mjs` já faz isso e esconde o que gruda |
| Segurança | Só http e https, recusar IP privado e metadados de nuvem, limite de uso por IP, teto de altura de 16.000 px |
| Cache | Por URL e largura, com validade curta |
| Aviso na tela | O endereço passa por um servidor; o arquivo enviado continua sem passar |
| Limites conhecidos | Cabeçalho fixo só aparece no topo, página com login não abre, animação fica congelada |

Motor provável: `puppeteer-core` com `@sparticuz/chromium` numa função da Vercel. Ainda não testado.

### Ainda em aberto

- **3D como opção:** nada migrou. Falta modelo com licença comercial e iluminação; o comparativo mostrou borda melhor e sombra pior que o CSS.
- **Realismo:** o revisor segue certo: a cena ainda não parece fotografia. Isso só muda com a etapa 3.
- **Ícones de Pose e Movimento:** parados são parecidos; Movimento anima no hover e no selecionado. Ficou como está.
- **Prévia x arquivo:** em ângulo, o texto pequeno da prévia sai mais áspero que no arquivo exportado.
- **`/admin`:** o tipo `estudio` já conta, mas o painel ainda não mostra.
- **Regra do detector:** corrigida em `visant-skills-public` (`noise-scan.mjs` e fixture), sem commit, self-test verde.

### Das referências do Rotato, para depois

Conceitos, nunca imagem nem marca deles.

| Conceito | Esforço | Observação |
|---|---|---|
| Cenas com vários aparelhos | Grande | Maior ganho que falta; a galeria dele é o "nunca mais caçar mockup" |
| Linha do tempo com keyframes | Grande | Hoje são movimentos prontos |
| Export para scroll (sequência de quadros) | Médio | O laço de export já produz cada quadro |
| Lente real com profundidade | Depende do 3D | Hoje o foco é máscara e desfoque |

## Conferência em produção

PNG e MP4 exportados em 1920×1080 (MP4 a 149 ms por quadro, H.264, 30 quadros), sem erro de console nem resposta 4xx/5xx, e o caminho de volta ao site funciona. Uma captura mostrou a aba Aparelho acesa com o conteúdo de Tela; cinco repetições da mesma sequência não reproduziram, com estado e pixels certos. Fica registrado como não reproduzido.

## Não verificado nesta rodada

Safari, Firefox e iPhone real. Máquina fraca. Export em 4K, WebM comum e GIF. Sessão logada. Contagem `estudio` chegando ao banco (a conferência rodou como admin, que não conta). Arrasto real de arquivo do sistema sobre o palco (colar e seletor foram testados; soltar só pelo código).

---

# Auditoria original

Data: 2026-11-05. Auditoria visant-killer, rota T2. Medido em produção (`ui.visantlabs.com/mockups`) no Chrome real, com GPU AMD RX 6650 XT. Nenhum arquivo do app foi alterado.

**Nota 42/100, não vai para PR.** Portão 0/20 (um defeito de copy confirmado), julgamento 12/40 (sete defeitos), interrogatório 30/40.

## Por que parece amador

Os detectores passaram quase limpos, e a carga e o fps também estão bons nesta máquina. O problema é de conceito, em três pontos:

1. **O arquivo exportado parece desenho, não foto.** O aparelho é CSS: o material é um contorno, o reflexo é uma faixa pintada, e não há luz nem chão. É isso que a pessoa baixa e publica.
2. **O trabalho principal está escondido.** A primeira coisa que alguém quer é pôr a própria tela, e "Enviar" é um bloco escuro na terceira seção, a 485 px de rolagem no painel. No celular ele fica fora da área visível. A tela abre mostrando a nossa demo.
3. **É uma página de site, não uma ferramenta.** O menu do site fica em cima do estúdio, o painel mostra 8 seções e 79 controles em 2,8 telas de rolagem, e o ponto de decisão traz "cerca de 11 min" e "Testado só no Chrome".

## Decisões do dono

| # | Decisão | Minha recomendação |
|---|---|---|
| D1 | Fazer só as etapas 1 e 2, ou também a 3 (3D real)? | As três, com a etapa 3 parando no portão visual |
| D2 | Padrão `cheio` (o arquivo sai no formato da janela) ou 16:9? | Manter `cheio` no palco e fazer o export padrão sair em 1920×1080. Hoje "1080p" gera 2004×1080, 1444×1080 ou 1574×1080, conforme a janela |
| D3 | A rota vira tela cheia, sem o menu do site? | Sim, com uma barra fina e o caminho de volta. Mexe em `App.tsx`, que hoje tem trabalho de outra sessão: esperar esse commit |
| D4 | O Sensor (peça viva) sai da tela quando o 3D entrar? | Sim, vira vídeo gravado. WebGL não renderiza HTML como tela |

## Medidas

| O que | Resultado | Leitura |
|---|---|---|
| Carga fria | FCP 448 ms, LCP 1008 ms, bloqueio 0, JS 261 KB, mídia 94 KB | Bom |
| Tocando, sem foco | 100 fps (limite do monitor) | Bom |
| Tocando, com foco | 50 fps | Cai pela metade, porque a cena existe duas vezes |
| Arrastando palco e slider | 98 a 100 fps, um quadro longo de 89 ms | Bom nesta GPU |
| Arrasto no palco | 90 gravações no localStorage em 90 movimentos | Desperdício |
| Export sem vídeo na tela | 112 ms por quadro a 1530×1080 | Estimativa da tela: 400 ms, ou 3,6× a mais |
| Export com vídeo na tela | 184 ms por quadro a 1530×1080 | O "11 min" do print daria cerca de 5 min nesta máquina |
| Aba escondida no meio do export | de cerca de 12 para cerca de 1 quadro por segundo | Quem troca de aba quase para a exportação |
| Celular, 390 px | sem estouro; palco 327 px, painel 261 px | O painel mal aparece |

### Teste de 3D real (descartável, fora do repo)

| Render | Sem vídeo | Com vídeo e busca por quadro |
|---|---|---|
| CSS atual, 1530×1080 | 112 ms | 184 ms |
| three.js, 1920×1080 | 14,9 ms (7,5× mais rápido) | 59,7 ms (3× mais rápido) |

**Essa versão 3D sem vídeo não prova a velocidade:** na primeira rodada a textura não apareceu, então o 14,9 ms não inclui envio de vídeo à GPU. O número confiável é o 59,7 ms. A cena também é mais simples que a final.

**A aparência reprovou.** O aparelho feito de caixa e plano ficou pior que o CSS atual: sem ilha, com canto duro e sombra dura. WebGL sozinho não resolve. O ganho visual depende de modelo, iluminação HDRI e sombra de contato, e isso ainda não foi testado.

## Defeitos confirmados

| # | Defeito | Onde | Prova |
|---|---|---|---|
| 1 | Aba escondida derruba o export, porque o laço depende de `requestAnimationFrame` | `exportar.ts:73` | Medido |
| 2 | A estimativa de tempo é uma constante, e erra 3,6× nesta máquina | `Estudio.tsx:348` | Medido |
| 3 | "1080p" não entrega 1080p no padrão | `Estudio.tsx:340`, `modelo.ts:138` | Medido |
| 4 | Arquivo enviado some ao recarregar, e a cena cai em outra tela sem avisar | `Estudio.tsx:143`, `:312` | Medido |
| 5 | Desfazer logo depois de editar volta dois passos | `Estudio.tsx:106`, `:112` | Medido por automação; à mão, a janela é de até 350 ms |
| 6 | Ctrl+roda muda o tamanho e também o zoom do navegador | `Estudio.tsx:282` | Medido e lido |
| 7 | Soltar arquivo no palco não dá retorno visual, e colar da área de transferência não existe | `Estudio.tsx:409` | Lido |
| 8 | Preset nunca marca seleção | `Estudio.tsx:463` | Lido |
| 9 | Export termina sem confirmação, e cancelar também | `Estudio.tsx:377` | Lido |
| 10 | Atalhos invisíveis: Alt+arrasto, Ctrl+roda, duplo clique, Shift. Nenhum botão de ícone tem dica | `Estudio.tsx:264`, `:437` | Medido: 0 `title` |
| 11 | Salva no localStorage a cada movimento do arrasto | `Estudio.tsx:154` | Medido |
| 12 | Reflexo tem escala até 30, então 15% enche metade da barra ao lado de Sombra até 100 | `Estudio.tsx:493` | Lido |
| 13 | Rotação vai a ±180 no campo e a ±75 no arrasto | `Estudio.tsx:276`, `:543` | Lido |
| 14 | Busca de vídeo pode estourar o tempo e repetir quadro sem avisar | `exportar.ts:87` | Lido; a repetição não foi observada |
| 15 | Decimal com ponto em pt-BR ("14.4 s") e separador `·` reprovado pelo copy-lint | `Estudio.tsx:852`, `:891` | Portão |

Falso positivo do detector: `noise highlight-at-rest` em `Estudio.tsx:648`. Aquele `ativo: true` é a ação do clique em "Close", não um destaque fixo. A regra precisa de ajuste e de um caso na fixture.

## Etapas

### Etapa 1: confiança (esforço pequeno, nada muda de conceito)

Corrigir os defeitos 1 a 15. Três pedem atenção:

- **Export em segundo plano:** trocar o rAF por uma espera que não pare com a aba escondida. Conferir se o `tempo.set` aplica a pose sem depender de pintura. Testar com aba escondida de verdade.
- **Estimativa:** medir os 3 primeiros quadros e só então mostrar o tempo.
- **Arquivo enviado:** guardar no navegador (IndexedDB ou OPFS), sem servidor. Isso também vira argumento: "seu arquivo não sai da sua máquina".

### Etapa 2: fluxo (esforço médio)

Comprovado quando alguém pôr a própria tela e baixar o arquivo sem rolar o painel.

1. **Palco vazio pede a tela.** Primeira visita: "Solte, cole ou escolha a tela do seu app" no palco, com a cena de exemplo atrás. Soltar e colar dão retorno na hora.
2. **Painel por tarefa.** Uma seção aberta por vez, nesta ordem: Tela, Cena (presets com a cena de verdade na miniatura), Aparelho, Movimento. Pose, Foco e Quadro ficam em "Ajustes".
3. **Saída em uma linha.** "MP4 · 1920×1080 · 30 fps", com os detalhes sob demanda. O botão fica; o aviso de beta sai do rodapé e continua só no menu.
4. **Fim do export.** Mostrar o tamanho do arquivo e "Baixar de novo". O progresso continua mostrando o tempo restante.
5. **Celular.** Uma coisa por vez, seguindo [[feedback_mobile-first-pouco-texto]]: palco e uma fileira de abas, com Exportar como última etapa e não fixo.
6. **Tela cheia na rota** (depende de D3).
7. **Curadoria.** Trocar Produto e Composição por telas de app coerentes entre si, do acervo real, com o conteúdo aceso. O Loop 3D escuro não pode ser exemplo.

Nada aqui pede componente novo do design system. Os controles ficam em `src/app/mockups`.

### Etapa 3: render real (esforço grande, com portão)

Opções encontradas:

| Opção | Ganho | Custo | Situação |
|---|---|---|---|
| A. Manter CSS e burilar faixa, sombra e fundo | Barato | Luz e material continuam falsos; export 3× mais lento | Plano B |
| B. three + r3f + drei com modelo GLB e HDRI | Luz real, export cerca de 3× mais rápido no teste simples, ainda sem provar na cena final; foco via lib, o que apaga `pontoDeFoco` e a cena duplicada | Perde a peça viva; licença do modelo em aberto | **Recomendada, se passar no portão** |
| C. Render em servidor | Não depende da máquina | Contraria "servidor só se estritamente necessário" | Descartada |

Reuso: `three`, `@react-three/fiber` e `@react-three/drei` já são dependências, `mediabunny` já exporta canvas, e o `VideoSampleSink` dele lê o quadro exato do vídeo, o que elimina a busca do defeito 14. `DeviceFrame` continua no registry sem mudança.

**Passos:**

1. Licença primeiro: achar modelo de celular, tablet e notebook com uso comercial por escrito. A busca não trouxe nenhum seguro: os "grátis" não declaram licença, ou trazem restrição editorial. Fontes CC0 ainda precisam de busca direta. Aparelho genérico, sem desenho e nome da Apple, é o caminho de menor risco. "MacBook" no rótulo merece a mesma revisão.
2. **Portão visual:** o mesmo quadro em CSS e em 3D, lado a lado. Você decide olhando. Se o 3D não ganhar com clareza, para aqui e vamos de A.
3. Só então migrar palco e export, atrás de uma opção, mantendo os testes de `tests/mockups.spec.ts` no que ainda valer.
4. Medir em máquina fraca antes de trocar o padrão.

Em aberto: a busca não revelou como Rotato e concorrentes renderizam, então nada aqui se apoia nisso.

## Interrogatório

**Q1. Quem reclama se isso sumir?** Hoje, ninguém medido: não há evento de export nem de envio. FORÇA: registrar "enviou tela" e "exportou" antes da etapa 2, para provar a melhora.

**Q5. Que decisão a tela produz?** "Vou exportar isso e publicar." Quem usa não chega lá com a própria tela sem rolar. FORÇA: etapa 2, item 1.

**Q6. O que decide é o mais pesado?** Não. O peso está em Papel e Exportar, e Enviar é o mais fraco (quadro 01). FORÇA: inverter o peso.

**Q8. Que padrão você defende?** `cheio` foi decisão do dono em 84ab003; o custo está no defeito 3. FORÇA: D2.

**Q11 e Q12. Onde o número mente?** "1080p" e "cerca de 11 min". FORÇA: defeitos 2 e 3.

**Q16. Quantos pixels até o conteúdo?** O palco começa em 56 px no desktop e em cerca de 100 px no celular. FORÇA: D3.

**Q17. Onde falta?** O melhor caso de uso, com a tela da pessoa, é o único que não sobrevive a recarregar. FORÇA: defeito 4.

**Q18. O que ensina errado?** "Testado só no Chrome" colado ao botão ensina a desconfiar. O preset nunca marcado ensina que ele não é estado. FORÇA: etapa 2, item 3, e defeito 8.

**Q26. Quem descobre que quebrou?** `tests/mockups.spec.ts` só prende o foco e a troca de aparelho. Fluxo de export e aba escondida não têm teste. FORÇA: acrescentar os dois.

**F1 Reuso.** Bom: libs validadas no export e no 3D. Escrito à mão: paleta, histórico e controles. Sem duplicação encontrada que force troca agora.

**F2 Design system.** Lê `--casa-*` e passou no portão de token. Sem divergência a apontar.

**F3 Responsivo e performance.** Sem estouro em 390 px e bom em GPU forte. Falta medir em máquina fraca.

**F4 Fluxo.** Chega pelo menu, vê a demo, procura Enviar, ajusta, exporta. O "aha" é ver a própria tela no aparelho, e hoje ele exige rolar. A desistência provável está nesse ponto, mas não há dado.

**F5 Esconder.** Pose, Foco e Quadro vão para Ajustes. Formato, resolução e fps viram uma linha. Beta sai do rodapé. Não esconder: Enviar e Exportar.

**F6 Vale do Silício, as três de maior alavanca.** Palco que pede a tela do usuário, render que parece foto, e número que não mente (estimativa, tamanho e arquivo que sobrevive).

## Revisor isolado

Ele julgou só os quadros, sem meu plano nem o código. Veredito: o estúdio "poderia ser de qualquer um da categoria". Causa raiz, nas palavras dele: "trata o resultado como efeito de interface [...] e não como imagem fotografada, e monta o estúdio como um painel de opções preso a um site".

Foram 12 achados. Os que já não estão acima:

- Barra de rolagem nativa com setinhas.
- Foco que parece filtro, não lente.
- Aparelho pequeno no palco e no arquivo exportado (24% da largura).
- Fundo com faixas e blocos no MP4.
- Palco muda de altura ao passar de imagem para vídeo.
- Miniaturas sem linguagem comum.

Vão todos para a etapa 2 ou para o portão da etapa 3. A hipótese dele de que as manchas vêm da compressão segue em aberto; o export de 2 s saiu com 198 KB, cerca de 0,8 Mbit/s, então vale subir o bitrate e testar dither no fundo.

## Surfaces

| File | Surface (A/B/C) | Business variable it moves | Notes |
|---|---|---|---|
| src/app/mockups/controles.tsx | B work | velocidade de ajustar a cena até um arquivo publicável | Controles bons; o excesso é de quantidade à vista |
| src/app/mockups/Estudio.tsx | B work, com primeira visita A | taxa de quem envia a própria tela e exporta; qualidade do arquivo | Primeira visita pede persuasão pelo próprio resultado |

## Screen seen

| Rota | Largura | Estado | O que aconteceu |
|---|---|---|---|
| /mockups (produção, sem login) | 1917×921 | padrão, Sensor | Abre bem; Enviar é o elemento mais fraco |
| /mockups | 1917×921 | Loop 3D com foco e movimento | 50 fps; aparelho desfocado ocupa o palco |
| /mockups | 1440×900 | Neon e Loop 3D, export real | MP4 válido em H.264, 1530×1080, 30 fps, 30 quadros |
| /mockups | 1280×720 | padrão | Saída 1574×1080; miniaturas cortadas pela saída fixa |
| /mockups | 390×844 toque | padrão | Sem estouro; Enviar fora da área visível |
| print do dono | 1917 | Loop 3D, 26,5 s, 60 fps | "cerca de 11 min" |

## Not checked

- Tema claro: o quadro saiu escuro, e não confirmei se a rota segue o tema.
- Máquina fraca e CPU reduzida; todos os fps vêm de GPU forte.
- Export em 2K, 4K, WebM e GIF.
- Safari, Firefox e iPhone real, incluindo gestos.
- Sessão logada: a medição rodou sem login.
- Teclado completo e leitor de tela.
- Modelo GLB e HDRI: a qualidade visual do 3D final segue não provada.

## Fontes

- [Rotato vs Mockuuups Studio](https://toolradar.com/compare/rotato-vs-mockuuups-studio)
- [Best 3D mockup video makers 2026](https://preview.autoae.online/blog/best-3d-mockup-video-makers-content-creators-2026)
- [Best mockup tools for web designers 2026](https://screenhance.com/blog/best-mockup-tools-web-designers-2026)
- [Modelo MacBook GLB, Ko-fi](https://ko-fi.com/s/d30d0dee5c)
- [Modelo de celular genérico, itch.io](https://wisemanmods.itch.io/phone)
- [iPhone 17 Air, CGTrader](https://www.cgtrader.com/3d-models/electronics/phone/iphone-17-air-realistic-3d-smartphone-model)
- [3DAssets.dev](https://mcpservers.org/servers/3dassets-dev-docs-mcp)
