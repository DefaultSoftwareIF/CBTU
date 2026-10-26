export type SyncStatus = 'pendente' | 'sincronizado';
export type Situacao = 'EM_USO' | 'ATENCAO' | 'DESCARTE';

/** Medidas da roda, todas em mm, exceto anguloEixo (graus). */
export interface Medidas {
  diametro: number;
  aro: number; // largura do aro
  frisoEspessura: number;
  frisoAltura: number;
  anguloEixo: number;
}

/** Perfil de usinagem. TODO: os alvos abaixo são provisórios; definir com a oficina/engenharia. */
export interface Perfil {
  id: string;
  nome: string;
  ativo: boolean;
  alvoFrisoEspessura: number;
  alvoFrisoAltura: number;
}

/** Limites de descarte (tela Config). Indefinido = ainda não configurado. */
export interface Limites {
  diametroMinimo?: number;
  frisoEspessuraMinima?: number;
  /** Alertar (situação "Atenção") quando faltarem até N mm para o diâmetro mínimo. */
  alertaFaltandoMm?: number;
}

export interface Config {
  perfis: Perfil[];
  limites: Limites;
}

interface Controle {
  usuarioId: string;
  criadoEm: string; // ISO-8601 UTC
  atualizadoEm: string; // ISO-8601 UTC
  syncStatus: SyncStatus;
  syncedAt?: string;
}

/** Roda cadastrada. `id` é o código da roda (ex.: "RD-0417"). */
export interface Roda extends Controle {
  id: string;
  medidasIniciais: Medidas;
}

/** Uma usinagem registrada. `id` é um UUID gerado no aparelho (garante idempotência no sync). */
export interface Usinagem extends Controle {
  id: string;
  rodaId: string;
  perfilNome: string;
  remocaoMm: number;
  medidasAntes: Medidas;
  medidasApos: Medidas;
  /** Versão da regra de cálculo usada, para saber o que foi calculado com regra antiga. */
  regraVersao: string;
}

/** Formato que trafega na API (sem os campos de controle locais). */
export type RodaDto = Omit<Roda, 'syncStatus' | 'syncedAt'>;
export type UsinagemDto = Omit<Usinagem, 'syncStatus' | 'syncedAt'>;

export interface PushResponse {
  rodasAceitas: string[];
  rodasIgnoradas: string[];
  usinagensAceitas: string[];
  usinagensIgnoradas: string[];
}

export interface PullResponse {
  rodas: RodaDto[];
  usinagens: UsinagemDto[];
  /** Guardar e enviar como ?since= na próxima sincronização. */
  cursor: string;
}
