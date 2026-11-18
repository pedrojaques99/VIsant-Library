"use client";

/**
 * O campo do agente de um editor de vídeo: falar, rabiscar, comentar no tempo,
 * mencionar com @ e enfileirar enquanto ele trabalha.
 *
 * Tudo aqui é de mentira de propósito: o "ditado" devolve uma frase depois de
 * um instante, a "resposta" corre por três segundos e a fila anda sozinha. O
 * componente não sabe disso; ele só recebe o estado.
 */

import * as React from "react";
import { FileVideo, MessageSquareText, Mic, PenLine } from "lucide-react";

import {
  PromptComposer,
  type PromptAttachment,
  type PromptMentionSource,
  type PromptQueuedItem,
  type PromptStatus,
} from "../../../registry/visant/ui/prompt-composer";
import { SoftwareGlyph, SOFTWARE, softwareFromLink } from "../../../registry/visant/ui/software-glyph";

const ARQUIVOS = ["abertura.mp4", "fecho-logo.mp4", "trilha-v3.wav", "roteiro.md", "capa-reels.png"];

export default function PromptComposerDemo() {
  const [texto, setTexto] = React.useState("");
  const [anexos, setAnexos] = React.useState<PromptAttachment[]>([
    { id: "r1", label: "rabisco", detail: "em 00:12:04" },
  ]);
  const [status, setStatus] = React.useState<PromptStatus>("ready");
  const [fila, setFila] = React.useState<PromptQueuedItem[]>([]);
  const [mic, setMic] = React.useState<"parado" | "gravando" | "mandando">("parado");
  const [enviadas, setEnviadas] = React.useState<string[]>([]);
  const timer = React.useRef<number>(0);
  const filaRef = React.useRef(fila);
  filaRef.current = fila;
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const responder = (m: string) => {
    setEnviadas((l) => [...l, m].slice(-2));
    setStatus("streaming");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const [prox, ...resto] = filaRef.current;
      if (prox) {
        setFila(resto);
        responder(prox.text);
      } else setStatus("ready");
    }, 3000);
  };

  const enviar = ({ now }: { now: boolean }) => {
    const m = texto.trim() || `${anexos.length} anexo(s)`;
    setTexto("");
    setAnexos([]);
    if (status === "ready" || now) responder(m);
    else setFila((l) => [...l, { id: `f${Date.now()}`, text: m }]);
  };

  const falar = () => {
    if (mic === "parado") return setMic("gravando");
    setMic("mandando");
    window.setTimeout(() => {
      setMic("parado");
      setTexto((v) => (v.trim() ? `${v.trim()} ` : "") + "deixa o som da porta mais baixo");
    }, 700);
  };

  const fontes = React.useMemo<PromptMentionSource[]>(
    () => [
      {
        id: "arquivos",
        label: "Arquivos da pasta",
        search: (q) =>
          ARQUIVOS.filter((a) => a.includes(q.toLowerCase())).map((a) => ({
            id: a,
            label: a,
            icon: <FileVideo className="size-3.5" aria-hidden="true" />,
          })),
      },
      {
        id: "ferramentas",
        label: "Ferramentas",
        search: (q) =>
          SOFTWARE.filter((s) => (s.icon || s.mono) && s.name.toLowerCase().includes(q.toLowerCase())).map((s) => ({
            id: s.id,
            label: s.name,
            icon: <SoftwareGlyph software={s} size={14} />,
          })),
        limit: 4,
      },
    ],
    [],
  );

  let n = 0;
  return (
    <div className="flex h-full w-full items-end justify-center p-4">
      <div className="flex w-full max-w-[440px] flex-col gap-3">
        <ol className="flex flex-col gap-1.5">
          {enviadas.map((m, i) => (
            <li key={i} className="ml-10 rounded-[var(--r-surface)] bg-muted px-3 py-2 text-sm">
              {m}
            </li>
          ))}
        </ol>
        <PromptComposer
          value={texto}
          onValueChange={setTexto}
          onSubmit={enviar}
          onStop={() => {
            window.clearTimeout(timer.current);
            setStatus("ready");
          }}
          status={status}
          queueWhileBusy
          queue={fila}
          onQueueSendNow={(id) => {
            const item = fila.find((q) => q.id === id);
            setFila((l) => l.filter((q) => q.id !== id));
            if (item) responder(item.text);
          }}
          onQueueEdit={(id) => {
            const item = fila.find((q) => q.id === id);
            setFila((l) => l.filter((q) => q.id !== id));
            if (item) setTexto(item.text);
          }}
          onQueueRemove={(id) => setFila((l) => l.filter((q) => q.id !== id))}
          mentions={fontes}
          onMention={(item) => setAnexos((l) => [...l, { id: `m${Date.now()}`, label: item.label, icon: item.icon }])}
          onPasteText={(t) => {
            const link = softwareFromLink(t);
            if (!link) return false;
            setAnexos((l) => [...l, { id: `l${Date.now()}`, label: link.label, icon: <SoftwareGlyph software={link.software} size={14} /> }]);
            return true;
          }}
          placeholder="O que fazer nesta peça? @ menciona"
          label="Mensagem para o agente"
          attachments={anexos}
          onRemoveAttachment={(id) => setAnexos((l) => l.filter((a) => a.id !== id))}
          onAttachFiles={(files) =>
            setAnexos((l) => [
              ...l,
              ...files.map((f) => ({
                id: `${f.name}-${(n += 1)}-${Date.now()}`,
                label: f.name,
                preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
              })),
            ])
          }
          tools={[
            {
              id: "falar",
              label: mic === "gravando" ? "Parar e transcrever" : "Falar",
              icon: <Mic aria-hidden="true" />,
              pressed: mic === "gravando",
              busy: mic === "mandando",
              onSelect: falar,
            },
            {
              id: "rabiscar",
              label: "Rabiscar sobre o quadro",
              icon: <PenLine aria-hidden="true" />,
              onSelect: () => setAnexos((l) => [...l, { id: `r${Date.now()}`, label: "rabisco", detail: "em 00:14:10" }]),
            },
            {
              id: "comentar",
              label: "Comentar neste tempo",
              icon: <MessageSquareText aria-hidden="true" />,
              onSelect: () => setAnexos((l) => [...l, { id: `c${Date.now()}`, label: "comentário", detail: "em 00:14:10" }]),
            },
          ]}
        />
      </div>
    </div>
  );
}
