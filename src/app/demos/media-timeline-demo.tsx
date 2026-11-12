"use client";

/**
 * Uma montagem de exemplo com vídeo, voz, trilha e efeitos. Arraste e apare os clipes, arraste na
 * régua (scrub), desenhe uma área no vazio, troque para a navalha (C) e corte, Ctrl+roda para
 * aproximar, renomeie a faixa com dois cliques. Os dados vivem num useState: é a prova de que o
 * componente não sabe de onde eles vêm.
 */

import * as React from "react";
import { MousePointer2, Scissors, Minus, Plus, UnfoldHorizontal } from "lucide-react";
import {
  createClock, MediaTimeline, useMediaTimeline, WithTime, timecode,
  type MediaClip, type MediaTrack, type TrackState,
} from "../../../registry/visant/blocks/media-timeline";

interface Faixa { id: string; label: string; tipo: "video" | "voz" | "trilha" | "sfx"; clips: MediaClip[] }

const DURACAO = 24;
const sfx = (prefixo: string, tempos: number[]) => tempos.map((t, i) => ({ id: `${prefixo}-${i}`, start: t, end: t + 0.4, name: `Efeito ${i + 1}` }));
const INICIAL: Faixa[] = [
  { id: "video", label: "Vídeo", tipo: "video", clips: [{ id: "v1", start: 0, end: 9, name: "Abertura" }, { id: "v2", start: 9, end: 17.5, name: "Produto" }, { id: "v3", start: 17.5, end: 24, name: "Assinatura" }] },
  { id: "voz", label: "Voz", tipo: "voz", clips: [{ id: "n1", start: 0.6, end: 6.2, name: "Narração 1" }, { id: "n2", start: 7, end: 15.8, name: "Narração 2" }, { id: "n3", start: 16.5, end: 22, name: "Narração 3" }] },
  { id: "trilha", label: "Trilha", tipo: "trilha", clips: [{ id: "t1", start: 0, end: 24, name: "Trilha" }] },
  { id: "sfx-1", label: "SFX 1", tipo: "sfx", clips: sfx("a", [1.2, 3.4, 5.1, 9, 11.3, 14.7, 18.2, 21.5]) },
  { id: "sfx-2", label: "SFX 2", tipo: "sfx", clips: sfx("b", [2.2, 4.8, 8.1, 12.6, 13.4, 16.9, 20.3, 23]) },
];

const fora = (s: Set<string>, id: string) => { const n = new Set(s); if (!n.delete(id)) n.add(id); return n; };

export default function MediaTimelineDemo() {
  const clock = React.useMemo(() => createClock(0), []);
  const tl = useMediaTimeline({ duration: DURACAO, clock, minPxPerSecond: 12 });
  const [faixas, setFaixas] = React.useState(INICIAL);
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const [tool, setTool] = React.useState<"select" | "razor">("select");
  const [travadas, setTravadas] = React.useState<Set<string>>(new Set());
  const [caladas, setCaladas] = React.useState<Set<string>>(new Set());
  const [solo, setSolo] = React.useState<Set<string>>(new Set());
  const [faixaSel, setFaixaSel] = React.useState<Set<string>>(new Set());
  const [editando, setEditando] = React.useState<string | null>(null);

  const mudarClipe = (id: string, patch: Partial<MediaClip>) =>
    setFaixas((fs) => fs.map((f) => (f.clips.some((c) => c.id === id) ? { ...f, clips: f.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) } : f)));
  const cortar = (id: string, t: number) =>
    setFaixas((fs) => fs.map((f) => ({ ...f, clips: f.clips.flatMap((c) => (c.id === id && t > c.start && t < c.end ? [{ ...c, end: t }, { ...c, id: `${c.id}+${t.toFixed(2)}`, start: t }] : [c])) })));

  // Os arrays de clipes só mudam quando a faixa muda: a timeline redesenha só o que mudou.
  const comSel = React.useMemo(() => faixas.map((f) => ({ ...f, clips: f.clips.map((c) => (sel.has(c.id) === !!c.selected ? c : { ...c, selected: sel.has(c.id) })) })), [faixas, sel]);
  const tracks: MediaTrack[] = comSel.map((f) => ({
    id: f.id, label: f.label, clips: f.clips, locked: travadas.has(f.id), renamable: true,
    color: f.tipo === "video" ? "var(--foreground)" : "var(--brand)",
    controls: f.tipo === "video" ? { lock: true } : { solo: true, mute: true, lock: true },
  }));
  const estado = (id: string): TrackState => ({ locked: travadas.has(id), muted: caladas.has(id), solo: solo.has(id) });
  const pontos = React.useMemo(() => [0, DURACAO, ...faixas.flatMap((f) => f.clips.flatMap((c) => [c.start, c.end]))], [faixas]);
  const tipoDe = (faixa: string) => faixas.find((f) => f.id === faixa)?.tipo ?? "sfx";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
      <div className="flex flex-none items-center gap-1 border-b border-border px-3 py-1.5 text-sm">
        <span className="tabular-nums"><WithTime clock={clock}>{(t) => timecode(t)}</WithTime></span>
        <span className="tabular-nums text-muted-foreground">/ {timecode(DURACAO)}</span>
        <div className="ml-auto flex items-center gap-1">
          <BotaoDemo ativo={tool === "select"} rotulo="Selecionar (V)" onClick={() => setTool("select")}><MousePointer2 /></BotaoDemo>
          <BotaoDemo ativo={tool === "razor"} rotulo="Navalha (C)" onClick={() => setTool("razor")}><Scissors /></BotaoDemo>
          <span aria-hidden className="w-2" />
          <BotaoDemo rotulo="Afastar (−)" onClick={() => tl.zoomTo(tl.zoomTarget() / 1.5)}><Minus /></BotaoDemo>
          <BotaoDemo rotulo="Aproximar (=)" onClick={() => tl.zoomTo(tl.zoomTarget() * 1.5)}><Plus /></BotaoDemo>
          <BotaoDemo rotulo="Ajustar à tela (Shift+Z)" onClick={tl.fit}><UnfoldHorizontal /></BotaoDemo>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <MediaTimeline controller={tl} tracks={tracks} clock={clock} tool={tool} onToolChange={setTool} snapPoints={pontos}
          renderClip={(c, faixa, { px }) => (
            <span className="mt-demo-clip" data-tipo={tipoDe(faixa)} data-calado={caladas.has(faixa) || (solo.size > 0 && !solo.has(faixa)) ? "" : undefined}>
              {px > 44 ? <span className="mt-demo-nome">{c.name}</span> : null}
            </span>
          )}
          onMove={({ clip, start, end }) => mudarClipe(clip.id, { start, end })}
          onResize={({ clip, start, end }) => mudarClipe(clip.id, { start, end })}
          onClipClick={(c, _f, e) => setSel((s) => (e.shiftKey ? fora(s, c.id) : new Set([c.id])))}
          onEmptyClick={() => setSel(new Set())}
          onAreaSelect={(ids, { additive }) => setSel((s) => new Set([...(additive ? s : []), ...ids]))}
          onCut={(c, _f, t) => cortar(c.id, t)}
          trackState={estado} selectedTracks={faixaSel} editingTrack={editando}
          onTrackSelect={(id, somar) => setFaixaSel((s) => (somar ? fora(s, id) : new Set([id])))}
          onTrackEdit={setEditando}
          onTrackRename={(id, nome) => setFaixas((fs) => fs.map((f) => (f.id === id ? { ...f, label: nome } : f)))}
          onTrackLock={(id) => setTravadas((s) => fora(s, id))}
          onTrackMute={(id) => setCaladas((s) => fora(s, id))}
          onTrackSolo={(id) => setSolo((s) => fora(s, id))}
          emptyHints={faixas.filter((f) => !f.clips.length).map((f) => ({ track: f.id, text: "Faixa vazia." }))} />
      </div>
      <style>{`
        .mt-demo-clip { position: absolute; inset: 3px 0; display: flex; align-items: center; padding: 0 6px; border-radius: 4px; overflow: hidden;
          background: color-mix(in oklab, var(--brand) 26%, var(--background)); color: var(--foreground); font-size: 0.6875rem; font-weight: 500; }
        .mt-demo-clip[data-tipo="video"] { background: color-mix(in oklab, var(--foreground) 16%, var(--background)); }
        .mt-demo-clip[data-tipo="trilha"] { background: color-mix(in oklab, var(--brand) 14%, var(--background)); }
        .mt-demo-clip[data-calado] { opacity: 0.45; }
        .timeline-editor-action-selected .mt-demo-clip, .mt-clip[data-in-marquee] > .mt-demo-clip { box-shadow: inset 0 0 0 1px var(--brand); background: color-mix(in oklab, var(--brand) 42%, var(--background)); }
        .mt-demo-nome { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
    </div>
  );
}

function BotaoDemo({ ativo, rotulo, onClick, children }: { ativo?: boolean; rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={rotulo} aria-pressed={ativo} title={rotulo} onClick={onClick}
      className="grid size-7 place-items-center rounded-[var(--r-control)] text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:text-foreground [&_svg]:size-4">
      {children}
    </button>
  );
}
