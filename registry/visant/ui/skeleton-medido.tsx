"use client";

import "skullet/styles.css";

import * as React from "react";
import { Skeleton, type SkeletonProps } from "skullet/react";

/**
 * Skeleton Medido: o esqueleto desenhado a partir do conteúdo real.
 *
 * Experimental: embrulha o Skullet 0.0.x (lochie/skullet, MIT). A API de lá ainda
 * pode mudar, por isso a versão fica presa no item. `skeleton-rail` continua sendo
 * a opção sem dependência, com as medidas escritas à mão.
 *
 * Esta peça só veste o Skullet com os tokens da marca.
 */

const TOKENS = {
  "--skullet-base": "var(--muted)",
  "--skullet-highlight": "color-mix(in oklab, var(--foreground) 8%, transparent)",
  "--skullet-radius": "var(--r-control, 0.375rem)",
  display: "contents",
} as React.CSSProperties;

export function SkeletonMedido<T>(props: SkeletonProps<T>) {
  return (
    <div style={TOKENS}>
      <Skeleton {...props} />
    </div>
  );
}
