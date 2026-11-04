"use client";

/**
 * A barra de navegação de um app, com seis atalhos: o bastante pra onda ter
 * vizinhos dos dois lados. Clicar troca o atual (o ponto embaixo).
 */

import * as React from "react";
import { Bell, Bookmark, Folder, House, Search, User } from "lucide-react";

import { MagnifyDock } from "../../../registry/visant/ui/magnify-dock";
import type { DemoProps } from "../catalog";
import { useDonoDoKnob } from "./dono-do-knob";

const ITENS = [
  { id: "inicio", label: "Início", icon: <House /> },
  { id: "busca", label: "Buscar", icon: <Search /> },
  { id: "pastas", label: "Projetos", icon: <Folder /> },
  { id: "salvos", label: "Salvos", icon: <Bookmark /> },
  { id: "avisos", label: "Avisos", icon: <Bell /> },
  { id: "perfil", label: "Perfil", icon: <User /> },
];

export default function MagnifyDockDemo({ props, onKnob }: DemoProps) {
  const [atual, setAtual] = React.useState("inicio");
  const mudar = useDonoDoKnob<string>("active", "inicio", setAtual, { props, onKnob });

  return (
    <div className="flex h-full w-full items-center justify-center">
      <MagnifyDock
        aria-label="Navegação"
        items={ITENS}
        {...props}
        active={atual}
        onSelect={mudar}
      />
    </div>
  );
}
