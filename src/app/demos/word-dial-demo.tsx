"use client";

/** A palavra da casa no anel: toque para dar um passo, gire para escolher. */

import { WordDial } from "../../../registry/visant/ui/word-dial";
import type { DemoProps } from "../catalog";

export default function WordDialDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full place-items-center p-4">
      <WordDial {...props} />
    </div>
  );
}
