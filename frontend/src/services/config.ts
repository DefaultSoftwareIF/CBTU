import { db } from '../db';
import { CONFIG_INICIAL } from '../domain/calculo';
import type { Config } from '../types';

const CHAVE = 'config';

/**
 * Lê a configuração local. Se ainda não existe, devolve os perfis iniciais.
 * TODO: hoje a configuração é local ao aparelho. Falta um GET/PUT /api/config para a oficina
 * ter uma configuração única compartilhada.
 */
export async function lerConfig(): Promise<Config> {
  const salvo = await db.meta.get(CHAVE);
  return (salvo?.valor as Config | undefined) ?? CONFIG_INICIAL;
}

export async function salvarConfig(config: Config): Promise<void> {
  await db.meta.put({ chave: CHAVE, valor: config });
}
