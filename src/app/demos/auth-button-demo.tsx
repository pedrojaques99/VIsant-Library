"use client";

/**
 * Só o botão, no canto onde ele mora (o painel abre pra baixo e pra esquerda,
 * por isso ele encosta à direita da caixa). A sessão percorre os estados
 * sozinha, como num app de verdade: começa verificando, chega logada; sair
 * deixa deslogado, e entrar por um provedor passa de novo pelo "verificando"
 * antes de logar. É nessa troca que se vê o que a peça promete: o botão não
 * escreve "Entrar" enquanto espera e não muda de tamanho quando a conta chega.
 *
 * O painel só acompanha o que a pessoa fez. A chegada da sessão ao abrir é relógio,
 * não gesto: avisar marcaria o painel como mexido antes de ela encostar em nada.
 */

import * as React from "react";
import { Chrome, CreditCard, Github, User } from "lucide-react";

import { AuthButton, type AuthStatus } from "../../../registry/visant/ui/auth-button";
import { midia } from "../media";
import type { DemoProps } from "../catalog";
import { useDonoDoKnob } from "./dono-do-knob";

const CONTA = {
  name: "Marina",
  email: "marina@exemplo.com",
  avatarUrl: midia("retrato", 1)?.src,
};

export default function AuthButtonDemo({ props, onKnob }: DemoProps) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const mudarNoPainel = useDonoDoKnob<AuthStatus>("status", "loading", setStatus, { props, onKnob });
  const timer = React.useRef(0);
  const meu = React.useRef<AuthStatus | undefined>(undefined);
  const externo = props?.status as AuthStatus | undefined;

  const mudar = React.useCallback(
    (v: AuthStatus) => {
      meu.current = v;
      mudarNoPainel(v);
    },
    [mudarNoPainel],
  );

  const verificar = React.useCallback(
    (ms: number) => {
      mudar("loading");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => mudar("signed-in"), ms);
    },
    [mudar],
  );

  React.useEffect(() => {
    // Ao abrir e ao restaurar, a sessão chega sozinha.
    if (externo === undefined) {
      meu.current = undefined;
      const id = window.setTimeout(() => setStatus("signed-in"), 1400);
      return () => window.clearTimeout(id);
    }
    // Valor escolhido no painel: a sessão pendente não pode passar por cima dele.
    if (externo !== meu.current) window.clearTimeout(timer.current);
  }, [externo]);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="flex max-w-full justify-center">
        <AuthButton
          hint="signed-in"
          account={CONTA}
          providers={[
            { id: "google", label: "Google", icon: <Chrome className="h-4 w-4" />, onSelect: () => verificar(900) },
            { id: "github", label: "GitHub", icon: <Github className="h-4 w-4" />, onSelect: () => verificar(900) },
          ]}
          items={[
            { id: "perfil", label: "Perfil", icon: <User className="h-4 w-4" />, onSelect: () => {} },
            { id: "plano", label: "Plano e cobrança", icon: <CreditCard className="h-4 w-4" />, onSelect: () => {} },
          ]}
          onSignOut={() => {
            window.clearTimeout(timer.current);
            mudar("signed-out");
          }}
          {...props}
          status={status}
        />
      </div>
    </div>
  );
}
