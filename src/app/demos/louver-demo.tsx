"use client";

/** LOUVER, aprovada no lab (2026-11-07-louver): a peça sozinha, como nasceu lá. */

import { Louver } from "../../../registry/visant/ui/louver";

export default function LouverDemo() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-full w-full">
        <Louver />
      </div>
    </div>
  );
}
