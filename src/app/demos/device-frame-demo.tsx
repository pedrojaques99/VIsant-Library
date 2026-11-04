"use client";

/**
 * Um aparelho, grande, com a tela viva. As setas trocam a pose e a peça remonta:
 * a troca já é o replay da entrada.
 */

import { DeviceFrame, type DevicePose } from "../../../registry/visant/ui/device-frame";
import { Trocador, useUmPorVez } from "./um-por-vez";

const POSES: DevicePose[] = ["hero", "left", "right", "front", "flat"];

export default function DeviceFrameDemo() {
  const { atual, rodada, passo, repetir } = useUmPorVez(POSES);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden p-4">
      <div className="min-h-0 w-full max-w-64 flex-1 [display:grid] place-items-center">
        <div className="w-full max-w-[min(100%,calc((100cqh)/2.05))]">
          <DeviceFrame key={rodada} pose={atual} tilt="pointer">
            <video src="/media/video-loop3d.mp4" poster="/media/video-loop3d.webp" autoPlay muted loop playsInline className="h-full w-full object-cover" />
          </DeviceFrame>
        </div>
      </div>
      <Trocador nome={atual} onPasso={passo} onRepetir={repetir} rotulo="pose" />
    </div>
  );
}
