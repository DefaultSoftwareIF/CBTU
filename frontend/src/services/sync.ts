import { db } from '../db';
import type { PullResponse, PushResponse, Roda, RodaDto, Usinagem, UsinagemDto } from '../types';

const API = import.meta.env.VITE_API_URL ?? '/api';
const TAMANHO_LOTE = 100;
const CHAVE_CURSOR = 'syncCursor';

let emAndamento = false;

function lotes<T>(itens: T[], tamanho: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) out.push(itens.slice(i, i + tamanho));
  return out;
}

/**
 * Envia um lote. Se a API recusar (400), divide o lote ao meio até achar o registro culpado:
 * ele fica "recusado" e os outros seguem. Outras falhas (rede, 5xx) sobem e tudo continua como está.
 */
async function enviarLote(rodas: Roda[], usinagens: Usinagem[]): Promise<void> {
  const total = rodas.length + usinagens.length;
  const r = rodas.map(({ syncStatus: _s, syncedAt: _t, ...dto }): RodaDto => dto);
  const u = usinagens.map(({ syncStatus: _s, syncedAt: _t, ...dto }): UsinagemDto => dto);

  const res = await fetch(`${API}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rodas: r, usinagens: u }),
  });

  if (res.status === 400) {
    if (total === 1) {
      console.warn('Registro recusado pela API:', rodas[0]?.id ?? usinagens[0]?.id);
      await Promise.all([
        ...rodas.map((x) => db.rodas.update(x.id, { syncStatus: 'recusado' })),
        ...usinagens.map((x) => db.usinagens.update(x.id, { syncStatus: 'recusado' })),
      ]);
      return;
    }
    const meio = Math.floor(total / 2);
    const nRodas = Math.min(rodas.length, meio);
    const nUsinagens = meio - nRodas;
    await enviarLote(rodas.slice(0, nRodas), usinagens.slice(0, nUsinagens));
    await enviarLote(rodas.slice(nRodas), usinagens.slice(nUsinagens));
    return;
  }
  if (!res.ok) throw new Error(`Falha no envio: HTTP ${res.status}`);

  const resp: PushResponse = await res.json();
  const syncedAt = new Date().toISOString();
  // "ignoradas" = o servidor já tem versão igual ou mais nova: também deixam de ser pendentes.
  await Promise.all([
    ...[...resp.rodasAceitas, ...resp.rodasIgnoradas].map((id) =>
      db.rodas.update(id, { syncStatus: 'sincronizado', syncedAt }),
    ),
    ...[...resp.usinagensAceitas, ...resp.usinagensIgnoradas].map((id) =>
      db.usinagens.update(id, { syncStatus: 'sincronizado', syncedAt }),
    ),
  ]);
}

async function enviarPendentes(): Promise<void> {
  // Os recusados voltam a cada envio: se a recusa vinha de uma regra que mudou na API, eles se resolvem sozinhos.
  const rodas = await db.rodas.where('syncStatus').anyOf('pendente', 'recusado').toArray();
  const usinagens = await db.usinagens.where('syncStatus').anyOf('pendente', 'recusado').sortBy('criadoEm');

  const loteRodas = lotes(rodas, TAMANHO_LOTE);
  const loteUsinagens = lotes(usinagens, TAMANHO_LOTE);
  const n = Math.max(loteRodas.length, loteUsinagens.length);

  for (let i = 0; i < n; i++) {
    await enviarLote(loteRodas[i] ?? [], loteUsinagens[i] ?? []);
  }
}

async function baixarAlteracoes(): Promise<void> {
  const cursor = (await db.meta.get(CHAVE_CURSOR))?.valor as string | undefined;
  const url = cursor ? `${API}/sync?since=${encodeURIComponent(cursor)}` : `${API}/sync`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar alterações: HTTP ${res.status}`);
  const dados: PullResponse = await res.json();
  const syncedAt = new Date().toISOString();

  await db.transaction('rw', db.rodas, db.usinagens, db.meta, async () => {
    for (const remota of dados.rodas) {
      const local = await db.rodas.get(remota.id);
      // Nunca sobrescreve algo ainda pendente de envio.
      if (!local || local.syncStatus === 'sincronizado') {
        await db.rodas.put({ ...remota, syncStatus: 'sincronizado', syncedAt });
      }
    }
    for (const remota of dados.usinagens) {
      const local = await db.usinagens.get(remota.id);
      if (!local || local.syncStatus === 'sincronizado') {
        await db.usinagens.put({ ...remota, syncStatus: 'sincronizado', syncedAt });
      }
    }
    await db.meta.put({ chave: CHAVE_CURSOR, valor: dados.cursor });
  });
}

/** Envia o que está pendente e depois baixa o que mudou no servidor. Seguro de chamar várias vezes. */
export async function sincronizar(): Promise<void> {
  if (emAndamento || !navigator.onLine) return;
  emAndamento = true;
  try {
    await enviarPendentes();
    await baixarAlteracoes();
  } catch (erro) {
    // Sem rede ou API fora do ar: o que está pendente será reenviado depois.
    console.warn('Sincronização adiada:', erro);
  } finally {
    emAndamento = false;
  }
}
