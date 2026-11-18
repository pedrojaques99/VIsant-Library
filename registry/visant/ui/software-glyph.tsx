"use client";

import * as React from "react";
import {
  Bot,
  FileText,
  FolderOpen,
  Globe,
  type LucideIcon,
  PencilLine,
  Search,
  SquareTerminal,
  Wrench,
} from "lucide-react";
import {
  type SimpleIcon,
  siBehance,
  siBlender,
  siClaude,
  siDiscord,
  siDribbble,
  siFfmpeg,
  siFigma,
  siFramer,
  siGithub,
  siGmail,
  siGooglecalendar,
  siGooglechrome,
  siGoogledocs,
  siGoogledrive,
  siGooglegemini,
  siGooglesheets,
  siInstagram,
  siLinear,
  siNotion,
  siPinterest,
  siSpotify,
  siStripe,
  siSupabase,
  siTiktok,
  siVercel,
  siVimeo,
  siWhatsapp,
  siYoutube,
} from "simple-icons";

import { cn } from "@/lib/utils";

/**
 * Software Glyph — o logo de um software em uma cor só, e os dois leitores que
 * descobrem QUAL software está por trás de um nome de ferramenta ou de um link.
 *
 * Colhido do painel do agente do Estúdio (jaques-os), onde a linha de ações
 * mostrava `mcp__claude_ai_Figma__get_metadata, Bash` cru e o link do Figma
 * colado ocupava três linhas da bolha.
 *
 * ── O que não é óbvio ──────────────────────────────────────────────────────
 *
 * 1. **Uma cor só (`currentColor`).** A interface tem um destaque, e é o da
 *    marca dona da tela. Logo de terceiro em cor própria vira confete numa
 *    lista de dez ações.
 * 2. **Monograma onde o simple-icons não tem o logo.** A Adobe, a Canva, a
 *    OpenAI e o Slack saíram do simple-icons por pedido das marcas; a v16 não
 *    tem nenhum dos quatro. A saída é a sigla que o próprio software usa (Pr,
 *    Ps, Ai) numa moldura, e nunca um SVG copiado de outro lugar.
 * 3. **Só ícones que existem na v15 e na v16.** O app que instala pode estar em
 *    qualquer uma das duas; importar um ícone removido quebra o build dele.
 * 4. **Não sabe de onde vem o nome.** `softwareFromTool` lê o padrão
 *    `mcp__<servidor>__<ação>` e os nomes nativos do Claude Code (Bash, Read);
 *    quem tem outro agente passa outro nome e cai em "ferramenta".
 */

export interface Software {
  id: string;
  name: string;
  /** Logo do simple-icons, desenhado em `currentColor`. */
  icon?: SimpleIcon;
  /** Sigla em moldura, quando não há logo livre ("Pr"). */
  mono?: string;
  /** Ícone genérico, para o que não é marca (terminal, arquivo). */
  lucide?: LucideIcon;
  /** Casa com o servidor MCP ou o nome da ferramenta. */
  tool?: RegExp;
  /** Casa com o host do link. */
  host?: RegExp;
}

export const SOFTWARE: Software[] = [
  { id: "figma", name: "Figma", icon: siFigma, tool: /figma/i, host: /(^|\.)figma\.com$/ },
  { id: "premiere", name: "Premiere Pro", mono: "Pr", tool: /premiere/i },
  { id: "photoshop", name: "Photoshop", mono: "Ps", tool: /photoshop/i },
  { id: "illustrator", name: "Illustrator", mono: "Ai", tool: /illustrator/i },
  { id: "after-effects", name: "After Effects", mono: "Ae", tool: /after.?effects/i },
  { id: "adobe", name: "Adobe", mono: "Ad", tool: /adobe|acrobat|express|firefly/i, host: /(^|\.)adobe\.com$/ },
  { id: "drive", name: "Google Drive", icon: siGoogledrive, tool: /google_?drive/i, host: /^drive\.google\.com$/ },
  { id: "docs", name: "Google Docs", icon: siGoogledocs, host: /^docs\.google\.com$/ },
  { id: "sheets", name: "Google Sheets", icon: siGooglesheets },
  { id: "gmail", name: "Gmail", icon: siGmail, tool: /gmail/i, host: /^mail\.google\.com$/ },
  { id: "calendar", name: "Google Agenda", icon: siGooglecalendar, tool: /calendar/i, host: /^calendar\.google\.com$/ },
  { id: "linear", name: "Linear", icon: siLinear, tool: /linear/i, host: /(^|\.)linear\.app$/ },
  { id: "github", name: "GitHub", icon: siGithub, tool: /github/i, host: /(^|\.)github\.com$/ },
  { id: "vercel", name: "Vercel", icon: siVercel, tool: /vercel/i, host: /(^|\.)vercel\.(com|app)$/ },
  { id: "supabase", name: "Supabase", icon: siSupabase, tool: /supabase/i, host: /(^|\.)supabase\.(com|co)$/ },
  { id: "stripe", name: "Stripe", icon: siStripe, tool: /stripe/i, host: /(^|\.)stripe\.com$/ },
  { id: "notion", name: "Notion", icon: siNotion, tool: /notion/i, host: /(^|\.)notion\.(so|site)$/ },
  { id: "canva", name: "Canva", mono: "Cv", tool: /canva/i, host: /(^|\.)canva\.com$/ },
  { id: "chrome", name: "Navegador", icon: siGooglechrome, tool: /chrome|browser/i },
  { id: "claude", name: "Claude", icon: siClaude, tool: /claude_docs|artifact/i, host: /(^|\.)claude\.ai$/ },
  { id: "gemini", name: "Gemini", icon: siGooglegemini, tool: /gemini/i, host: /^gemini\.google\.com$/ },
  { id: "openai", name: "OpenAI", mono: "AI", tool: /openai|codex/i, host: /(^|\.)(openai|chatgpt)\.com$/ },
  { id: "youtube", name: "YouTube", icon: siYoutube, tool: /youtube/i, host: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { id: "instagram", name: "Instagram", icon: siInstagram, host: /(^|\.)instagram\.com$/ },
  { id: "tiktok", name: "TikTok", icon: siTiktok, host: /(^|\.)tiktok\.com$/ },
  { id: "vimeo", name: "Vimeo", icon: siVimeo, host: /(^|\.)vimeo\.com$/ },
  { id: "behance", name: "Behance", icon: siBehance, host: /(^|\.)behance\.net$/ },
  { id: "dribbble", name: "Dribbble", icon: siDribbble, host: /(^|\.)dribbble\.com$/ },
  { id: "pinterest", name: "Pinterest", icon: siPinterest, host: /(^|\.)pinterest\.[a-z.]+$/ },
  { id: "framer", name: "Framer", icon: siFramer, host: /(^|\.)framer\.(com|website)$/ },
  { id: "spotify", name: "Spotify", icon: siSpotify, host: /(^|\.)spotify\.com$/ },
  { id: "whatsapp", name: "WhatsApp", icon: siWhatsapp, host: /(^|\.)(whatsapp\.com|wa\.me)$/ },
  { id: "discord", name: "Discord", icon: siDiscord, host: /(^|\.)discord\.(com|gg)$/ },
  { id: "blender", name: "Blender", icon: siBlender, tool: /blender/i },
  { id: "ffmpeg", name: "FFmpeg", icon: siFfmpeg, tool: /ffmpeg/i },
  { id: "terminal", name: "Terminal", lucide: SquareTerminal },
  { id: "arquivo", name: "Arquivo", lucide: FileText },
  { id: "edicao", name: "Edição", lucide: PencilLine },
  { id: "pasta", name: "Pasta", lucide: FolderOpen },
  { id: "busca", name: "Busca", lucide: Search },
  { id: "web", name: "Web", lucide: Globe },
  { id: "agente", name: "Agente", lucide: Bot },
  { id: "ferramenta", name: "Ferramenta", lucide: Wrench },
];

const POR_ID = new Map(SOFTWARE.map((s) => [s.id, s]));
export const softwareById = (id: string): Software => POR_ID.get(id) ?? POR_ID.get("ferramenta")!;

/** Ferramentas nativas de agente de código: o nome diz o software e a ação. */
const NATIVAS: Record<string, [string, string]> = {
  bash: ["terminal", "rodar comando"],
  powershell: ["terminal", "rodar comando"],
  read: ["arquivo", "ler"],
  write: ["edicao", "escrever"],
  edit: ["edicao", "editar"],
  multiedit: ["edicao", "editar"],
  notebookedit: ["edicao", "editar notebook"],
  grep: ["busca", "procurar no código"],
  glob: ["busca", "procurar arquivos"],
  ls: ["pasta", "listar"],
  webfetch: ["web", "abrir página"],
  websearch: ["web", "pesquisar"],
  agent: ["agente", "delegar"],
  task: ["agente", "delegar"],
  skill: ["ferramenta", "usar skill"],
  toolsearch: ["ferramenta", "carregar ferramentas"],
  todowrite: ["ferramenta", "lista de tarefas"],
};

const humano = (s: string) => s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

/** `mcp__claude_ai_Figma__get_metadata` → Figma, "get metadata". `Bash` → Terminal, "rodar comando". */
export function softwareFromTool(nome: string): { software: Software; action: string } {
  const mcp = /^mcp__(.+?)__(.+)$/.exec(nome);
  if (mcp) {
    const [, servidor, acao] = mcp;
    const s = SOFTWARE.find((x) => x.tool?.test(servidor)) ?? SOFTWARE.find((x) => x.tool?.test(acao));
    return { software: s ?? { ...softwareById("ferramenta"), name: humano(servidor.replace(/^(claude_ai|plugin)_/, "")) }, action: humano(acao) };
  }
  const nativa = NATIVAS[nome.toLowerCase()];
  if (nativa) return { software: softwareById(nativa[0]), action: nativa[1] };
  return { software: SOFTWARE.find((x) => x.tool?.test(nome)) ?? softwareById("ferramenta"), action: humano(nome) };
}

// ── Link → chip ──────────────────────────────────────────────────────────────
// As regras por serviço vêm do `link-pills` do agentes-chat (packages/client/src/lib/link-pills.ts),
// onde já foram pagas: só o host exato ganha logo (`github.com.evil.example` não), o endereço é
// lido à mão porque o `URL` do celular é parcial, e um caminho que o navegador reescreve (`/../`)
// fica como link comum, para o chip não mostrar um destino que não é o real.

type Dito = { name?: string; ref?: string; word?: string };
type Regra = [RegExp, (g: string[]) => Dito];

const decodificado = (seg: string) => {
  let t = seg;
  try {
    t = decodeURIComponent(seg);
  } catch {
    // "%" solto não é escape: fica como está.
  }
  return t.replace(/[\p{Cc}\p{Cf}]/gu, "");
};
const tituloDe = (slug: string) => decodificado(slug).replace(/[-_+\s]+/g, " ").trim();
const DOC_ID = String.raw`(?:u\/\d+\/)?d\/[\w-]+`;
const PAGINAS_GITHUB =
  "about|account|apps|codespaces|collections|contact|copilot|dashboard|enterprise|explore|features|issues|join|login|marketplace|new|notifications|orgs|organizations|pricing|pulls|search|security|sessions|settings|site|solutions|sponsors|stars|team|topics|trending|users";

const REGRAS: { host: RegExp; id: string; regras: Regra[] }[] = [
  {
    host: /^github\.com$/,
    id: "github",
    regras: [
      [/^\/[\w.-]+\/([\w.-]+)\/pull\/(\d+)(?:\/|$)/, ([r, n]) => ({ name: r, ref: `#${n}` })],
      [/^\/[\w.-]+\/([\w.-]+)\/issues\/(\d+)(?:\/|$)/, ([r, n]) => ({ name: r, ref: `#${n}` })],
      [/^\/[\w.-]+\/([\w.-]+)\/commit\/([0-9a-f]{7,40})(?:\/|$)/, ([r, sha]) => ({ name: r, ref: (sha ?? "").slice(0, 7) })],
      [/^\/[\w.-]+\/([\w.-]+)\/blob\/.*\/([^/]+)$/, ([r, f]) => ({ name: r, ref: decodificado(f ?? "") })],
      [new RegExp(String.raw`^\/((?!(?:${PAGINAS_GITHUB})\/)[\w.-]+\/[\w.-]+)(?<!\.git)\/?$`), ([r]) => ({ name: r })],
    ],
  },
  { host: /^linear\.app$/, id: "linear", regras: [[/^\/[\w-]+\/issue\/([A-Za-z][A-Za-z0-9]*-\d+)(?:\/|$)/, ([i]) => ({ ref: (i ?? "").toUpperCase() })]] },
  {
    host: /^figma\.com$/,
    id: "figma",
    regras: [
      [/^\/(?:file|design|board|slides|proto|make)\/\w+\/([^/]+)\/?$/, ([s]) => ({ name: tituloDe(s ?? "") })],
      [/^\/(?:file|design|board|slides|proto|make)\/\w+\/?$/, () => ({ word: "arquivo" })],
    ],
  },
  { host: /^(?:notion\.so|[a-z0-9-]+\.notion\.site)$/, id: "notion", regras: [[/^\/(?:[^/]+\/)?([^/]+)-[0-9a-f]{32}\/?$/, ([s]) => ({ name: tituloDe(s ?? "") })]] },
  { host: /^docs\.google\.com$/, id: "docs", regras: [[new RegExp(String.raw`^\/document\/${DOC_ID}`), () => ({ word: "documento" })]] },
  { host: /^docs\.google\.com$/, id: "sheets", regras: [[new RegExp(String.raw`^\/spreadsheets\/${DOC_ID}`), () => ({ word: "planilha" })]] },
  { host: /^docs\.google\.com$/, id: "drive", regras: [[new RegExp(String.raw`^\/presentation\/${DOC_ID}`), () => ({ word: "apresentação" })]] },
  {
    host: /^drive\.google\.com$/,
    id: "drive",
    regras: [
      [/^\/file\/(?:u\/\d+\/)?d\/[\w-]+/, () => ({ word: "arquivo" })],
      [/^\/drive\/(?:u\/\d+\/)?folders\/[\w-]+/, () => ({ word: "pasta" })],
    ],
  },
  { host: /^vercel\.com$/, id: "vercel", regras: [[/^\/[\w-]+\/([\w.-]+)(?:\/|$)/, ([p]) => ({ name: p })]] },
  { host: /^(?:youtube\.com|youtu\.be)$/, id: "youtube", regras: [[/^\/(?:watch|shorts\/[\w-]+|[\w-]{11})/, () => ({ word: "vídeo" })]] },
];

const ENDERECO = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/i;
const REESCRITO = /\\|(?:^|\/)(?:\.|%2e){1,2}(?:\/|$)/i;
const ultimo = (caminho: string) => caminho.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || caminho;

/**
 * Um link ou caminho colado vira { software, label } curto para um chip.
 * Devolve null quando o texto não é um link nem um caminho inteiro. Nada é buscado: só o endereço.
 */
export function softwareFromLink(texto: string): { software: Software; label: string; href?: string } | null {
  const t = texto.trim();
  if (!t || /\n/.test(t)) return null;
  const [, autoridade, caminho = "/"] = t.match(ENDERECO) ?? [];
  if (autoridade) {
    if (/\s/.test(t)) return null;
    const host = autoridade.toLowerCase().replace(/^www\./, "");
    if (!REESCRITO.test(caminho)) {
      for (const s of REGRAS) {
        if (!s.host.test(host)) continue;
        for (const [re, dizer] of s.regras) {
          const achou = caminho.match(re);
          if (!achou) continue;
          const d = dizer(achou.slice(1));
          const label = d.word ?? [d.name, d.ref].filter(Boolean).join(" ");
          if (label) return { software: softwareById(s.id), label, href: t };
        }
      }
    }
    // Serviço conhecido sem regra para esse caminho: o logo e o host; o resto, a web.
    const s = SOFTWARE.find((x) => x.host?.test(host));
    return { software: s ?? softwareById("web"), label: s ? s.name : host, href: t };
  }
  // Caminho de disco inteiro: C:\…, \\servidor\…, /home/…
  if (/^([a-z]:[\\/]|\\\\|\/)[^<>|"?*\n]+$/i.test(t)) {
    const drive = /[\\/](meu drive|my drive|shared drives|drives compartilhados)([\\/]|$)/i.test(t);
    const ehArquivo = /\.[a-z0-9]{1,5}$/i.test(t);
    return { software: softwareById(drive ? "drive" : ehArquivo ? "arquivo" : "pasta"), label: ultimo(t) };
  }
  return null;
}

export interface SoftwareGlyphProps extends React.HTMLAttributes<HTMLSpanElement> {
  software: Software | string;
  /** Lado em px. */
  size?: number;
}

/** O logo em `currentColor`, num quadrado de `size`. Decorativo: o nome vai no texto ao lado. */
export function SoftwareGlyph({ software, size = 14, className, style, ...rest }: SoftwareGlyphProps) {
  const s = typeof software === "string" ? softwareById(software) : software;
  const caixa = cn("inline-grid shrink-0 place-items-center", className);
  if (s.icon) {
    return (
      <span aria-hidden="true" className={caixa} style={{ width: size, height: size, ...style }} {...rest}>
        <svg viewBox="0 0 24 24" width={size} height={size} className="fill-current">
          <path d={s.icon.path} />
        </svg>
      </span>
    );
  }
  if (s.mono) {
    return (
      <span
        aria-hidden="true"
        className={cn(caixa, "rounded-[calc(var(--r-control)/2)] font-semibold leading-none tracking-[-0.02em] ring-1 ring-current ring-inset")}
        style={{ width: size, height: size, fontSize: Math.max(7, Math.round(size * 0.5)), ...style }}
        {...rest}
      >
        {s.mono}
      </span>
    );
  }
  const Icone = s.lucide ?? Wrench;
  return (
    <span aria-hidden="true" className={caixa} style={{ width: size, height: size, ...style }} {...rest}>
      <Icone width={size} height={size} strokeWidth={1.75} />
    </span>
  );
}
