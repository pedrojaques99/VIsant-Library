"use client";

/**
 * A marca do cabeçalho: um botão só, para as marcas de demonstração e para o vault
 * de quem entrou. As duas listas ficam em grupos com nome, então sair da conta tira
 * um grupo inteiro em vez de encolher uma lista sem explicação.
 *
 * Mora na casa e não na peça `BrandSelector`: o que o `shadcn add` entrega não sabe
 * de conta Visant, e não deve saber.
 *
 * A marca do vault compila aqui, no browser, com o mesmo motor que publica os temas
 * (`@visant/brand-tokens`), e a guideline não passa por servidor nosso. São ~90KB que
 * só carregam quando alguém logado toca numa marca da própria conta.
 */

import * as React from "react";
import { Command } from "cmdk";
import { Check, LogOut, Palette, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyBrandTheme,
  applyBrandThemeAnimated,
  loadBrandFonts,
  useBrandTheme,
  type BrandThemeItem,
} from "@/lib/brand-theme";
import { PREFIXO_DA_CONTA as PREFIXO, useMarcaPintada } from "@/lib/marca-pintada";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { useVisantAuth, type MarcaDoUsuario } from "./visant-auth";

/* Só o id: a guideline continua vindo da API, com a sessão, a cada visita. */
const CHAVE_DA_ESCOLHA = "visant:marca-da-conta";

/** `?brand=` na URL é escolha explícita de quem abriu o link: vale mais que a guardada. */
const escolhaGuardada = () =>
  new URLSearchParams(window.location.search).has("brand") ? null : localStorage.getItem(CHAVE_DA_ESCOLHA);

interface NaConta {
  marca: MarcaDoUsuario;
  item: BrandThemeItem;
  valor: string;
}

/** Prefixo próprio: "Visant" no vault e "visant" na demonstração são marcas diferentes. */
const valorDe = (m: MarcaDoUsuario) => `${PREFIXO}${m.id}`;

function Selo({
  nome,
  fundo,
  tinta,
  logo,
  placa,
}: {
  nome: string;
  fundo?: string;
  tinta?: string;
  logo?: string;
  placa?: string;
}) {
  const [quebrou, setQuebrou] = React.useState(false);
  const comLogo = Boolean(logo) && !quebrou;
  return (
    <span
      className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-[6px]"
      style={{ background: comLogo ? placa : fundo }}
    >
      {comLogo ? (
        <img
          src={logo}
          alt=""
          onError={() => setQuebrou(true)}
          className="h-full w-full object-contain p-0.5"
        />
      ) : (
        <span className="text-casa-sm leading-none" style={{ color: tinta }}>
          {nome.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function Linha({
  valor,
  nome,
  apoio,
  cores,
  palavras,
  noAr,
  onEscolher,
}: {
  valor: string;
  nome: string;
  apoio: string;
  cores: string[];
  palavras: string[];
  noAr: boolean;
  onEscolher: () => void;
}) {
  return (
    <Command.Item
      value={valor}
      keywords={palavras}
      onSelect={onEscolher}
      className="flex cursor-pointer items-center gap-3 rounded-control px-2.5 py-2 transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] data-[selected=true]:bg-casa-tile-2"
    >
      <span className="flex shrink-0 -space-x-1" aria-hidden>
        {cores.slice(0, 3).map((hex, i) => (
          <span
            key={i}
            className="h-4 w-4 rounded-[5px] ring-2 ring-[var(--casa-tile)]"
            style={{ background: hex }}
          />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-casa-base">{nome}</span>
        <span className="block truncate text-casa-sm text-casa-fg-3">{apoio}</span>
      </span>
      {noAr ? <Check className="h-4 w-4 shrink-0 text-casa-fg" aria-label="no ar" /> : null}
    </Command.Item>
  );
}

const GRUPO =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-casa-sm [&_[cmdk-group-heading]]:text-casa-fg-3";

export function MarcaDaCasa() {
  const { brands, brand, status, error, setBrand, previewBrand } = useBrandTheme();
  const { estado, erro, marcas, carregandoMarcas, sair, buscarMarcas } = useVisantAuth();
  const pintada = useMarcaPintada();

  const [aberto, setAberto] = React.useState(false);
  const [destaque, setDestaque] = React.useState<string | null>(null);
  const [naConta, setNaConta] = React.useState<NaConta | null>(null);
  const [falha, setFalha] = React.useState<string | null>(null);

  const compiladas = React.useRef(new Map<string, BrandThemeItem>());
  const espiando = React.useRef<string | null>(null);
  const recuperou = React.useRef(false);

  const compilar = React.useCallback(async (marca: MarcaDoUsuario) => {
    const pronta = compiladas.current.get(marca.id);
    if (pronta) return pronta;
    const { buildBrandThemeItem } = await import("@visant/brand-tokens/registry-item");
    const item = buildBrandThemeItem({
      id: marca.id,
      name: marca.name,
      colors: marca.colors,
      typography: marca.typography,
    }) as BrandThemeItem;
    compiladas.current.set(marca.id, item);
    return item;
  }, []);

  const fontesDe = (marca: MarcaDoUsuario) =>
    [marca.typography[0]?.family, marca.typography[1]?.family].filter(Boolean) as string[];

  /* Volta ao que está escolhido, seja da demonstração, seja da conta. */
  const restaurar = React.useCallback(() => {
    espiando.current = null;
    if (!naConta) {
      previewBrand(null);
      return;
    }
    // O valor da conta não está no índice público: não pinta e descarta prévia ainda em voo.
    previewBrand(naConta.valor);
    if (document.documentElement.dataset.brand !== naConta.valor) {
      applyBrandThemeAnimated(naConta.item, naConta.valor);
    }
  }, [naConta, previewBrand]);

  const espiar = (valor: string) => {
    // A lista segue montada na animação de saída. Ao sair da conta o grupo some, e o cmdk
    // seleciona a primeira linha sozinho: isso não é prévia de ninguém.
    if (!aberto) return;
    setDestaque(valor);
    if (!valor) {
      restaurar();
      return;
    }
    espiando.current = valor;
    previewBrand(valor);
    if (!valor.startsWith(PREFIXO)) return;
    const marca = marcas?.find((m) => valorDe(m) === valor);
    if (!marca) return;
    compilar(marca)
      .then((item) => {
        if (espiando.current !== valor) return;
        loadBrandFonts(fontesDe(marca));
        applyBrandTheme(item, valor);
      })
      // Guideline incompleta só avisa ao escolher: percorrer a lista não é erro.
      .catch(() => {});
  };

  const escolherDaConta = async (marca: MarcaDoUsuario) => {
    setFalha(null);
    try {
      const item = await compilar(marca);
      loadBrandFonts(fontesDe(marca));
      localStorage.setItem(CHAVE_DA_ESCOLHA, marca.id);
      setNaConta({ marca, item, valor: valorDe(marca) });
      setAberto(false);
    } catch (e) {
      setFalha(e instanceof Error ? e.message : String(e));
    }
  };

  const escolherPublica = (slug: string) => {
    localStorage.removeItem(CHAVE_DA_ESCOLHA);
    setNaConta(null);
    setAberto(false);
    void setBrand(slug);
  };

  React.useEffect(() => {
    if (aberto) return;
    setDestaque(null);
    setFalha(null);
    restaurar();
  }, [aberto, restaurar]);

  /* Outra parte da página pode trocar a marca (o seletor do kit): o botão acompanha o que está pintado. */
  React.useEffect(() => {
    if (!naConta || aberto) return;
    const raiz = document.documentElement;
    const olho = new MutationObserver(() => {
      if (raiz.dataset.brand === naConta.valor) return;
      localStorage.removeItem(CHAVE_DA_ESCOLHA);
      setNaConta(null);
    });
    olho.observe(raiz, { attributes: true, attributeFilter: ["data-brand"] });
    return () => olho.disconnect();
  }, [naConta, aberto]);

  /* A lista só desce para quem abriu o painel ou tem marca da conta para recuperar. Falhou, quem tenta de novo é o botão. */
  React.useEffect(() => {
    if (estado !== "dentro" || marcas || carregandoMarcas || erro) return;
    if (aberto || escolhaGuardada()) void buscarMarcas();
  }, [aberto, estado, marcas, carregandoMarcas, erro, buscarMarcas]);

  /*
   * Depois do F5, a marca da conta volta só quando a de demonstração já pintou. O provider não
   * cancela essa pintura: se ela chegasse depois, tiraria a marca da conta da tela e da memória.
   */
  React.useEffect(() => {
    if (recuperou.current || aberto || estado !== "dentro" || !marcas || status !== "ready") return;
    if (brand && pintada !== brand.slug) return;
    recuperou.current = true;
    const id = escolhaGuardada();
    if (!id) return;
    const marca = marcas.find((m) => m.id === id);
    if (!marca) {
      localStorage.removeItem(CHAVE_DA_ESCOLHA);
      return;
    }
    compilar(marca)
      .then((item) => {
        // Quem trocou de marca enquanto compilava já decidiu.
        if (localStorage.getItem(CHAVE_DA_ESCOLHA) !== id) return;
        loadBrandFonts(fontesDe(marca));
        setNaConta({ marca, item, valor: valorDe(marca) });
      })
      .catch(() => localStorage.removeItem(CHAVE_DA_ESCOLHA));
  }, [aberto, estado, marcas, status, brand, pintada, compilar]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAberto((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const nome =
    naConta?.marca.name ?? brand?.name ?? (status === "error" ? "Marcas fora do ar" : "Escolher marca");
  const valorAtual = naConta?.valor ?? brand?.slug ?? "";

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        data-marca-da-casa=""
        disabled={status === "loading"}
        className="flex h-8 min-w-0 max-w-48 shrink-0 items-center gap-2 rounded-control pl-1 pr-2.5 text-casa-base text-casa-fg transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-casa-tile disabled:opacity-60 aria-expanded:bg-casa-tile max-[479px]:pr-1 pointer-coarse:h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center"
      >
        {naConta ? (
          <Selo
            key={naConta.valor}
            nome={naConta.marca.name}
            fundo={naConta.item.cssVars.light?.brand ?? naConta.marca.colors[0]?.hex}
            tinta={naConta.item.cssVars.light?.["brand-foreground"]}
          />
        ) : brand ? (
          <Selo
            key={brand.slug}
            nome={brand.name}
            fundo={brand.preview.light.brand ?? brand.palette[0]?.hex}
            tinta={brand.preview.light["brand-foreground"]}
            logo={brand.logo?.thumbnailUrl ?? brand.logo?.url}
            placa={brand.palette.find((c) => c.role === "background")?.hex}
          />
        ) : (
          <Palette className="h-4 w-4 shrink-0 text-casa-fg-2" aria-hidden />
        )}
        {/* No celular o nome não cabe: fica o selo, e o nome segue para leitor de tela. */}
        <span className="truncate max-[479px]:sr-only">{nome}</span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        aria-label="Marcas"
        // No toque, abrir a lista não pode subir o teclado por cima dela.
        onOpenAutoFocus={(e) => {
          if (window.matchMedia("(pointer: coarse)").matches) e.preventDefault();
        }}
        className="casa w-[min(92vw,340px)] overflow-hidden rounded-tile border-0 bg-casa-tile p-1.5 text-casa-fg [box-shadow:var(--casa-shadow)]"
      >
        <Command label="Selecionar marca" value={destaque ?? valorAtual} onValueChange={espiar}>
          <div className="flex items-center gap-1 pl-2.5 pr-1">
            <Search className="h-4 w-4 shrink-0 text-casa-fg-3" aria-hidden />
            <Command.Input
              placeholder="Buscar marca…"
              className="h-9 min-w-0 flex-1 bg-transparent pl-1.5 text-casa-base outline-none placeholder:text-casa-fg-3 pointer-coarse:h-11 pointer-coarse:text-base"
            />
            {estado === "dentro" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    compiladas.current.clear();
                    void buscarMarcas();
                  }}
                  aria-label="Recarregar marcas da conta"
                  title="Recarregar marcas da conta"
                  className="casa-icone alvo-toque shrink-0"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", carregandoMarcas && "animate-spin")} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(CHAVE_DA_ESCOLHA);
                    setNaConta(null);
                    setAberto(false);
                    sair();
                  }}
                  aria-label="Sair da conta"
                  title="Sair da conta"
                  className="casa-icone alvo-toque shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}
          </div>

          <Command.List className="max-h-[min(60vh,420px)] overflow-auto overscroll-contain">
            <Command.Empty className="px-2.5 py-6 text-center text-casa-base text-casa-fg-2">
              {error ? "Não deu pra carregar as marcas." : "Nenhuma marca com esse nome."}
            </Command.Empty>

            <Command.Group heading="Demonstração" className={GRUPO}>
              {brands.map((b) => (
                <Linha
                  key={b.slug}
                  valor={b.slug}
                  nome={b.name}
                  apoio={b.fonts.display}
                  cores={b.palette.map((c) => c.hex)}
                  palavras={[b.name, b.fonts.display, b.fonts.sans, ...b.palette.map((c) => c.name ?? "")]}
                  noAr={!naConta && brand?.slug === b.slug}
                  onEscolher={() => escolherPublica(b.slug)}
                />
              ))}
            </Command.Group>

            {estado === "dentro" ? (
              <Command.Group heading="Sua conta" className={GRUPO}>
                {erro ? (
                  <p className="px-2.5 py-2 text-casa-base text-casa-fg-2">
                    Não deu pra ler o vault: <code>{erro}</code>
                  </p>
                ) : null}
                {carregandoMarcas && !marcas
                  ? [0, 1, 2].map((i) => (
                      <div key={i} className="m-1.5 h-10 animate-pulse rounded-control bg-casa-tile-2" />
                    ))
                  : null}
                {marcas?.length === 0 ? (
                  <p className="px-2.5 py-2 text-casa-base text-casa-fg-2">Nenhuma marca nesta conta ainda.</p>
                ) : null}
                {marcas?.map((m) => (
                  <Linha
                    key={m.id}
                    valor={valorDe(m)}
                    nome={m.name}
                    apoio={m.typography[0]?.family ?? "sem tipografia"}
                    cores={m.colors.map((c) => c.hex)}
                    palavras={[
                      m.name,
                      ...m.typography.map((t) => t.family),
                      ...m.colors.map((c) => c.name ?? ""),
                    ]}
                    noAr={naConta?.marca.id === m.id}
                    onEscolher={() => void escolherDaConta(m)}
                  />
                ))}
              </Command.Group>
            ) : null}
          </Command.List>

          {/* A falha diz o que falta; o sucesso não precisa de legenda. */}
          {falha ? (
            <p className="px-2.5 pb-1.5 pt-2 text-casa-sm text-casa-fg-2">
              Essa marca ainda não compila: falta <code>{falha}</code> na guideline.
            </p>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
