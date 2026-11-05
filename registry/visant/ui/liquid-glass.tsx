"use client";
import * as React from "react";

/*
 * Miolo: rizroze/liquid-glass (https://github.com/rizroze/liquid-glass).
 * Alterações: tipos, porque o `shadcn add` entrega isto para compilar no projeto de
 * quem instala, e as cores do mapa de deslocamento em rgb(), porque são dado do
 * filtro, não tema, e o portão de hex do registry não distingue.
 *
 * MIT License
 *
 * Copyright (c) 2026 Riz Roze
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export interface LiquidGlassOptions {
  width?: number;
  height?: number;
  borderRadius?: number;
  scale?: number;
  aberration?: number[];
  blur?: number;
  border?: number;
  lightness?: number;
  alpha?: number;
  frost?: number;
  saturation?: number;
  displaceBlur?: number;
  filterId?: string;
  fallbackFilter?: string;
}
type Config = ReturnType<typeof resolveConfig>;
type FilterRefs = ReturnType<typeof createFilterSVG>;

function resolveConfig(el: HTMLElement, opts: LiquidGlassOptions) {
  const rect = el.getBoundingClientRect();
  const ab = opts.aberration ?? [0, 10, 20];
  return {
    width: opts.width ?? Math.round(rect.width),
    height: opts.height ?? Math.round(rect.height),
    radius: opts.borderRadius ?? 50,
    scale: opts.scale ?? -180,
    border: opts.border ?? 0.07,
    lightness: opts.lightness ?? 50,
    alpha: opts.alpha ?? 0.93,
    blur: opts.blur ?? 11,
    r: ab[0],
    g: ab[1],
    b: ab[2],
    frost: opts.frost ?? 0,
    saturation: opts.saturation ?? 1,
    displace: opts.displaceBlur ?? 0
  };
}
const isChromium = typeof navigator !== "undefined" && /Chrome\//.test(navigator.userAgent);
const _mapCache = /* @__PURE__ */ new Map<string, string>();
function buildDisplacementMap(c: Config) {
  const key = `${c.width}:${c.height}:${c.radius}:${c.scale}:${c.border}:${c.blur}:${c.lightness}:${c.alpha}`;
  const cached = _mapCache.get(key);
  if (cached) return cached;
  const maxDisplace = Math.max(Math.abs(c.scale) * 0.5, 20);
  const padX = Math.ceil(maxDisplace);
  const padY = Math.ceil(maxDisplace);
  const totalW = c.width + padX * 2;
  const totalH = c.height + padY * 2;
  const canvas = document.createElement("canvas");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(128, 128, 128)";
  ctx.fillRect(0, 0, totalW, totalH);
  const ox = padX;
  const oy = padY;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(ox, oy, c.width, c.height, c.radius);
  ctx.clip();
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(ox, oy, c.width, c.height);
  const redGrad = ctx.createLinearGradient(ox + c.width, oy, ox, oy);
  redGrad.addColorStop(0, "rgb(0, 0, 0)");
  redGrad.addColorStop(1, "rgb(255, 0, 0)");
  ctx.fillStyle = redGrad;
  ctx.fillRect(ox, oy, c.width, c.height);
  ctx.globalCompositeOperation = "difference";
  const blueGrad = ctx.createLinearGradient(ox, oy, ox, oy + c.height);
  blueGrad.addColorStop(0, "rgb(0, 0, 0)");
  blueGrad.addColorStop(1, "rgb(0, 0, 255)");
  ctx.fillStyle = blueGrad;
  ctx.fillRect(ox, oy, c.width, c.height);
  ctx.globalCompositeOperation = "source-over";
  const borderPx = Math.min(c.width, c.height) * (c.border * 0.5);
  ctx.filter = `blur(${c.blur}px)`;
  ctx.fillStyle = `hsla(0, 0%, ${c.lightness}%, ${c.alpha})`;
  ctx.beginPath();
  ctx.roundRect(
    ox + borderPx,
    oy + borderPx,
    c.width - borderPx * 2,
    c.height - borderPx * 2,
    c.radius
  );
  ctx.fill();
  ctx.restore();
  const uri = canvas.toDataURL();
  _mapCache.set(key, uri);
  return uri;
}
let _instanceCount = 0;
function createFilterSVG(id: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.style.cssText = "position:absolute;width:0;height:0;pointer-events:none;";
  svg.innerHTML = `
    <defs>
      <filter id="${id}" color-interpolation-filters="sRGB" x="-38%" y="-188%" width="176%" height="476%">
        <feImage result="map" preserveAspectRatio="none" />
        <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" result="dispRed" data-channel="red" />
        <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
        <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" result="dispGreen" data-channel="green" />
        <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
        <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" result="dispBlue" data-channel="blue" />
        <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
        <feBlend in="red" in2="green" mode="screen" result="rg" />
        <feBlend in="rg" in2="blue" mode="screen" result="output" />
        <feGaussianBlur in="output" stdDeviation="0" />
      </filter>
    </defs>
  `;
  const filter = svg.querySelector("filter")!;
  const feImage = svg.querySelector("feImage")!;
  const red = svg.querySelector('[data-channel="red"]')!;
  const green = svg.querySelector('[data-channel="green"]')!;
  const blue = svg.querySelector('[data-channel="blue"]')!;
  const blurEl = svg.querySelector("feGaussianBlur")!;
  return { svg, feImage, red, green, blue, blur: blurEl, filter };
}
function applyConfig(c: Config, refs: FilterRefs) {
  /* Peça ainda sem tamanho (oculta ou antes do layout): medir aqui daria x="-Infinity%" no filtro. */
  if (c.width <= 0 || c.height <= 0) return;
  const uri = buildDisplacementMap(c);
  const maxD = Math.max(Math.abs(c.scale) * 0.5, 20);
  const pctX = Math.ceil(maxD / c.width * 100);
  const pctY = Math.ceil(maxD / c.height * 100);
  refs.filter.setAttribute("x", `-${pctX}%`);
  refs.filter.setAttribute("y", `-${pctY}%`);
  refs.filter.setAttribute("width", `${100 + pctX * 2}%`);
  refs.filter.setAttribute("height", `${100 + pctY * 2}%`);
  refs.feImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", uri);
  refs.feImage.setAttribute("href", uri);
  refs.red.setAttribute("scale", String(c.scale + c.r));
  refs.green.setAttribute("scale", String(c.scale + c.g));
  refs.blue.setAttribute("scale", String(c.scale + c.b));
  refs.blur.setAttribute("stdDeviation", String(c.displace));
}
function createLiquidGlass(element: HTMLElement, options: LiquidGlassOptions = {}) {
  const fallback = options.fallbackFilter ?? "blur(12px)";
  if (!isChromium) {
    const prev = element.style.backdropFilter;
    const prevWebkit = element.style.getPropertyValue("-webkit-backdrop-filter");
    element.style.backdropFilter = fallback;
    element.style.setProperty("-webkit-backdrop-filter", fallback);
    const dummySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    return {
      isActive: false,
      filterElement: dummySvg,
      update(_: LiquidGlassOptions) {
      },
      destroy() {
        element.style.backdropFilter = prev;
        element.style.setProperty("-webkit-backdrop-filter", prevWebkit);
      }
    };
  }
  const id = options.filterId ?? `liquid-glass-${++_instanceCount}`;
  const refs = createFilterSVG(id);
  document.body.appendChild(refs.svg);
  let currentOpts = { ...options };
  let config = resolveConfig(element, currentOpts);
  applyConfig(config, refs);
  const applyStyles = (c: Config) => {
    element.style.backdropFilter = `url(#${id}) saturate(${c.saturation})`;
    element.style.setProperty(
      "-webkit-backdrop-filter",
      `url(#${id}) saturate(${c.saturation})`
    );
    if (c.frost > 0) {
      element.style.background = `hsl(0 0% 0% / ${c.frost})`;
    }
  };
  applyStyles(config);
  let resizeRaf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      if (currentOpts.width == null || currentOpts.height == null) {
        config = resolveConfig(element, currentOpts);
        applyConfig(config, refs);
        applyStyles(config);
      }
    });
  });
  ro.observe(element);
  return {
    isActive: true,
    filterElement: refs.svg,
    update(newOpts: LiquidGlassOptions) {
      currentOpts = { ...currentOpts, ...newOpts };
      config = resolveConfig(element, currentOpts);
      applyConfig(config, refs);
      applyStyles(config);
    },
    destroy() {
      ro.disconnect();
      cancelAnimationFrame(resizeRaf);
      refs.svg.remove();
      element.style.backdropFilter = "";
      element.style.setProperty("-webkit-backdrop-filter", "");
      element.style.background = "";
    }
  };
}

/** Opções fixas, ou em função da altura: refração em px some numa peça grande. */
export type GlassOptions = LiquidGlassOptions | ((height: number) => LiquidGlassOptions);

/**
 * A superfície que refrata o que está atrás dela. Chromium refrata de verdade;
 * Safari e Firefox caem em blur sozinhos.
 *
 * Vidro sobre vidro tem de ser IRMÃO, nunca filho: backdrop-filter faz do elemento
 * uma "backdrop root", e um filho com backdrop-filter só enxerga o que está dentro
 * do pai. Por isso as peças de vidro põem esta camada ao lado do conteúdo.
 *
 * O tamanho vem de offsetWidth/Height, não do retângulo na tela: dentro de um palco
 * escalado por transform, o retângulo mente e o mapa sai no tamanho errado.
 */
export function LiquidGlass({
  options = {},
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { options?: GlassOptions }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const opts = React.useRef(options);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const h = el.offsetHeight;
      const o = opts.current;
      return { ...(typeof o === "function" ? o(h) : o), width: el.offsetWidth, height: h };
    };
    const glass = createLiquidGlass(el, read());
    const ro = new ResizeObserver(() => glass.update(read()));
    ro.observe(el);
    return () => {
      ro.disconnect();
      glass.destroy();
    };
  }, []);
  return <div ref={ref} {...props} />;
}
