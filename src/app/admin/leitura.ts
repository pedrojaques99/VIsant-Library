/**
 * O que olhar agora: regras sobre os números do painel, cada uma com a evidência ao lado.
 *
 * Sem previsão e sem LLM. Cada regra exige um mínimo de dados: com base pequena, "caiu 50%" é
 * ruído (de 2 para 1), e um painel que alarma à toa é ignorado no dia em que importa.
 */

export type LinhaDePeca = {
  nome: string;
  titulo: string;
  downloads: number;
  copias: number;
  aberturas: number;
  nota: number | null;
  arquivada: boolean;
  reportes: number;
};

export type Leitura = { titulo: string; evidencia: string; href?: string };

export type Totais = { atual: number; anterior: number };

const MIN_BASE = 20;
const MIN_DOWNLOADS = 5;
const MIN_ABERTURAS = 20;

const variacao = ({ atual, anterior }: Totais) => (anterior >= MIN_BASE ? (atual - anterior) / anterior : null);

export function ler({
  pecas,
  skills,
  visitas,
  downloads,
  dias,
}: {
  pecas: LinhaDePeca[];
  skills: { nome: string; instalacoes: number }[];
  visitas: Totais;
  downloads: Totais;
  dias: number;
}): Leitura[] {
  const saida: Leitura[] = [];
  const href = (p: LinhaDePeca) => `/c/${p.nome}`;

  const arquivadaEmUso = pecas.filter((p) => p.arquivada && p.downloads >= MIN_DOWNLOADS).sort((a, b) => b.downloads - a.downloads)[0];
  if (arquivadaEmUso) {
    saida.push({
      titulo: `${arquivadaEmUso.titulo} está arquivada e segue sendo baixada.`,
      evidencia: `${arquivadaEmUso.downloads} downloads em ${dias} dias, nota ${arquivadaEmUso.nota ?? "sem nota"}`,
      href: href(arquivadaEmUso),
    });
  }

  for (const [nome, t] of [["Visitas", visitas], ["Downloads", downloads]] as const) {
    const v = variacao(t);
    if (v !== null && Math.abs(v) >= 0.3) {
      saida.push({
        titulo: `${nome} ${v > 0 ? "subiram" : "caíram"} ${Math.round(Math.abs(v) * 100)}%.`,
        evidencia: `${t.atual} contra ${t.anterior} nos ${dias} dias anteriores`,
      });
    }
  }

  const abreSemInstalar = pecas
    .filter((p) => p.aberturas >= MIN_ABERTURAS && p.copias + p.downloads === 0)
    .sort((a, b) => b.aberturas - a.aberturas)[0];
  if (abreSemInstalar) {
    saida.push({
      titulo: `Abrem ${abreSemInstalar.titulo} e ninguém instala.`,
      evidencia: `${abreSemInstalar.aberturas} aberturas, nenhuma cópia, nenhum download`,
      href: href(abreSemInstalar),
    });
  }

  const maisBaixadaSemNota = pecas.filter((p) => p.nota === null && p.downloads >= MIN_DOWNLOADS).sort((a, b) => b.downloads - a.downloads)[0];
  if (maisBaixadaSemNota) {
    saida.push({
      titulo: `${maisBaixadaSemNota.titulo} é muito baixada e você ainda não avaliou.`,
      evidencia: `${maisBaixadaSemNota.downloads} downloads em ${dias} dias`,
      href: href(maisBaixadaSemNota),
    });
  }

  const comReportes = pecas.filter((p) => p.reportes >= 2).sort((a, b) => b.reportes - a.reportes)[0];
  if (comReportes) {
    saida.push({
      titulo: `${comReportes.titulo} acumula reportes abertos.`,
      evidencia: `${comReportes.reportes} abertos`,
      href: href(comReportes),
    });
  }

  if (skills.length >= 2) {
    const topo = skills[0];
    const ultima = skills[skills.length - 1];
    if (topo.instalacoes >= MIN_BASE && ultima.instalacoes < topo.instalacoes / 4) {
      saida.push({
        titulo: `${ultima.nome} tem poucas instalações.`,
        evidencia: `${ultima.instalacoes} instalações, contra ${topo.instalacoes} de ${topo.nome}`,
      });
    }
  }

  return saida.slice(0, 5);
}
