"use client";

/** FILES, aprovada no lab (2026-11-07-pastas): a peça sozinha, como nasceu lá. */

import { FolderTabs } from "../../../registry/visant/ui/folder-tabs";

export default function FolderTabsDemo() {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="w-full">
        <FolderTabs />
      </div>
    </div>
  );
}
