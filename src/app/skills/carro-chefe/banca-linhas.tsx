"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DUR, EASE_OUT } from "@/lib/motion";

/** As linhas do terminal, com o deslize de quando um conserto as reordena. */
export function LinhasComMovimento({
  chaves,
  opacidades,
  linha,
}: {
  chaves: string[];
  opacidades: number[];
  linha: (i: number) => React.ReactNode;
}) {
  const reduzir = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {chaves.map((chave, i) => (
        <motion.div
          key={chave}
          layout={reduzir ? false : "position"}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          exit={{ opacity: 0, transition: { duration: DUR.fast } }}
          style={{ opacity: opacidades[i] }}
        >
          {linha(i)}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
