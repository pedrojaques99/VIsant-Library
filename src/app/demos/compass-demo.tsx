"use client";

/** A peça sozinha e já inclinada: o mouse segue, o dedo arrasta no mostrador. */

import { Compass } from "../../../registry/visant/ui/compass";
import type { DemoProps } from "../catalog";

export default function CompassDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full place-items-center p-6">
      <Compass {...props} />
    </div>
  );
}
