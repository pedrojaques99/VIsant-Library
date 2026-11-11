"use client";

/** DETENT, aprovada no lab (2026-11-08-detent): a peça sozinha, como nasceu lá. */

import { DetentTray } from "../../../registry/visant/ui/detent-tray";

export default function DetentTrayDemo() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-full w-full">
        <DetentTray />
      </div>
    </div>
  );
}
