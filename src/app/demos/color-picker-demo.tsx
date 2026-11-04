"use client";

/** A peça aberta: a pessoa arrasta já de cara, e as amostras dão um começo. */

import * as React from "react";

import { ColorPicker } from "../../../registry/visant/ui/color-picker";

const AMOSTRAS = ["#ff5a36", "#f2c230", "#2fbf71", "#2a7fff", "#7a4dff", "#111111"];

export default function ColorPickerDemo() {
  const [cor, setCor] = React.useState("#2a7fff");
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <ColorPicker value={cor} onChange={setCor} swatches={AMOSTRAS} className="max-w-[300px]" />
    </div>
  );
}
