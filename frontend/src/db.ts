import Dexie, { type Table } from 'dexie';
import type { Roda, Usinagem } from './types';

/** Pares chave/valor locais (configuração, cursor do sync). */
export interface Meta {
  chave: string;
  valor: unknown;
}

class RodaTrackDB extends Dexie {
  rodas!: Table<Roda, string>;
  usinagens!: Table<Usinagem, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super('rodatrack-db');
    // Só os campos indexados entram aqui; o resto do objeto é gravado normalmente.
    this.version(1).stores({
      rodas: 'id, syncStatus',
      usinagens: 'id, rodaId, criadoEm, syncStatus',
      meta: 'chave',
    });
  }
}

export const db = new RodaTrackDB();
