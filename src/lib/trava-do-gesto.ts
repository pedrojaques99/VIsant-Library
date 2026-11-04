/*
 * Quem começou mexendo na peça não rola a página até soltar o dedo.
 *
 * `touch-action` decide o eixo, mas no iPhone não segura o gesto inteiro: o dedo
 * sai um pouco da linha e a página anda junto com a peça. `preventDefault` no
 * `touchmove` segura, desde que venha no primeiro movimento.
 *
 * Por isso a decisão é uma só, no primeiro movimento, e vale até soltar:
 * - o eixo que o `touch-action` da peça entrega ao navegador continua dele, e é
 *   assim que a rolagem em pé atravessa um slider, um carrossel ou uma foto;
 * - o eixo que ela não entrega é dela, e a página fica parada.
 *
 * O `touch-action` do palco (`pan-y pinch-zoom`) não conta: é da casa, não da peça.
 */
type Dono = "peca" | "navegador" | null;

const rolaNoEixo = (el: Element, eixo: "x" | "y", estilo: CSSStyleDeclaration) => {
  const overflow = eixo === "x" ? estilo.overflowX : estilo.overflowY;
  if (overflow !== "auto" && overflow !== "scroll") return false;
  return eixo === "x" ? el.scrollWidth > el.clientWidth : el.scrollHeight > el.clientHeight;
};

function decidir(alvo: Element, dx: number, dy: number): Dono {
  const eixo = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
  // Dedo subindo rola a página para baixo: é o `pan-down` da especificação.
  const direcao = eixo === "x" ? (dx < 0 ? "pan-right" : "pan-left") : dy < 0 ? "pan-down" : "pan-up";
  let achouPeca = false;

  for (let el: Element | null = alvo; el && el !== document.body; el = el.parentElement) {
    const estilo = getComputedStyle(el);
    if (rolaNoEixo(el, eixo, estilo)) return "navegador";
    if (achouPeca) continue;

    const gesto = estilo.touchAction;
    if (gesto.includes("pinch-zoom")) return "navegador";
    if (gesto === "auto" || gesto === "manipulation") continue;

    const liberado = gesto.includes(`pan-${eixo}`) || gesto.includes(direcao);
    if (!liberado) return "peca";
    if (eixo === "y") return "navegador";
    // Eixo liberado sem nada para rolar de lado: o knob continua com o dedo.
    achouPeca = true;
  }
  return achouPeca ? "peca" : "navegador";
}

export function instalarTravaDoGesto() {
  let alvo: Element | null = null;
  let x = 0;
  let y = 0;
  let dono: Dono = null;

  document.addEventListener(
    "touchstart",
    (e) => {
      dono = null;
      // A pinça é acessibilidade: dois dedos nunca são da peça.
      alvo = e.touches.length === 1 && e.target instanceof Element ? e.target : null;
      x = e.touches[0]?.clientX ?? 0;
      y = e.touches[0]?.clientY ?? 0;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!alvo || e.touches.length !== 1) return;
      if (!dono) {
        const dx = e.touches[0].clientX - x;
        const dy = e.touches[0].clientY - y;
        if (!dx && !dy) return;
        dono = decidir(alvo, dx, dy);
      }
      if (dono === "peca" && e.cancelable) e.preventDefault();
    },
    { passive: false },
  );
}
