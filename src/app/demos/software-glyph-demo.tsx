"use client";

/**
 * A linha de ações de um agente, antes e depois: nomes crus de ferramenta viram
 * logo em uma cor e ação legível. Os nomes são os que o Claude Code emite.
 */

import * as React from "react";

import { SoftwareGlyph, softwareFromTool } from "../../../registry/visant/ui/software-glyph";

const ACOES = [
  "ToolSearch",
  "mcp__claude_ai_Figma__get_metadata",
  "mcp__claude_ai_Figma__get_screenshot",
  "mcp__premiere-pro__add_marker",
  "mcp__claude_ai_Google_Drive__search_files",
  "Bash",
  "Read",
  "Edit",
];

export default function SoftwareGlyphDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <ol className="flex w-full max-w-[380px] flex-col gap-1.5 text-sm">
        {ACOES.map((nome, i) => {
          const { software, action } = softwareFromTool(nome);
          return (
            <li key={i} className="flex min-w-0 items-center gap-2.5" title={nome}>
              <SoftwareGlyph software={software} size={16} className="text-foreground/80" />
              <span className="shrink-0 font-medium">{software.name}</span>
              <span className="min-w-0 truncate text-muted-foreground">{action}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
