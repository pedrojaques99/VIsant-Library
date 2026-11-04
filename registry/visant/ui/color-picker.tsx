"use client";

import * as React from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { Pipette } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Color Picker: campo, matiz, valor exato, conta-gotas e as cores da marca.
 *
 * O arrasto é do `react-colorful`, que já resolve teclado, toque e ARIA em poucos KB. Esta peça
 * só veste e junta o que um seletor de editor tem: a pessoa arrasta para explorar, digita quando
 * já sabe o valor, e pega a cor de qualquer lugar da tela.
 *
 * ── As decisões ───────────────────────────────────────────────────────────
 *
 * 1. **`touch-action: none` só nas áreas de arrasto.** O palco e a página rolam em pé, e arrastar
 *    a cor na vertical é o gesto principal aqui: sem isto o dedo rolava a página. O resto da peça
 *    deixa a rolagem passar.
 * 2. **Conta-gotas só onde existe.** A API `EyeDropper` não está no Safari nem no Firefox. Lá o
 *    botão não aparece, porque um botão que não faz nada é pior que nenhum.
 * 3. **Sem cor própria.** As amostras vêm de `swatches` e a cor vem de `value`: o cromo em volta
 *    lê só os tokens da marca.
 * 4. **Os estilos daqui levam `!`.** O CSS do `react-colorful` entra fora de qualquer `@layer`, e CSS
 *    fora de camada vence os utilitários do Tailwind, seja qual for o seletor.
 * 5. **A saída é hex.** É o que todo campo, API e design tool aceita. Quem guarda em outro espaço
 *    de cor converte na borda, sem a peça precisar saber.
 */

type ConstrutorEyeDropper = new () => { open: () => Promise<{ sRGBHex: string }> };

export interface ColorPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** A cor atual, em hex de seis dígitos. */
  value: string;
  onChange: (cor: string) => void;
  /** Atalhos, como a paleta da marca. Sem isto, a fileira não aparece. */
  swatches?: string[];
  /** Mostra o conta-gotas nos navegadores que têm a API. */
  eyedropper?: boolean;
  /** Nome do campo para leitor de tela. */
  label?: string;
}

const CONTROLE = "grid size-10 shrink-0 place-items-center rounded-[var(--r-control)] outline-none focus-visible:[box-shadow:var(--focus)] pointer-coarse:size-11";

/* `String.raw`: no Tailwind `_` vira espaço, e os nomes da lib têm dois. Escapado, chega como sublinhado. */
const ESTILO_DA_LIB = String.raw`[&_.react-colorful\_\_saturation]:rounded-[var(--r-control)]! [&_.react-colorful\_\_saturation]:border-b-0! [&_.react-colorful\_\_hue]:h-3! [&_.react-colorful\_\_hue]:flex-none! [&_.react-colorful\_\_hue]:rounded-[var(--r-pill)]! pointer-coarse:[&_.react-colorful\_\_hue]:h-5! [&_.react-colorful\_\_interactive]:touch-none! [&_.react-colorful\_\_pointer]:size-5! pointer-coarse:[&_.react-colorful\_\_pointer]:size-7!`;

export function ColorPicker({ value, onChange, swatches, eyedropper = true, label = "Cor", className, ...props }: ColorPickerProps) {
  const [contaGotas, setContaGotas] = React.useState<ConstrutorEyeDropper | null>(null);

  /* No efeito, não no render: a página pode nascer no servidor, onde a API não existe. */
  React.useEffect(() => {
    const api = (window as unknown as { EyeDropper?: ConstrutorEyeDropper }).EyeDropper;
    if (eyedropper && api) setContaGotas(() => api);
  }, [eyedropper]);

  const pegarDaTela = async () => {
    if (!contaGotas) return;
    try {
      const { sRGBHex } = await new contaGotas().open();
      onChange(sRGBHex);
    } catch {
      /* Esc cancela o conta-gotas: a cor fica como estava. */
    }
  };

  const atual = value.toLowerCase();

  return (
    <div
      role="group"
      aria-label={label}
      {...props}
      className={cn(
        "flex w-full flex-col gap-3",
        "[&_.react-colorful]:h-60! [&_.react-colorful]:w-full! [&_.react-colorful]:gap-3!",
        ESTILO_DA_LIB,
        className,
      )}
    >
      <HexColorPicker color={value} onChange={onChange} />

      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="size-10 shrink-0 rounded-[var(--r-control)] border border-border pointer-coarse:size-11" style={{ background: value }} />
        <label className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-[var(--r-control)] bg-muted px-3 font-mono text-sm has-[:focus-visible]:[box-shadow:var(--focus)] pointer-coarse:h-11">
          <span className="sr-only">{label} em hexadecimal</span>
          <span aria-hidden="true" className="text-muted-foreground">
            #
          </span>
          <HexColorInput color={value} onChange={onChange} className="w-full min-w-0 bg-transparent uppercase tabular-nums outline-none" />
        </label>
        {contaGotas ? (
          <button type="button" onClick={pegarDaTela} aria-label="Pegar uma cor da tela" title="Pegar uma cor da tela" className={cn(CONTROLE, "bg-muted text-foreground")}>
            <Pipette className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {swatches?.length ? (
        <div role="group" aria-label="Cores salvas" className="flex flex-wrap gap-2">
          {swatches.map((cor) => (
            <button
              key={cor}
              type="button"
              aria-label={cor}
              aria-pressed={cor.toLowerCase() === atual}
              onClick={() => onChange(cor)}
              className="relative size-7 rounded-[var(--r-control)] border border-border outline-none after:absolute after:-inset-2 aria-pressed:[box-shadow:0_0_0_2px_var(--background),0_0_0_4px_var(--foreground)] focus-visible:[box-shadow:var(--focus)]"
              style={{ background: cor }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
