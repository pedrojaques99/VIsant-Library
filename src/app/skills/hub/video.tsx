"use client";

import * as React from "react";
import { redeLenta } from "@/lib/rede";
import { useMenosMovimento } from "./nucleo";

/**
 * Vídeo da dobra. O pôster é uma imagem de verdade, sempre embaixo: o vídeo só
 * aparece depois de pintar um quadro, então carregando, falhando ou sem rede quem
 * se vê é o pôster, nunca o preto do elemento. Webm que não decodifica cai no mp4,
 * e mp4 que falha fica no pôster. Só pede o arquivo perto da tela, só toca visível.
 */
export function Video({
  nome,
  alt,
  className,
  proporcao = "1 / 1",
  liberado = true,
}: {
  nome: string;
  alt: string;
  className?: string;
  proporcao?: string;
  /** Na primeira dobra, o arquivo só desce depois que as imagens visíveis chegaram. */
  liberado?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const video = React.useRef<HTMLVideoElement>(null);
  const [perto, setPerto] = React.useState(false);
  const [fonte, setFonte] = React.useState(0);
  const [pintou, setPintou] = React.useState(false);
  /* Sem movimento ou sem rede: o vídeo não desce sozinho, fica o pôster e o play é de quem quiser. */
  const parado = useMenosMovimento() || redeLenta();
  const src = perto && liberado && fonte < 2 ? `/media/skills/${nome}.${fonte === 0 ? "mp4" : "webm"}` : undefined;
  const imagem = `/media/skills/${nome}.webp`;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPerto(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !src || parado) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void video.current?.play().catch(() => {});
        else video.current?.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src, parado]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={alt}
      data-video={nome}
      data-pintou={pintou}
      data-fonte={fonte}
      style={{ aspectRatio: proporcao }}
      className={`relative w-full overflow-hidden rounded-tile bg-casa-tile-2 ${className ?? ""}`}
    >
      <img
        src={imagem}
        alt=""
        style={{ aspectRatio: proporcao }}
        className="block w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.visibility = "hidden";
        }}
      />
      {src ? (
        <video
          ref={video}
          src={src}
          aria-hidden="true"
          poster={imagem}
          playsInline
          muted
          loop
          preload={parado ? "none" : "metadata"}
          controls={parado}
          onTimeUpdate={(e) => {
            if (!pintou && e.currentTarget.currentTime > 0) setPintou(true);
          }}
          onError={() => {
            setPintou(false);
            setFonte((f) => f + 1);
          }}
          className={`absolute inset-0 size-full object-cover transition-opacity [transition-duration:var(--dur-slow)] [transition-timing-function:var(--ease-out)] ${pintou || parado ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
    </div>
  );
}
