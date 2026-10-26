import { useLiveQuery } from 'dexie-react-hooks';
import { NavInferior, TopbarVoltar } from '../components/Layout';
import { db } from '../db';
import { fmtData, fmtMm, fmtNum } from '../format';
import { medidasAtuais } from '../services/usinagens';
import type { Roda, Usinagem } from '../types';

interface Dados {
  roda: Roda;
  usinagens: Usinagem[]; // da mais antiga para a mais recente
}

async function carregar(rodaId?: string): Promise<Dados | null> {
  // Sem ID (aba "Histórico"): usa a roda da usinagem mais recente.
  const id = rodaId ?? (await db.usinagens.orderBy('criadoEm').last())?.rodaId;
  if (!id) return null;
  const roda = await db.rodas.get(id);
  if (!roda) return null;
  const usinagens = await db.usinagens.where('rodaId').equals(id).sortBy('criadoEm');
  return { roda, usinagens };
}

/** Gráfico simples do diâmetro: cadastro e depois de cada usinagem. */
function GraficoDiametro({ valores }: { valores: number[] }) {
  const largura = 320;
  const xs = valores.map((_, i) => (valores.length === 1 ? largura / 2 : 20 + (i * 260) / (valores.length - 1)));
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const ys = valores.map((v) => (max === min ? 50 : 20 + ((max - v) / (max - min)) * 62));
  const rotulo = (i: number) => (i === 0 ? 'Cad.' : `U${i}`);
  const descricao = `Diâmetro da roda: de ${fmtNum(valores[0])} para ${fmtNum(valores.at(-1)!)} milímetros em ${valores.length - 1} usinagens`;

  return (
    <svg width="100%" viewBox="0 0 320 110" fill="none" role="img" aria-label={descricao}>
      <line x1="10" y1="100" x2="310" y2="100" stroke="#D3D1C9" strokeWidth="1" />
      <polyline points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} stroke="#26394A" strokeWidth="3" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={i === xs.length - 1 ? 6 : 5} fill={i === xs.length - 1 ? '#B83E0B' : '#26394A'} />
          <text x={x} y="108" textAnchor="middle" fontSize="10" fill="#4F555C">
            {rotulo(i)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Historico({ rodaId }: { rodaId?: string }) {
  const dados = useLiveQuery(() => carregar(rodaId), [rodaId]);

  if (dados === undefined) return null; // carregando
  if (dados === null) {
    return (
      <div className="app">
        <TopbarVoltar para="/rodas" rotulo="Rodas" />
        <main className="conteudo">
          <h1>Histórico de usinagens</h1>
          <p className="vazio">{rodaId ? `Roda ${rodaId} não encontrada.` : 'Nenhuma usinagem registrada ainda.'}</p>
        </main>
        <NavInferior ativa="historico" />
      </div>
    );
  }

  const { roda, usinagens } = dados;
  const atuais = medidasAtuais(roda, usinagens);
  const removido = usinagens.reduce((soma, u) => soma + u.remocaoMm, 0);
  const diametros = [roda.medidasIniciais.diametro, ...usinagens.map((u) => u.medidasApos.diametro)];

  return (
    <div className="app">
      <TopbarVoltar para="/rodas" rotulo="Rodas" direita={<span className="codigo">{roda.id}</span>} />

      <main className="conteudo">
        <h1>Histórico de usinagens</h1>

        <div className="grade-3">
          <div className="mini claro">
            <div className="mini-rotulo">Diâmetro atual</div>
            <div className="mini-valor">{fmtNum(atuais.diametro)}</div>
          </div>
          <div className="mini claro">
            <div className="mini-rotulo">Usinagens</div>
            <div className="mini-valor">{usinagens.length}</div>
          </div>
          <div className="mini claro">
            <div className="mini-rotulo">Removido</div>
            <div className="mini-valor">{fmtMm(removido)}</div>
          </div>
        </div>

        <section className="card">
          <h2 className="card-titulo">Diâmetro ao longo da vida</h2>
          <GraficoDiametro valores={diametros} />
        </section>

        <section className="card linha-tempo">
          {[...usinagens].reverse().map((u, i) => {
            const numero = usinagens.length - i;
            const pendente = u.syncStatus === 'pendente';
            return (
              <div className="evento" key={u.id} data-testid="usinagem">
                <div className="evento-topo">
                  <span className="evento-titulo">
                    Usinagem {numero} · {u.perfilNome}
                  </span>
                  <span className={`selo ${pendente ? 'pendente' : 'sincronizado'}`} data-testid="sync-status">
                    {pendente ? 'Pendente de envio' : 'Sincronizado'}
                  </span>
                </div>
                <div className="evento-detalhe">
                  {fmtData(u.criadoEm)} · removeu <span className="mono">{fmtMm(u.remocaoMm)}</span> · eixo{' '}
                  <span className="mono">{fmtNum(u.medidasAntes.anguloEixo)}°</span>
                </div>
              </div>
            );
          })}
          <div className="evento">
            <span className="evento-titulo">Cadastro da roda</span>
            <div className="evento-detalhe">
              {fmtData(roda.criadoEm)} · diâmetro inicial <span className="mono">{fmtMm(roda.medidasIniciais.diametro)}</span>
            </div>
          </div>
        </section>

        <p className="nota">Registros feitos offline ficam na fila e são enviados quando houver conexão.</p>
      </main>

      <NavInferior ativa="historico" />
    </div>
  );
}
