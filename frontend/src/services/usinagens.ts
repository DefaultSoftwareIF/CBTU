import { getUsuarioId } from '../auth';
import { REGRA_VERSAO, medidasAposUsinagem } from '../domain/calculo';
import { db } from '../db';
import { sincronizar } from './sync';
import type { Medidas, Perfil, Roda, Usinagem } from '../types';

/** Medidas atuais da roda: as de depois da última usinagem, ou as de cadastro se ainda não houve. */
export function medidasAtuais(roda: Roda, usinagens: Usinagem[]): Medidas {
  const ultima = [...usinagens].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)).at(-1);
  return ultima ? ultima.medidasApos : roda.medidasIniciais;
}

/**
 * Registra uma usinagem (e cadastra a roda se for a primeira vez). Grava só no aparelho:
 * funciona offline e depois dispara a sincronização.
 */
export async function registrarUsinagem(rodaId: string, medidas: Medidas, perfil: Perfil, remocaoMm: number) {
  const agora = new Date().toISOString();
  const usuarioId = getUsuarioId();

  const usinagem: Usinagem = {
    id: crypto.randomUUID(),
    rodaId,
    usuarioId,
    perfilNome: perfil.nome,
    remocaoMm,
    medidasAntes: medidas,
    medidasApos: medidasAposUsinagem(medidas, perfil, remocaoMm),
    regraVersao: REGRA_VERSAO,
    criadoEm: agora,
    atualizadoEm: agora,
    syncStatus: 'pendente',
  };

  await db.transaction('rw', db.rodas, db.usinagens, async () => {
    if (!(await db.rodas.get(rodaId))) {
      await db.rodas.add({
        id: rodaId,
        usuarioId,
        medidasIniciais: medidas,
        criadoEm: agora,
        atualizadoEm: agora,
        syncStatus: 'pendente',
      });
    }
    await db.usinagens.add(usinagem);
  });

  void sincronizar(); // não bloqueia: se estiver offline, fica pendente
  return usinagem;
}
