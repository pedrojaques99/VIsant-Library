"use client";

/** TOGGLE, aprovada no lab (2026-11-09-toggle): a peça sozinha, como nasceu lá. */

import { ToggleLever } from "../../../registry/visant/ui/toggle-lever";

export default function ToggleLeverDemo() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-full w-full">
        <ToggleLever />
      </div>
    </div>
  );
}
