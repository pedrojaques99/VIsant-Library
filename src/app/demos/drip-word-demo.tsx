"use client";

/** Só a palavra e a tinta: arraste de lado para inclinar a gravidade. */

import { DripWord } from "../../../registry/visant/ui/drip-word";
import type { DemoProps } from "../catalog";

export default function DripWordDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full place-items-center p-4">
      <DripWord {...props} />
    </div>
  );
}
