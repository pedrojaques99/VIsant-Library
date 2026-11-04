"use client";

/** A folha do mostrador, com as cores da referência dadas pelos tokens da peça. */

import type * as React from "react";

import { SensorDial } from "../../../registry/visant/ui/sensor-dial";

export default function SensorDialDemo() {
  return (
    <div className="grid h-full w-full place-items-center overflow-hidden p-3">
      <div
        className="h-full max-h-[40rem] w-full max-w-[24rem] overflow-hidden rounded-[2rem]"
        style={{ "--sensor-sheet": "oklch(0.72 0.05 165)", "--sensor-hit": "oklch(0.92 0.17 110)", "--sensor-title": "white" } as React.CSSProperties}
      >
        <SensorDial />
      </div>
    </div>
  );
}
