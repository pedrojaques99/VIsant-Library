"use client";

/**
 * O medidor numa cena de cota: espaço do plano, com as três faixas nomeadas.
 *
 * Valor e régua são literais de propósito: é o que o painel lê pra nascer igual
 * ao palco. Os botões de mais e menos que moravam aqui eram um segundo dono do
 * valor, e o painel seguia em 0 com a peça em 84%. Quem mexe agora é o knob
 * `value`, e a regra da peça continua à vista: a faixa troca quando a contagem
 * cruza o limite. O qualificador é só o teto, verdadeiro em qualquer valor.
 */

import { Gauge } from "../../../registry/visant/ui/gauge";
import type { DemoProps } from "../catalog";

const FAIXAS = [
  { from: 0, label: "Tranquilo" },
  { from: 70, label: "Quase cheio" },
  { from: 90, label: "Lotado", alert: true },
];

export default function GaugeDemo({ props }: DemoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Gauge
        className="w-52"
        size={208}
        label="Espaço do plano"
        value={84}
        detail="de 500 GB"
        bands={FAIXAS}
        {...props}
      />
    </div>
  );
}
