"use client";

/**
 * Um inspetor de exemplo: o som de um clipe e o quadro de uma peça. Arraste uma linha de slider,
 * clique nela para digitar, use as setas (Shift anda 10), dois cliques voltam ao padrão. Mexer numa
 * pasta acende o reset dela. Os valores vivem num useState: o kit não sabe de onde vem o dado.
 */

import * as React from "react";
import {
  formatNumber,
  InspectorColor,
  InspectorRow,
  InspectorSection,
  InspectorSegments,
  InspectorSlider,
  InspectorSwatches,
  InspectorThumb,
  InspectorThumbs,
  InspectorToggle,
  InspectorVector,
} from "../../../registry/visant/blocks/inspector-controls";

const SOM = { volume: 1, entrada: 0, saida: 0.4, grave: 0, agudo: 0, passaAlta: "0" };
const QUADRO = { proporcao: "16:9", x: 50, y: 50, fundo: "#1E1E1E", rotulo: "ciano", ima: true };
const PROPORCOES = [
  { id: "16:9", r: 16 / 9 },
  { id: "9:16", r: 9 / 16 },
  { id: "1:1", r: 1 },
  { id: "4:5", r: 4 / 5 },
];
// Cores do exemplo por token do tema: a amostra aceita qualquer cor CSS, inclusive var(--…).
const ROTULOS = [
  { value: "marca", color: "var(--brand)", label: "Cor da marca" },
  { value: "texto", color: "var(--foreground)", label: "Cor do texto" },
  { value: "apagada", color: "var(--muted-foreground)", label: "Apagada" },
  { value: "linha", color: "var(--border)", label: "Linha" },
];

export default function InspectorControlsDemo() {
  const [som, setSom] = React.useState(SOM);
  const [quadro, setQuadro] = React.useState(QUADRO);
  const somSujo = JSON.stringify(som) !== JSON.stringify(SOM);
  const quadroSujo = JSON.stringify(quadro) !== JSON.stringify(QUADRO);
  const pct = (v: number) => String(Math.round(v * 100));
  const db = (v: number) => `${v > 0 ? "+" : ""}${formatNumber(v, 1)}`;

  return (
    <div className="mx-auto h-full w-full max-w-[20rem] overflow-y-auto bg-background text-foreground">
      <InspectorSection title="Som" dirty={somSujo} onReset={() => setSom(SOM)}>
        <InspectorSlider label="Volume" value={som.volume} min={0} max={1.5} step={0.01} defaultValue={1} unit="%" format={pct} parse={(s) => Number(s.replace(",", ".")) / 100} onValueChange={(v) => setSom({ ...som, volume: v })} />
        <InspectorSlider label="Entrada" ariaLabel="Fade de entrada" value={som.entrada} min={0} max={5} step={0.05} defaultValue={0} unit="s" decimals={2} onValueChange={(v) => setSom({ ...som, entrada: v })} />
        <InspectorSlider label="Saída" ariaLabel="Fade de saída" value={som.saida} min={0} max={5} step={0.05} defaultValue={0} unit="s" decimals={2} onValueChange={(v) => setSom({ ...som, saida: v })} />
      </InspectorSection>
      <InspectorSection title="Equalização" aside="2 bandas">
        <InspectorSlider label="Graves" value={som.grave} min={-12} max={12} step={0.5} defaultValue={0} unit="dB" format={db} onValueChange={(v) => setSom({ ...som, grave: v })} />
        <InspectorSlider label="Agudos" value={som.agudo} min={-12} max={12} step={0.5} defaultValue={0} unit="dB" format={db} onValueChange={(v) => setSom({ ...som, agudo: v })} />
        <InspectorRow label="Passa-alta">
          <InspectorSegments
            label="Passa-alta"
            value={som.passaAlta}
            onValueChange={(v) => setSom({ ...som, passaAlta: v })}
            options={[
              { value: "0", label: "Sem" },
              { value: "80", label: "80 Hz" },
              { value: "150", label: "150" },
              { value: "300", label: "300" },
            ]}
          />
        </InspectorRow>
      </InspectorSection>
      <InspectorSection title="Quadro" dirty={quadroSujo} onReset={() => setQuadro(QUADRO)}>
        <InspectorThumbs label="Proporção" columns={4}>
          {PROPORCOES.map((p) => (
            <InspectorThumb key={p.id} label={p.id} selected={quadro.proporcao === p.id} onSelect={() => setQuadro({ ...quadro, proporcao: p.id })}>
              <span aria-hidden style={{ display: "block", aspectRatio: String(p.r), [p.r >= 1 ? "width" : "height"]: "55%", borderRadius: 3, boxShadow: "inset 0 0 0 1.5px currentColor" }} />
            </InspectorThumb>
          ))}
        </InspectorThumbs>
        <InspectorVector
          label="Posição"
          parts={[
            { letter: "X", value: quadro.x, min: 0, max: 100, unit: "%", onValueChange: (v) => setQuadro({ ...quadro, x: v }) },
            { letter: "Y", value: quadro.y, min: 0, max: 100, unit: "%", onValueChange: (v) => setQuadro({ ...quadro, y: v }) },
          ]}
        />
        <InspectorColor label="Fundo" value={quadro.fundo} onValueChange={(c) => setQuadro({ ...quadro, fundo: c })} />
        <InspectorRow label="Rótulo">
          <InspectorSwatches label="Cor do rótulo" value={quadro.rotulo} options={ROTULOS} onValueChange={(v) => setQuadro({ ...quadro, rotulo: v })} />
        </InspectorRow>
        <InspectorToggle label="Ímã nas bordas" checked={quadro.ima} onCheckedChange={(v) => setQuadro({ ...quadro, ima: v })} />
      </InspectorSection>
    </div>
  );
}
