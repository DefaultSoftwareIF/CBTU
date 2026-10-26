import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { LinkConfig, NavInferior, TopbarMarca } from '../components/Layout';
import { situacaoRoda } from '../domain/calculo';
import { db } from '../db';
import { fmtMm } from '../format';
import { useConfig } from '../hooks/useConfig';
import { medidasAtuais } from '../services/usinagens';
import type { Situacao } from '../types';

const ROTULO: Record<Situacao, string> = { EM_USO: 'Em uso', ATENCAO: 'Atenção', DESCARTE: 'Descarte' };
type Filtro = 'TODAS' | Exclude<Situacao, 'EM_USO'>;

export function Rodas() {
  const { limites } = useConfig();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODAS');

  const itens = useLiveQuery(async () => {
    const [rodas, usinagens] = await Promise.all([db.rodas.toArray(), db.usinagens.toArray()]);
    return rodas.map((roda) => {
      const dela = usinagens.filter((u) => u.rodaId === roda.id);
      return { roda, quantidade: dela.length, atuais: medidasAtuais(roda, dela) };
    });
  }, []);

  const todas = (itens ?? [])
    .map((i) => ({ ...i, situacao: situacaoRoda(i.atuais, limites) }))
    .sort((a, b) => a.roda.id.localeCompare(b.roda.id));
  const atencao = todas.filter((i) => i.situacao === 'ATENCAO').length;
  const descarte = todas.filter((i) => i.situacao === 'DESCARTE').length;

  const visiveis = todas.filter(
    (i) =>
      i.roda.id.includes(busca.trim().toUpperCase()) && (filtro === 'TODAS' || i.situacao === filtro),
  );

  const chip = (valor: Filtro, texto: string) => (
    <button
      type="button"
      className={`chip ${filtro === valor ? 'ativo' : ''}`}
      aria-pressed={filtro === valor}
      onClick={() => setFiltro(valor)}
    >
      {texto}
    </button>
  );

  return (
    <div className="app">
      <TopbarMarca>
        <LinkConfig />
      </TopbarMarca>

      <main className="conteudo">
        <h1>Rodas</h1>

        <div className="campo">
          <label htmlFor="busca">Buscar por ID</label>
          <input
            id="busca"
            type="search"
            className="mono"
            placeholder="ex.: RD-0417"
            autoComplete="off"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="chips">
          {chip('TODAS', `Todas · ${todas.length}`)}
          {chip('ATENCAO', `Atenção · ${atencao}`)}
          {chip('DESCARTE', `Descarte · ${descarte}`)}
        </div>

        {visiveis.length === 0 ? (
          <p className="vazio">{todas.length === 0 ? 'Nenhuma roda cadastrada ainda.' : 'Nenhuma roda encontrada.'}</p>
        ) : (
          <div className="lista">
            {visiveis.map(({ roda, quantidade, atuais, situacao }) => (
              <a key={roda.id} className="item-roda" href={`#/roda/${encodeURIComponent(roda.id)}`}>
                <div>
                  <span className="codigo-grande">{roda.id}</span>
                  <span className="sub">
                    {quantidade} {quantidade === 1 ? 'usinagem' : 'usinagens'} · <span className="mono">{fmtMm(atuais.diametro)}</span>
                  </span>
                </div>
                <span className={`selo ${situacao.toLowerCase()}`}>{ROTULO[situacao]}</span>
              </a>
            ))}
          </div>
        )}

        <p className="nota">A situação vem dos limites de descarte configurados.</p>
      </main>

      <NavInferior ativa="rodas" />
    </div>
  );
}
