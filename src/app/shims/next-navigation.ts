/**
 * `next/navigation` na vitrine, que é Vite e não tem Next.
 *
 * O `data-table` espelha a ordenação em `?sort=`. Aqui a demo vive dentro do
 * catálogo, que tem a URL dele: sem parâmetro na entrada e `replace` mudo, a
 * ordenação fica só no estado da tabela. Referências estáveis porque as três
 * entram nas dependências de um efeito.
 */

const ROTEADOR = { replace: (_url: string, _opts?: { scroll?: boolean }) => {} };
const VAZIO = new URLSearchParams();

export const useRouter = () => ROTEADOR;
export const usePathname = () => "/";
export const useSearchParams = () => VAZIO;
