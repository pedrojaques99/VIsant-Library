"use client";

/**
 * O campo do agente de um editor de vídeo: falar, rabiscar e comentar no tempo.
 *
 * Tudo aqui é de mentira de propósito: o "ditado" devolve uma frase depois de
 * um instante e a "resposta" corre por dois segundos. O componente não sabe
 * disso; ele só recebe o estado.
 */

import * as React from "react";
import { MessageSquareText, Mic, PenLine } from "lucide-react";

import { PromptComposer, type PromptAttachment, type PromptStatus } from "../../../registry/visant/ui/prompt-composer";

export default function PromptComposerDemo() {
  const [texto, setTexto] = React.useState("");
  const [anexos, setAnexos] = React.useState<PromptAttachment[]>([
    { id: "r1", label: "rabisco", detail: "em 00:12:04" },
  ]);
  const [status, setStatus] = React.useState<PromptStatus>("ready");
  const [mic, setMic] = React.useState<"parado" | "gravando" | "mandando">("parado");
  const [enviadas, setEnviadas] = React.useState<string[]>([]);
  const timer = React.useRef<number>(0);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const enviar = () => {
    setEnviadas((l) => [...l, texto.trim() || `${anexos.length} anexo(s)`].slice(-2));
    setTexto("");
    setAnexos([]);
    setStatus("streaming");
    timer.current = window.setTimeout(() => setStatus("ready"), 2200);
  };

  const falar = () => {
    if (mic === "parado") return setMic("gravando");
    setMic("mandando");
    timer.current = window.setTimeout(() => {
      setMic("parado");
      setTexto((v) => (v.trim() ? `${v.trim()} ` : "") + "deixa o som da porta mais baixo");
    }, 700);
  };

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
          placeholder="O que fazer nesta peça?"
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
