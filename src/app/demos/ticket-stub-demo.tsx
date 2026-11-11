"use client";

/** STUB, aprovada no lab (2026-11-08-canhoto): a peça sozinha, como nasceu lá. */

import { TicketStub } from "../../../registry/visant/ui/ticket-stub";

export default function TicketStubDemo() {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="w-full">
        <TicketStub />
      </div>
    </div>
  );
}
