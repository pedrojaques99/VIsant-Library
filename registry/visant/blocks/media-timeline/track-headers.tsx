import * as React from "react";
import { ChevronRight, EyeOff, Lock, LockOpen, Volume2, VolumeX } from "lucide-react";
import { InlineEdit } from "@/components/ui/inline-edit";
import { cn } from "@/lib/utils";

// Cabeçalhos das faixas: nome (renomeável no lugar), cor, solo, calar, esconder e travar, e os
// grupos que recolhem. Não sabe de dado: recebe as faixas e o estado por props e devolve cada
// gesto por callback.

export interface TrackHeader {
  id: string;
  label: string;
  height: number;
  /** Cor do ponto (valor CSS, de preferência um token). Sem cor, sem ponto. */
  color?: string;
  /** Cabeçalho de grupo: recolhido ou não, e quantas faixas tem. */
  group?: { collapsed: boolean; count: number };
  /** Faixa dentro de um grupo aberto: recua um passo. */
  nested?: boolean;
  /** Quais botões a linha tem. */
  controls?: { solo?: boolean; mute?: boolean; hide?: boolean; lock?: boolean };
  renamable?: boolean;
}
export interface TrackState { locked: boolean; muted: boolean; solo: boolean; hidden?: boolean }

export interface TrackHeaderLabels {
  list: string; name: string; solo: string; mute: string; unmute: string; hide: string;
  lock: string; unlock: string; expand: string; collapse: string; renameHint: string;
}
export const TRACK_HEADER_LABELS: TrackHeaderLabels = {
  list: "Faixas", name: "Nome da faixa", solo: "Solo em", mute: "Calar", unmute: "Ouvir", hide: "Esconder",
  lock: "Travar", unlock: "Destravar", expand: "Abrir", collapse: "Recolher", renameHint: "dois cliques ou F2 renomeiam",
};

export interface TrackHeadersProps {
  tracks: TrackHeader[];
  state: (id: string) => TrackState;
  selected: Set<string>;
  editing: string | null;
  /** Espaço em cima (a altura da régua), para as linhas casarem com as faixas. */
  top: number;
  className?: string;
  labels?: Partial<TrackHeaderLabels>;
  onEdit: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onSelect: (id: string, additive: boolean) => void;
  onLock: (id: string) => void;
  onMute: (id: string) => void;
  onSolo: (id: string) => void;
  onCollapse: (id: string) => void;
  /** Tira a linha da timeline (quem chama decide onde ela continua aparecendo). */
  onHide?: (id: string) => void;
}

export const TrackHeaders = React.forwardRef<HTMLDivElement, TrackHeadersProps>(function TrackHeaders(
  { tracks, state, selected, editing, top, className, labels, onEdit, onRename, onSelect, onLock, onMute, onSolo, onCollapse, onHide }, ref) {
  const L = { ...TRACK_HEADER_LABELS, ...labels };
  return (
    <div ref={ref} role="listbox" aria-label={L.list} aria-multiselectable className={cn("mt-headers", className)} style={{ paddingTop: top }}>
      {tracks.map((t) => {
        const s = state(t.id);
        const c = t.controls ?? {};
        return (
          <div key={t.id} role="option" aria-selected={selected.has(t.id)} tabIndex={0} data-track={t.id} data-alvo={`faixa:${t.id}`}
            className={cn("mt-track-header", t.group && "is-group", t.nested && "is-nested", s.muted && "is-muted")}
            style={{ height: t.height }}
            onClick={(e) => { if (!(e.target as HTMLElement).closest("button, input")) onSelect(t.id, e.shiftKey || e.ctrlKey || e.metaKey); }}
            onDoubleClick={(e) => { if (t.renamable && !(e.target as HTMLElement).closest("button")) onEdit(t.id); }}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "F2" && t.renamable) { e.preventDefault(); e.stopPropagation(); onEdit(t.id); }
              else if ((e.key === "Enter" || e.key === " ") && t.group) { e.preventDefault(); e.stopPropagation(); onCollapse(t.id); }
            }}>
            {t.group ? (
              <button type="button" className="mt-track-chevron" aria-expanded={!t.group.collapsed} aria-label={`${t.group.collapsed ? L.expand : L.collapse} ${t.label}`} onClick={() => onCollapse(t.id)}>
                <ChevronRight className={cn(!t.group.collapsed && "rotate-90")} />
              </button>
            ) : t.color ? <span aria-hidden className="mt-track-dot" style={{ background: t.color }} /> : null}
            {editing === t.id
              ? <TrackRename value={t.label} label={L.name} onSave={(n) => { onRename(t.id, n); onEdit(null); }} onCancel={() => onEdit(null)} />
              : <span className="mt-track-name" title={t.renamable ? `${t.label} (${L.renameHint})` : t.label}>{t.label}{t.group ? <span className="mt-num mt-track-count"> {t.group.count}</span> : null}</span>}
            <span className="mt-track-actions">
              {c.solo ? <TrackButton active={s.solo} label={`${L.solo} ${t.label}`} onClick={() => onSolo(t.id)}><span className="mt-track-solo">S</span></TrackButton> : null}
              {c.mute ? <TrackButton active={s.muted} label={`${s.muted ? L.unmute : L.mute} ${t.label}`} onClick={() => onMute(t.id)}>{s.muted ? <VolumeX /> : <Volume2 />}</TrackButton> : null}
              {c.hide && onHide ? <TrackButton active={false} label={`${L.hide} ${t.label}`} onClick={() => onHide(t.id)}><EyeOff /></TrackButton> : null}
              {c.lock ? <TrackButton active={s.locked} label={`${s.locked ? L.unlock : L.lock} ${t.label}`} onClick={() => onLock(t.id)}>{s.locked ? <Lock /> : <LockOpen />}</TrackButton> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
});

/** Edição no lugar: Enter grava, Esc cancela, sair do campo grava. */
export function TrackRename({ value, label, onSave, onCancel }: { value: string; label: string; onSave: (n: string) => void; onCancel: () => void }) {
  const [text, setText] = React.useState(value);
  const done = React.useRef(false);
  const save = () => { if (done.current) return; done.current = true; if (text.trim() === value) onCancel(); else onSave(text); };
  return (
    <InlineEdit isEditing value={value} onStartEdit={() => {}} className="min-w-0 flex-1 [--ie-h:1.5rem]"
      onSave={async () => save()} onCancel={() => { done.current = true; onCancel(); }}>
      <input autoFocus aria-label={label} value={text} maxLength={40} onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.currentTarget.select()} onBlur={save} className="mt-track-input" />
    </InlineEdit>
  );
}

/** Botão de estado da faixa (solo, calar, esconder, travar): desligado só aparece no hover da linha. */
export function TrackButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-pressed={active} title={label} onClick={onClick} className="mt-track-button">
      {children}
    </button>
  );
}
