import type { Config, Limites, Medidas, Perfil, Situacao } from '../types';

/**
 * Versão da regra. Incremente sempre que mudar o cálculo: ela é gravada em cada usinagem.
 * O sufixo "-placeholder" some quando a fórmula real for validada.
 */
export const REGRA_VERSAO = '0.1.0-placeholder';

/** PLACEHOLDER: peso do desvio do eixo na remoção (mm por grau). Definir com a engenharia. */
const MM_POR_GRAU_DE_EIXO = 0.5;

/** Perfis iniciais (seed da tela Config). Alvos PROVISÓRIOS, escolhidos só para reproduzir o protótipo. */
export const PERFIS_INICIAIS: Perfil[] = [
  { id: 'aar-1b', nome: 'AAR-1B', ativo: true, alvoFrisoEspessura: 26.0, alvoFrisoAltura: 30.0 },
  { id: 'aar-1b-nf', nome: 'AAR-1B NF', ativo: true, alvoFrisoEspessura: 26.8, alvoFrisoAltura: 30.0 },
  { id: 'aar-1b-mod', nome: 'AAR-1B modificado', ativo: true, alvoFrisoEspessura: 26.4, alvoFrisoAltura: 30.0 },
];

export const CONFIG_INICIAL: Config = { perfis: PERFIS_INICIAIS, limites: {} };

const arred1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Material removido (mm) para levar a roda ao perfil.
 *
 * PLACEHOLDER: modelo fictício (excesso de friso + desvio do eixo). Substituir pela fórmula real,
 * mantendo a assinatura: função pura, sem rede nem banco, para rodar offline e ser testável.
 */
export function calcularRemocaoMm(m: Medidas, perfil: Perfil): number {
  const excessoFriso =
    Math.max(0, m.frisoEspessura - perfil.alvoFrisoEspessura) + Math.max(0, m.frisoAltura - perfil.alvoFrisoAltura);
  return arred1(excessoFriso + Math.abs(m.anguloEixo) * MM_POR_GRAU_DE_EIXO);
}

export interface ItemRanking {
  perfil: Perfil;
  remocaoMm: number;
}

/** Perfis ativos ordenados do que remove menos material para o que remove mais. Vazio se nenhum ativo. */
export function ranquear(m: Medidas, perfis: Perfil[]): ItemRanking[] {
  return perfis
    .filter((p) => p.ativo)
    .map((perfil) => ({ perfil, remocaoMm: calcularRemocaoMm(m, perfil) }))
    .sort((a, b) => a.remocaoMm - b.remocaoMm); // sort é estável: empate mantém a ordem da lista
}

/** Medidas da roda depois de usinada com o perfil. Premissas a validar: ver README. */
export function medidasAposUsinagem(m: Medidas, perfil: Perfil, remocaoMm: number): Medidas {
  return {
    ...m,
    diametro: arred1(m.diametro - remocaoMm),
    frisoEspessura: Math.min(m.frisoEspessura, perfil.alvoFrisoEspessura),
    frisoAltura: Math.min(m.frisoAltura, perfil.alvoFrisoAltura),
  };
}

/** Quantas usinagens iguais ainda cabem até o diâmetro mínimo. null se o limite não foi configurado. */
export function usinagensAteDescarte(diametro: number, remocaoMm: number, limites: Limites): number | null {
  if (limites.diametroMinimo === undefined || remocaoMm <= 0) return null;
  return Math.max(0, Math.floor((diametro - limites.diametroMinimo) / remocaoMm));
}

/** Situação da roda segundo os limites configurados. Sem limites configurados, fica "Em uso". */
export function situacaoRoda(m: Medidas, limites: Limites): Situacao {
  const { diametroMinimo, frisoEspessuraMinima, alertaFaltandoMm } = limites;

  if (diametroMinimo !== undefined && m.diametro <= diametroMinimo) return 'DESCARTE';
  if (frisoEspessuraMinima !== undefined && m.frisoEspessura <= frisoEspessuraMinima) return 'DESCARTE';
  if (diametroMinimo !== undefined && alertaFaltandoMm !== undefined && m.diametro - diametroMinimo <= alertaFaltandoMm) {
    return 'ATENCAO';
  }
  return 'EM_USO';
}
