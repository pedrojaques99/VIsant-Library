"use client";

import * as React from "react";
import { Julgamento, Porta, Prova, TelaInteira } from "./secoes";
import { Sinais } from "./sinais";

export function SecoesAbaixo({ ancora }: { ancora: React.RefObject<HTMLElement> }) {
  return (
    <>
      <Julgamento ancora={ancora} />
      <Sinais />
      <Porta />
      <TelaInteira />
      <Prova />
    </>
  );
}
