"use client";

/** O papel é o palco inteiro: a lâmpada anda por toda a folha. */

import { RakingLight } from "../../../registry/visant/ui/raking-light";
import type { DemoProps } from "../catalog";

export default function RakingLightDemo({ props }: DemoProps) {
  return <RakingLight className="h-full w-full rounded-none" {...props} />;
}
