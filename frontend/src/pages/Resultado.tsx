import { useState } from 'react';
import { NavInferior, TopbarVoltar } from '../components/Layout';
import { ranquear, usinagensAteDescarte } from '../domain/calculo';
import { fmtMm, fmtNum } from '../format';
import { useConfig } from '../hooks/useConfig';
import { navegar } from '../hooks/useHashRoute';
import { registrarUsinagem } from '../services/usinagens';
import type { Rascunho } from './NovaRoda';

export function Resultado({ rascunho, onRegistrado }: { rascunho: Rascunho; onRegistrado: () => void }) {
  const { perfis, limites } = useConfig();
  const [salvando, setSalvando] = useState(false);
  const { rodaId, medidas } = rascunho;

  const ranking = ranquear(medidas, perfis);
  const melhor = ranking[0];
  const maior = Math.max(...ranking.map((i) => i.remocaoMm));
  const restantes = melhor ? usinagensAteDescarte(medidas.diametro, melhor.remocaoMm, limites) : null;

  const registrar = async () => {
    if (!melhor || salvando) return; // trava duplo toque: não duplica a usinagem
    setSalvando(true);
    await registrarUsinagem(rodaId, medidas, melhor.perfil, melhor.remocaoMm);
    onRegistrado();
    navegar(`/roda/${encodeURIComponent(rodaId)}`);
  };

  return (
    <div className="app">
      <TopbarVoltar para="/nova" rotulo="Editar medidas" direita={<span className="codigo">{rodaId}</span>} />

      <main className="conteudo">
        {!melhor ? (
          <section className="card">
            <p>Nenhum perfil está ativo para a comparação.</p>
            <a href="#/config">Ativar perfis em Config</a>
          </section>
        ) : (
          <>
            <section className="hero" aria-label="Perfil recomendado">
              <div className="hero-rotulo">Perfil recomendado</div>
              <div className="hero-valor" data-testid="perfil-recomendado">
                {melhor.perfil.nome}
              </div>
              <p>Menor remoção de material para o ângulo de eixo informado, preservando a vida útil da roda.</p>
              <div className="grade-2">
                <div className="mini">
                  <div className="mini-rotulo">Remoção estimada</div>
                  <div className="mini-valor" data-testid="remocao-estimada">
                    {fmtMm(melhor.remocaoMm)}
                  </div>
                </div>
                <div className="mini">
                  <div className="mini-rotulo">Usinagens até o descarte</div>
                  <div className="mini-valor">{restantes === null ? '—' : `≈ ${restantes}`}</div>
                </div>
              </div>
              {restantes === null && <p className="dica">Defina o diâmetro mínimo em Config para estimar.</p>}
            </section>

            <section className="card">
              <h2 className="card-titulo">Material removido por perfil</h2>
              {ranking.map((item, i) => (
                <div className="barra" key={item.perfil.id}>
                  <div className={`barra-linha ${i === 0 ? 'destaque' : ''}`}>
                    <span>{item.perfil.nome}</span>
                    <span className="mono">{fmtMm(item.remocaoMm)}</span>
                  </div>
                  <div className="barra-trilho">
                    <div
                      className={`barra-valor ${i === 0 ? 'destaque' : ''}`}
                      style={{ width: `${maior > 0 ? (item.remocaoMm / maior) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <section className="card">
              <h2 className="card-titulo">Parâmetros usados</h2>
              <dl className="parametros">
                <div><dt>Diâmetro</dt><dd>{fmtNum(medidas.diametro)}</dd></div>
                <div><dt>Aro</dt><dd>{fmtNum(medidas.aro)}</dd></div>
                <div><dt>Friso esp.</dt><dd>{fmtNum(medidas.frisoEspessura)}</dd></div>
                <div><dt>Friso alt.</dt><dd>{fmtNum(medidas.frisoAltura)}</dd></div>
                <div><dt>Eixo</dt><dd>{fmtNum(medidas.anguloEixo)}°</dd></div>
              </dl>
            </section>

            <p className="nota">
              Cálculo provisório: a fórmula e os alvos dos perfis ainda precisam ser validados com a oficina.
            </p>

            <button className="btn-primario" onClick={registrar} disabled={salvando}>
              Registrar usinagem com este perfil
            </button>
            <a className="btn-secundario" href="#/nova">
              Voltar e ajustar medidas
            </a>
          </>
        )}
      </main>

      <NavInferior ativa="nova" />
    </div>
  );
}
