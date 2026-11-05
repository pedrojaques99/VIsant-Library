"use client";

/** Uma folha com tamanho de folha: a lâmpada anda por ela toda. */

import { RakingLight } from "../../../registry/visant/ui/raking-light";
import type { DemoProps } from "../catalog";

export default function RakingLightDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full place-items-center p-3">
      <RakingLight className="h-[19.75rem] max-w-[33.5rem]" {...props} />
    </div>
  );
}
