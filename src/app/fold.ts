/** Busca sem acento dos dois lados — em pt-BR ninguém digita cedilha correndo. */
export const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
