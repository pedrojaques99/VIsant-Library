/**
 * The contract every lab experiment exports.
 *
 * One file = one experiment = `export const meta` + `export default` component.
 * The page discovers files by glob, so a daily run only ADDS a file: no index to
 * edit, no registry entry, nothing else to keep in sync. `npm run lab:check`
 * validates this shape (and the rules in RULES.md) before anything is committed.
 */

import type { ReactElement } from "react";

export type LabStatus = "candidate" | "kept";

export interface LabMeta {
  /** `<yyyy-mm-dd>-<slug>`, identical to the file name. */
  id: string;
  /** `yyyy-mm-dd`, the day the generator made it. */
  date: string;
  title: string;
  /** Mono bracket label, top-left of the card: `[ LEVEL ]`. One word. */
  label: string;
  /** Tiny instruction, top-right: the single gesture, in plain words. */
  hint: string;
  /** The same instruction for a finger, shown under `(pointer: coarse)`: "arraste", "toque", "segure". */
  hintTouch?: string;
  /** The math behind it, one mono line at the bottom of the card. */
  formula: string;
  /** Rule ids from lab/RULES.md that this experiment follows. */
  rules: string[];
  status: LabStatus;
  /** What the taste model learns from (scripts/lab-taste.mjs). One value each. */
  tags: LabTags;
  /** Why this combo today: the `pnpm lab:next` line, or the written reason to deviate. */
  rationale: string;
  /** How the piece enters the catalog once approved (`pnpm lab:promote`). In Portuguese. */
  catalogo?: LabCatalogo;
}

/**
 * What `lab:promote` writes into the catalog and registry when the owner approves the
 * piece. Optional: without it the name is the label in lowercase and the description
 * is the first sentence of the header.
 */
export interface LabCatalogo {
  /** Registry name, kebab-case, English (`ticket-stub`): `shadcn add @visant/<nome>`. */
  nome: string;
  titulo?: string;
  /** One sentence, Portuguese, like the other catalog descriptions. */
  descricao: string;
  /** Search words, Portuguese. */
  tags: string[];
  familia?: "controles" | "feedback" | "conteudo" | "texto" | "efeitos";
  quando?: string;
  evite?: string;
  preview?: { w: number; h: number };
}

export interface LabTags {
  input: "drag" | "tilt" | "scroll" | "pointer" | "press";
  family: "mechanical" | "ink-print" | "fluid" | "optics" | "typography" | "light" | "material" | "other";
  intensity: "subtle" | "medium" | "bold";
  response: "snap" | "spring" | "inertia" | "direct";
}

export interface LabModule {
  meta: LabMeta;
  default: () => ReactElement;
}

/** Where a lab component came from: credited, linked, never copied. */
export interface LabSource {
  title: string;
  url: string;
  studio: string;
  /** The Behance gallery it was featured in (ui-ux, graphic-design, motion): the taste learns which sources win. */
  gallery: string;
  /** Local reference images (lab/.refs/, gitignored) the run looked at. */
  refs: string[];
}

/**
 * A lab COMPONENT (lab/components/): a refined, interactive piece inspired by a
 * featured Behance project. Same verdict flow as an experiment; a kept one is
 * "pronto pra colher" and only reaches registry/ when the owner asks.
 */
export interface LabComponentMeta extends LabMeta {
  kind: "component";
  source: LabSource;
  /** ONE sentence: what makes the source special. Designed from this, not from its pixels. */
  inspiration: string;
  /** The two concepts thought through and not shipped, one line each (why they lost). */
  sketches: string[];
}

export interface LabComponentModule {
  meta: LabComponentMeta;
  default: () => ReactElement;
}
