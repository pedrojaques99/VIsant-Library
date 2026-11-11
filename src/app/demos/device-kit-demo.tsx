"use client";

/**
 * Um painel de mesa montado só com o kit: o knob muda o ganho que o LCD mostra, a chave liga
 * a unidade (o LED pisca subindo e acende no ar), a tecla REC trava afundada e acende o LED
 * dela. Tudo de mentira; as peças só recebem estado e devolvem gestos.
 */

import * as React from "react";
import { Square } from "lucide-react";

import { DeviceEncoder } from "../../../registry/visant/ui/device-encoder";
import { DeviceKey, DeviceSwitch } from "../../../registry/visant/ui/device-key";
import { DeviceLcd, DeviceProgress, DeviceReadout, DeviceSegments } from "../../../registry/visant/ui/device-lcd";
import { DeviceLed, type DeviceLedState } from "../../../registry/visant/ui/device-led";
import { DeviceEngraving, DeviceScrew, DeviceShell } from "../../../registry/visant/ui/device-shell";

export default function DeviceKitDemo() {
  const [ganho, setGanho] = React.useState(64);
  const [ligado, setLigado] = React.useState(true);
  const [subindo, setSubindo] = React.useState(false);
  const [rec, setRec] = React.useState(false);
  const t = React.useRef<number>(0);
  React.useEffect(() => () => window.clearTimeout(t.current), []);

  const ligar = (v: boolean) => {
    setLigado(v);
    if (!v) return;
    setSubindo(true);
    t.current = window.setTimeout(() => setSubindo(false), 1400);
  };
  const luz: DeviceLedState = subindo ? "blink" : ligado ? "on" : "off";

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-3">
      <DeviceShell size="md" className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <DeviceEngraving>Mesa 01</DeviceEngraving>
          <DeviceLed state={rec ? "breathe" : "off"} tone="red" size="sm" label={rec ? "Gravando" : "Parado"} />
        </div>
        <DeviceLcd lit={ligado}>
          <div className="flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-[0.16em]">
            <span>Ganho</span>
            <DeviceSegments value={ganho / 100} />
          </div>
          <DeviceReadout size="lg" glow={rec} className="mt-2">{String(ganho).padStart(3, "0")}</DeviceReadout>
          <DeviceProgress className="mt-3" value={ganho / 100} label="Ganho" />
        </DeviceLcd>
        <div className="flex items-center justify-between">
          <DeviceKey shape="ring" size="sm" pressed={rec} onClick={() => setRec((r) => !r)} aria-label={rec ? "Parar a gravação" : "Gravar"}>
            <DeviceLed size="md" tone="red" state={rec ? "breathe" : "off"} />
          </DeviceKey>
          <DeviceKey shape="square" disabled={!rec} onClick={() => setRec(false)} aria-label="Parar">
            <Square aria-hidden fill="currentColor" strokeWidth={1.5} />
          </DeviceKey>
          <DeviceEncoder variant="knob" label="Ganho" value={ganho} min={0} max={100} onValueChange={setGanho} valueText={`${ganho}%`} />
        </div>
      </DeviceShell>

      <DeviceShell size="sm" className="flex items-center gap-3">
        <DeviceScrew />
        <DeviceLed state={luz} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">Unidade de rack</span>
          <DeviceEngraving className="text-[9px]">{subindo ? "subindo" : ligado ? "no ar" : "parado"}</DeviceEngraving>
        </div>
        <DeviceLcd size="sm" lit={ligado && !subindo} className="w-20" aria-hidden>
          <DeviceReadout size="sm" className="text-right">:4317</DeviceReadout>
        </DeviceLcd>
        <DeviceSwitch checked={ligado} busy={subindo} onCheckedChange={ligar} aria-label="Ligar a unidade" />
        <DeviceScrew />
      </DeviceShell>
    </div>
  );
}
