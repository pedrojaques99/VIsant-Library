"use client";

/**
 * Os chips de uma conversa com agente: corte com capa vertical, link do Figma
 * e caminho do Drive colados, anexo com timecode e uma frase com chip no meio.
 * A capa usa um gradiente em data URL só para a demo não depender de rede.
 */

import * as React from "react";
import { PenLine } from "lucide-react";

import { ContextChip } from "../../../registry/visant/ui/context-chip";
import { SoftwareGlyph, softwareFromLink } from "../../../registry/visant/ui/software-glyph";

const capa =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="64"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8a8a"/><stop offset="1" stop-color="#2a2a2a"/></linearGradient></defs><rect width="36" height="64" fill="url(#g)"/></svg>',
  );

const LINKS = [
  "https://www.figma.com/design/gJXPm1tskC1xcqzYeholeb/Behance-2026?node-id=1111-92",
  "H:\\Meu Drive\\@Clientes VSN\\Grupo Viva\\Assets\\Videos",
  "https://github.com/visant/registry/pull/148",
  "https://linear.app/visant/issue/VSN-212/fila-do-agente",
];

export default function ContextChipDemo() {
  const [anexos, setAnexos] = React.useState(LINKS);
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="flex w-full max-w-[460px] flex-col gap-4">
        <ul className="flex flex-wrap gap-1.5" aria-label="Anexos">
          <li>
            <ContextChip label="O orelhão nasceu de um ovo" image={capa} portrait href="#corte" />
          </li>
          <li>
            <ContextChip label="rabisco" detail="em 00:12:04" icon={<PenLine className="size-3.5" aria-hidden="true" />} />
          </li>
          {anexos.map((t) => {
            const l = softwareFromLink(t);
            if (!l) return null;
            return (
              <li key={t}>
                <ContextChip
                  label={l.label}
                  title={t}
                  icon={<SoftwareGlyph software={l.software} size={14} />}
                  href={l.href}
                  external
                  onRemove={() => setAnexos((a) => a.filter((x) => x !== t))}
                />
              </li>
            );
          })}
        </ul>
        <p className="text-sm leading-6 text-foreground">
          Troquei o selo pelo do
          <ContextChip inline size="sm" label="Behance 2026" icon={<SoftwareGlyph software="figma" size={12} />} />
          e montei a sequência no
          <ContextChip inline size="sm" label="Premiere Pro" icon={<SoftwareGlyph software="premiere" size={12} />} />.
        </p>
      </div>
    </div>
  );
}
