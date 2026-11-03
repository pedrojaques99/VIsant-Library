/**
 * `next-auth/react` na vitrine, que é Vite e não tem Next nem sessão.
 *
 * O `data-table` lê a sessão pra só deixar administrador editar célula. Aqui a
 * sessão é sempre de administrador, senão a edição que a ficha promete não
 * apareceria. Só a vitrine resolve este arquivo (`vite.config.ts` e `tsconfig.json`);
 * o `shadcn add` continua entregando o import original.
 */

const SESSAO = { data: { user: { role: "admin" } } };

export const useSession = () => SESSAO;
