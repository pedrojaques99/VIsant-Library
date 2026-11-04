/**
 * `Route.familia` de quem abriu a peça pelo link (`/c/kanban`): vale a família da própria peça.
 *
 * `/c/<item>` não carrega família no caminho, e sem isto a peça abriria por cima do ÍNDICE: as
 * setas não teriam lista para percorrer e fechar devolveria a pessoa a uma página de capas.
 */
export const FAMILIA_DA_PECA = "*";
