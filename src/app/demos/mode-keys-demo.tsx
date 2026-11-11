"use client";

/** MODE, aprovada no lab (2026-11-06-teclas-modo): a peça sozinha, como nasceu lá. */

import { ModeKeys } from "../../../registry/visant/ui/mode-keys";

export default function ModeKeysDemo() {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="w-full">
        <ModeKeys />
      </div>
    </div>
  );
}
