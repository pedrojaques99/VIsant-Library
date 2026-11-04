/*
 * O fundo das demos de vidro: dois gradientes sutis e grão, nada mais. Vidro precisa de
 * alguma luz atrás para ter o que dobrar, não de cena. Cor literal é permitida AQUI, na
 * vitrine; as peças em `registry/visant/ui` não têm nenhuma.
 */

const GRAO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23g)'/%3E%3C/svg%3E\")";

export function CenaGranulada() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(70% 62% at 32% 26%, rgb(136 146 164 / .62), transparent 72%), radial-gradient(58% 52% at 78% 84%, rgb(158 122 98 / .4), transparent 74%), rgb(14 15 18)",
      }}
    >
      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: GRAO }} />
    </div>
  );
}
