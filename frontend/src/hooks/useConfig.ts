import { useLiveQuery } from 'dexie-react-hooks';
import { CONFIG_INICIAL } from '../domain/calculo';
import { lerConfig } from '../services/config';
import type { Config } from '../types';

/** Configuração salva, ou undefined enquanto carrega. Reage a mudanças feitas na tela Config. */
export function useConfigCarregada(): Config | undefined {
  return useLiveQuery(() => lerConfig(), []);
}

/** Configuração atual (perfis e limites); usa os valores iniciais enquanto carrega. */
export function useConfig(): Config {
  return useConfigCarregada() ?? CONFIG_INICIAL;
}
