import { useState } from 'react';
import { IconeMais } from '../components/icons';
import { NavInferior, TopbarVoltar } from '../components/Layout';
import { fmtNum, parseNum } from '../format';
import { useConfigCarregada } from '../hooks/useConfig';
import { navegar } from '../hooks/useHashRoute';
import { salvarConfig } from '../services/config';
import type { Config as ConfigTipo, Limites, Perfil } from '../types';

const texto = (n?: number) => (n === undefined ? '' : fmtNum(n, 1));

/** Campo vazio = limite não definido. Texto inválido = erro. */
function lerLimite(t: string): number | undefined | 'invalido' {
  if (t.trim() === '') return undefined;
  const n = parseNum(t);
  return Number.isFinite(n) && n > 0 ? n : 'invalido';
}

export function Config() {
  const salva = useConfigCarregada();
  if (!salva) return null; // carregando
  return <ConfigForm inicial={salva} />;
}

function ConfigForm({ inicial }: { inicial: ConfigTipo }) {
  const [perfis, setPerfis] = useState<Perfil[]>(inicial.perfis);
  const [editando, setEditando] = useState<string | null>(null);
  const [lim, setLim] = useState({
    diametroMinimo: texto(inicial.limites.diametroMinimo),
    frisoEspessuraMinima: texto(inicial.limites.frisoEspessuraMinima),
    alertaFaltandoMm: texto(inicial.limites.alertaFaltandoMm),
  });
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = (id: string, parcial: Partial<Perfil>) =>
    setPerfis((ps) => ps.map((p) => (p.id === id ? { ...p, ...parcial } : p)));

  const adicionar = () => {
    const novo: Perfil = { id: crypto.randomUUID(), nome: '', ativo: true, alvoFrisoEspessura: NaN, alvoFrisoAltura: NaN };
    setPerfis((ps) => [...ps, novo]);
    setEditando(novo.id);
  };

  const salvar = async () => {
    const invalido = perfis.find(
      (p) => !p.nome.trim() || !(p.alvoFrisoEspessura > 0) || !(p.alvoFrisoAltura > 0),
    );
    if (invalido) {
      setEditando(invalido.id);
      setErro('Preencha nome e alvos (maiores que zero) de todos os perfis.');
      return;
    }

    const dm = lerLimite(lim.diametroMinimo);
    const fe = lerLimite(lim.frisoEspessuraMinima);
    const al = lerLimite(lim.alertaFaltandoMm);
    if (dm === 'invalido' || fe === 'invalido' || al === 'invalido') {
      setErro('Os limites devem ser números maiores que zero (ou ficar em branco).');
      return;
    }

    const limites: Limites = { diametroMinimo: dm, frisoEspessuraMinima: fe, alertaFaltandoMm: al };
    await salvarConfig({ perfis: perfis.map((p) => ({ ...p, nome: p.nome.trim() })), limites });
    navegar('/rodas');
  };

  const campoLimite = (chave: keyof typeof lim, rotulo: string) => (
    <div className="campo">
      <label htmlFor={chave}>{rotulo}</label>
      <input
        id={chave}
        type="text"
        inputMode="decimal"
        className="mono"
        placeholder="[definir]"
        autoComplete="off"
        value={lim[chave]}
        onChange={(e) => setLim({ ...lim, [chave]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="app">
      <TopbarVoltar para="/rodas" rotulo="Rodas" direita={<span className="titulo-topbar">Configurações</span>} />

      <main className="conteudo">
        <div className="titulo-bloco">
          <h1>Perfis e limites</h1>
          <p>Defina quais perfis entram na comparação e quando uma roda deve ser descartada.</p>
        </div>

        <section className="card">
          <h2 className="card-titulo">Perfis considerados</h2>
          {perfis.map((p) => (
            <div className="perfil" key={p.id}>
              <div className="perfil-linha">
                <label className="check">
                  <input type="checkbox" checked={p.ativo} onChange={(e) => atualizar(p.id, { ativo: e.target.checked })} />
                  {p.nome || 'Novo perfil'}
                </label>
                <button type="button" className="link-btn" onClick={() => setEditando(editando === p.id ? null : p.id)}>
                  {editando === p.id ? 'Fechar' : 'Editar'}
                </button>
              </div>
              {editando === p.id && (
                <div className="perfil-edicao">
                  <div className="campo">
                    <label htmlFor={`nome-${p.id}`}>Nome do perfil</label>
                    <input id={`nome-${p.id}`} value={p.nome} onChange={(e) => atualizar(p.id, { nome: e.target.value })} />
                  </div>
                  <div className="grade-2">
                    <div className="campo">
                      <label htmlFor={`esp-${p.id}`}>Alvo: espessura do friso (mm)</label>
                      <input
                        id={`esp-${p.id}`}
                        inputMode="decimal"
                        className="mono"
                        defaultValue={texto(p.alvoFrisoEspessura)}
                        onChange={(e) => atualizar(p.id, { alvoFrisoEspessura: parseNum(e.target.value) })}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor={`alt-${p.id}`}>Alvo: altura do friso (mm)</label>
                      <input
                        id={`alt-${p.id}`}
                        inputMode="decimal"
                        className="mono"
                        defaultValue={texto(p.alvoFrisoAltura)}
                        onChange={(e) => atualizar(p.id, { alvoFrisoAltura: parseNum(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="link-btn adicionar" onClick={adicionar}>
            <IconeMais />
            Adicionar perfil
          </button>
        </section>

        <section className="card">
          <h2 className="card-titulo">Limites de descarte</h2>
          {campoLimite('diametroMinimo', 'Diâmetro mínimo (mm)')}
          {campoLimite('frisoEspessuraMinima', 'Espessura mínima do friso (mm)')}
          {campoLimite('alertaFaltandoMm', 'Alertar quando faltar (mm até o limite)')}
        </section>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <button type="button" className="btn-primario" onClick={salvar}>
          Salvar configurações
        </button>
      </main>

      <NavInferior ativa="config" />
    </div>
  );
}
