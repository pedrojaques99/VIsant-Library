"use client";

/** ZONE, aprovada no lab (2026-11-05-fuso): a peça sozinha, como nasceu lá. */

import { ZoneReader } from "../../../registry/visant/ui/zone-reader";

export default function ZoneReaderDemo() {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="w-full">
        <ZoneReader />
      </div>
    </div>
  );
}
