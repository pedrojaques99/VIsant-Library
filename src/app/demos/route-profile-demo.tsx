"use client";

/** O relevo de exemplo que vem na peça: arraste pelo terreno. */

import { RouteProfile } from "../../../registry/visant/ui/route-profile";
import type { DemoProps } from "../catalog";

export default function RouteProfileDemo({ props }: DemoProps) {
  return (
    <div className="grid h-full w-full place-items-center p-4">
      <RouteProfile {...props} />
    </div>
  );
}
