"use client";

/**
 * /skills: a página de produto das 12 skills públicas.
 *
 * Uma dobra por skill, cada uma com uma demo que a pessoa aciona. O filme fica
 * em /skills/filme e a defesa do carro-chefe em /skills/killer: aqui se usa.
 * Texto e números saem do repo visant-skills-public, nada de depoimento.
 *
 * O título repete a promessa das outras duas landings. A escala e o desenho variam
 * de propósito: doze dobras na mesma fórmula viram catálogo de fórmula.
 */

import { CopyCommand } from "../copy-command";
import { Marquee } from "../../../registry/visant/ui/marquee";
import { CountUp } from "../../../registry/visant/ui/count-up";
import { Cabeca, InstalarCheio, LINK, SKILLS, Video } from "./hub/base";
import { DemoKiller, TelasKiller } from "./hub/demo-killer";
import { DemoCopy } from "./hub/demo-copy";
import { DemoMotion } from "./hub/demo-motion";
import { DemoRefine } from "./hub/demo-refine";
import { DemoDesign, DemoFrontend } from "./hub/demo-interface";
import { DemoEditor, DemoPremiere, DemoReels } from "./hub/demo-video";
import { DemoMcp, DemoMetodo, DemoPreflight } from "./hub/demo-processo";
import posterAbertura from "./hub/posters/mata.webp";

const COMANDO = "npx skills add pedrojaques99/visant-skills-public";
const CONJUNTO =
  "npx skills add pedrojaques99/visant-skills-public --skill visant-design visant-killer visant-frontend visant-motion visant-refine visant-copy";

/* Os gatilhos são os dos SKILL.md: é assim que se chama cada skill. */
const FALAS = [
  "tá com cara de IA",
  "audita essa tela",
  "deixa mais suave",
  "tira o silêncio do vídeo",
  "essa copy tá confusa",
  "melhora o design",
  "gerar vídeo do site",
  "monta no Premiere",
  "burilar o painel",
  "cortar excesso",
  "criar site pro cliente",
];

const GRUPOS = [
  {
    nome: "Interface",
    itens: [
      ["visant-killer", "Audita a tela e reprova o slop"],
      ["visant-design", "A porta: lê o pedido e escolhe o caminho"],
      ["visant-frontend", "Cada elemento diz o que move"],
      ["visant-copy", "Texto em português sem tique de IA"],
      ["visant-motion", "Curva e duração em token, com lint"],
      ["visant-refine", "Gráfico e painel com uma anatomia só"],
    ],
  },
  {
    nome: "Vídeo",
    itens: [
      ["visant-video-editor", "Corta silêncio sem comer palavra"],
      ["site-reels", "Grava as cenas de um site em MP4"],
      ["visant-premiere-editor", "Monta o corte no Premiere, no frame exato"],
    ],
  },
  {
    nome: "Processo",
    itens: [
      ["visant-preflight", "Cinco checagens antes do projeto grande"],
      ["visant-methodology", "Nove etapas de marca, em cascata"],
      ["visant-mcp-connect", "Liga o agente nas ferramentas da Visant Labs"],
    ],
  },
];

/* O que esta página usa do catálogo, sem peça nova. */
const PECAS = [
  ["status-ticker", "A espera do killer-scan e da gravação"],
  ["segmented-control", "A troca de amostra e de cena"],
  ["sim-slider", "O respiro do corte de silêncio"],
  ["marquee", "A faixa de falas"],
  ["count-up", "O 12 aqui do lado"],
];

const BANDA = "bg-casa-tile py-16 sm:py-24";
const DOBRA = "shell scroll-mt-20";
const ESPACO = "mt-16 lg:mt-28";

export function Hub() {
  return (
    <main className="casa overflow-x-clip">
      {/* Abertura */}
      <section className="shell grid min-w-0 items-center gap-10 pb-12 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16 lg:pb-16">
        <div className="min-w-0">
          <h1 className="text-[clamp(2.75rem,6.5vw,5.5rem)] font-medium leading-[1.08] tracking-[-0.03em]">
            Tire a cara de IA da sua interface.
          </h1>
          <p className="mt-6 max-w-[48ch] text-[1.25rem] leading-7 text-casa-fg-2">
            São {SKILLS.length} skills pro Claude Code: interface, copy, motion, vídeo e projeto grande. Os detectores são
            scripts que você roda, e aqui embaixo dá pra mexer em cada uma.
          </p>
          <div className="mt-8 max-w-xl">
            <CopyCommand variant="cta" text={COMANDO} />
          </div>
          <p className="mt-3 max-w-[48ch] text-casa-base text-casa-fg-2">
            A gente só testou no Claude Code. Outros agentes que leem SKILL.md devem funcionar, mas ainda não rodamos lá.
          </p>
        </div>
        <Video
          nome="serie"
          poster={posterAbertura}
          inicio={27.9}
          trecho={[10.45, 35.9]}
          alt="Telas geradas por IA virando telas refinadas, com uma linha varrendo cada uma"
        />
      </section>

      <Marquee
        items={FALAS.map((f) => (
          <span key={f} className="whitespace-nowrap text-casa-lg text-casa-fg-2">
            {f}
          </span>
        ))}
        speed={28}
        gap={48}
        fade
        scroll={false}
        aria-label="Exemplos do que pedir ao agente"
      />

      {/* Índice: agrupa as doze sem doze dobras iguais */}
      <nav aria-label="As 12 skills" className="shell mt-12 grid min-w-0 gap-8 md:grid-cols-3 md:gap-10 lg:mt-16">
        {GRUPOS.map((g) => (
          <div key={g.nome} className="min-w-0">
            <p className="text-casa-base text-casa-fg-3">{g.nome}</p>
            <ul className="mt-2">
              {g.itens.map(([nome, frase]) => (
                <li key={nome} className="border-t border-casa-line">
                  <a
                    href={`#${nome}`}
                    className="alvo-toque block rounded-control py-2.5 outline-none hover:text-casa-fg focus-visible:[box-shadow:var(--focus)]"
                  >
                    <span className="block font-casa-mono text-casa-sm text-casa-fg">{nome}</span>
                    <span className="mt-0.5 block text-casa-base text-casa-fg-2">{frase}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Carro-chefe: a única dobra com o comando inteiro à vista */}
      <section id="visant-killer" className={`${ESPACO} scroll-mt-20 ${BANDA}`}>
        <div className="shell min-w-0">
          <div className="grid min-w-0 items-end gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
            <Cabeca nome="visant-killer" tam="grande" semInstalar>
              Roda quatro detectores no seu código e, se achar slop, não deixa passar. Depois abre a tela, discute com o
              próprio veredito e dá uma nota.
            </Cabeca>
            <div className="min-w-0">
              <InstalarCheio nome="visant-killer" />
              <a href="/skills/killer" className={`${LINK} mt-3 inline-block text-casa-base text-casa-fg-2`}>
                Ver como o killer audita
              </a>
            </div>
          </div>
          <div className="mt-10">
            <DemoKiller />
          </div>
          <div className="mt-16 lg:mt-24">
            <TelasKiller />
          </div>
        </div>
      </section>

      {/* A porta: faixa baixa, em três colunas */}
      <section id="visant-design" className={`${DOBRA} ${ESPACO} grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12`}>
        <Cabeca nome="visant-design">Comece por aqui. Fala do seu jeito e ela escolhe o caminho.</Cabeca>
        <DemoDesign />
      </section>

      {/* O corte: a tela grande, a tabela do lado */}
      <section id="visant-frontend" className={`${DOBRA} ${ESPACO}`}>
        <DemoFrontend
          cabeca={
            <Cabeca nome="visant-frontend">
              Todo elemento precisa dizer que número do negócio ele mexe. Se não souber dizer, sai da tela.
            </Cabeca>
          }
        />
      </section>

      {/* Copy: o campo é a dobra */}
      <section id="visant-copy" className={`${DOBRA} ${ESPACO}`}>
        <DemoCopy
          cabeca={
            <Cabeca nome="visant-copy" tam="medio">
              Escreve em português falado e reprova os tiques de IA. Cola um texto aí embaixo e o linter roda no seu navegador.
            </Cabeca>
          }
        />
      </section>

      {/* Motion: os dois lados pedem a largura toda */}
      <section id="visant-motion" className={`${ESPACO} scroll-mt-20 ${BANDA}`}>
        <div className="shell min-w-0">
          <DemoMotion
            cabeca={
              <Cabeca nome="visant-motion" tam="medio">
                Aperta o botão e compara: a mesma interação com a curva errada e com a certa. Embaixo de cada lado, o que o
                motion-lint diz daquele código.
              </Cabeca>
            }
          />
        </div>
      </section>

      {/* Refine: o gráfico manda, o texto fica ao lado */}
      <section id="visant-refine" className={`${DOBRA} ${ESPACO}`}>
        <DemoRefine
          cabeca={
            <Cabeca nome="visant-refine">
              Faz gráfico, medidor e painel parecerem da mesma família. Liga as regras uma a uma e olha o gráfico deixar de
              parecer montado.
            </Cabeca>
          }
        />
      </section>

      {/* Vídeo: a linha do tempo sangra */}
      <section id="visant-video-editor" className={`${ESPACO} scroll-mt-20 ${BANDA}`}>
        <div className="shell min-w-0">
          <DemoEditor
            cabeca={
              <Cabeca nome="visant-video-editor" tam="medio">
                Pega o material bruto, decupa, tira o silêncio sem comer palavra, nivela o áudio em -16 LUFS e marca os
                capítulos. E a lista de cortes passa por você antes de qualquer render.
              </Cabeca>
            }
          />
        </div>
      </section>

      <section id="site-reels" className={`${DOBRA} ${ESPACO}`}>
        <DemoReels
          cabeca={
            <Cabeca nome="site-reels">
              Você escreve as cenas em código, o Chrome grava e sai um MP4 1080p pronto pro deck. Sem gravador de tela.
            </Cabeca>
          }
        />
      </section>

      <section id="visant-premiere-editor" className={`${DOBRA} ${ESPACO}`}>
        <DemoPremiere
          cabeca={
            <Cabeca nome="visant-premiere-editor">
              Transforma um JSON de cortes num XML que o Premiere importa no frame exato. Cortar um a um pelo MCP erra, olha só.
            </Cabeca>
          }
        />
      </section>

      {/* Processo: as duas de antes de começar, lado a lado */}
      <div className={`${ESPACO} ${BANDA}`}>
        <div className="shell grid min-w-0 items-start gap-16 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
          <section id="visant-preflight" className="min-w-0 scroll-mt-20">
            <Cabeca nome="visant-preflight">
              Projeto grande costuma dar errado na premissa, e a gente só descobre tarde. Antes do primeiro layout, ela faz uma
              rodada de perguntas e cinco checagens. Leva 15 minutos.
            </Cabeca>
            <div className="mt-6">
              <DemoPreflight />
            </div>
          </section>
          <section id="visant-methodology" className="min-w-0 scroll-mt-20">
            <Cabeca nome="visant-methodology">
              O método de marca da Visant: nove etapas, e uma alimenta a outra. Clica numa e vê o que volta pra mesa.
            </Cabeca>
            <div className="mt-6">
              <DemoMetodo />
            </div>
          </section>
        </div>
      </div>

      <section id="visant-mcp-connect" className={`${DOBRA} ${ESPACO}`}>
        <DemoMcp
          cabeca={
            <Cabeca nome="visant-mcp-connect">
              Liga o seu agente nas ferramentas da Visant Labs pra mexer em marca, mockup, criativo, canvas e orçamento.
            </Cabeca>
          }
        />
      </section>

      {/* Fecho */}
      <section className={`${ESPACO} ${BANDA}`}>
        <div className="shell grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.12] tracking-[-0.02em]">
              <CountUp>12</CountUp> skills, licença MIT.
            </h2>
            <div className="mt-6">
              <CopyCommand variant="cta" text={COMANDO} />
            </div>
            <p className="mt-6 text-casa-base text-casa-fg-2">Se quiser só as seis de interface:</p>
            <CopyCommand text={CONJUNTO} className="mt-2" />
            <p className="mt-6 max-w-[56ch] text-casa-base text-casa-fg-2">
              A gente só testou no Claude Code. Se rodar no Codex, no Cursor ou no Gemini,{" "}
              <a href="https://github.com/pedrojaques99/visant-skills-public/issues" className={LINK}>
                abre uma issue
              </a>{" "}
              contando o que aconteceu. O código está no{" "}
              <a href="https://github.com/pedrojaques99/visant-skills-public" className={LINK}>
                GitHub
              </a>
              .
            </p>
          </div>
          <div className="min-w-0">
            <Video nome="library" proporcao="16 / 9" alt="Filme do catálogo @visant/ui com peças de dados e shaders" />
            <p className="mt-5 text-casa-base text-casa-fg-2">
              As skills de interface procuram peça pronta antes de escrever uma. Esta página usa estas do catálogo:
            </p>
            <ul className="mt-3">
              {PECAS.map(([nome, onde]) => (
                <li key={nome} className="flex flex-wrap items-baseline gap-x-3 border-t border-casa-line py-2">
                  <a href={`/c/${nome}`} className={`${LINK} font-casa-mono text-casa-sm text-casa-fg`}>
                    {nome}
                  </a>
                  <span className="text-casa-sm text-casa-fg-2">{onde}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
