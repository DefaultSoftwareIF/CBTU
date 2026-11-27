import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useOnline } from '../hooks/useOnline';
import { IconeAjustes, IconeLista, IconeNova, IconeRelogio, IconeVoltar, Marca } from './icons';

interface Fila {
  rodas: number;
  usinagens: number;
  recusados: number;
}

const contar = (status: 'pendente' | 'recusado') =>
  Promise.all([
    db.rodas.where('syncStatus').equals(status).count(),
    db.usinagens.where('syncStatus').equals(status).count(),
  ]);

/** O que ainda não chegou ao servidor, separado por tipo. */
function useFila(): Fila {
  return (
    useLiveQuery(
      async () => {
        const [[rodas, usinagens], [rr, ur]] = await Promise.all([contar('pendente'), contar('recusado')]);
        return { rodas, usinagens, recusados: rr + ur };
      },
      [],
      { rodas: 0, usinagens: 0, recusados: 0 },
    ) ?? { rodas: 0, usinagens: 0, recusados: 0 }
  );
}

/** Aparece só quando a API recusou algum registro: sem ele, a falha passaria despercebida. */
export function AvisoRecusados() {
  const recusados =
    useLiveQuery(
      async () =>
        (await db.rodas.where('syncStatus').equals('recusado').count()) +
        (await db.usinagens.where('syncStatus').equals('recusado').count()),
      [],
      0,
    ) ?? 0;
  if (recusados === 0) return null;
  return (
    <p className="aviso-erro" role="alert" data-testid="aviso-recusados">
      {recusados === 1 ? '1 registro recusado' : `${recusados} registros recusados`} pelo servidor. Os dados continuam
      neste aparelho; avise o suporte.
    </p>
  );
}

/** "Online · 0 a enviar" / "Offline · 2 a enviar". Ao tocar, abre o detalhe do que falta enviar. */
export function StatusPill() {
  const online = useOnline();
  const fila = useFila();
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const aEnviar = fila.rodas + fila.usinagens;

  const fechar = () => {
    setAberto(false);
    botao.current?.focus(); // devolve o foco para quem abriu
  };

  return (
    <>
      <button
        ref={botao}
        type="button"
        className="pill-botao"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={() => setAberto(true)}
      >
        <span className="pill-status" data-testid="status-conexao">
          <span className={`ponto ${online ? 'ok' : 'alerta'}`} />
          <span>
            {online ? 'Online' : 'Offline'} · {aEnviar} a enviar
          </span>
        </span>
      </button>
      {aberto && <DetalheEnvio online={online} fila={fila} onFechar={fechar} />}
    </>
  );
}

function DetalheEnvio({ online, fila, onFechar }: { online: boolean; fila: Fila; onFechar: () => void }) {
  const fecharRef = useRef<HTMLButtonElement>(null);
  const aEnviar = fila.rodas + fila.usinagens;

  useEffect(() => {
    fecharRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  let situacao: string;
  if (aEnviar === 0) situacao = 'Tudo o que foi registrado neste aparelho já foi enviado.';
  else if (!online) situacao = 'Sem conexão. Os registros ficam guardados neste aparelho e são enviados quando a rede voltar.';
  else situacao = 'Há conexão, mas o envio ainda não foi concluído. Se continuar assim, o servidor pode estar fora do alcance.';

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhe-envio-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="detalhe-envio-titulo" className="modal-titulo">
          Envio para o servidor
        </h2>
        <p className="modal-texto">{situacao}</p>
        <dl className="modal-lista">
          <div>
            <dt>Rodas aguardando envio</dt>
            <dd data-testid="fila-rodas">{fila.rodas}</dd>
          </div>
          <div>
            <dt>Usinagens aguardando envio</dt>
            <dd data-testid="fila-usinagens">{fila.usinagens}</dd>
          </div>
          {fila.recusados > 0 && (
            <div className="recusados">
              <dt>Recusados pelo servidor</dt>
              <dd data-testid="fila-recusados">{fila.recusados}</dd>
            </div>
          )}
        </dl>
        <button ref={fecharRef} type="button" className="btn-secundario" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </div>
  );
}

export function TopbarMarca({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar">
      <div className="marca">
        <Marca />
        <span className="marca-nome">RodaTrack</span>
      </div>
      {children}
    </header>
  );
}

export function TopbarVoltar({ para, rotulo, direita }: { para: string; rotulo: string; direita?: ReactNode }) {
  return (
    <header className="topbar">
      <a className="voltar" href={`#${para}`}>
        <IconeVoltar />
        {rotulo}
      </a>
      {direita}
    </header>
  );
}

export function LinkConfig() {
  return (
    <a className="icone-btn" href="#/config" aria-label="Configurações de perfis e limites">
      <IconeAjustes />
    </a>
  );
}

type Aba = 'rodas' | 'nova' | 'historico' | 'config';

export function NavInferior({ ativa }: { ativa: Aba }) {
  const itens: { aba: Aba; href: string; rotulo: string; icone: ReactNode }[] = [
    { aba: 'rodas', href: '#/rodas', rotulo: 'Rodas', icone: <IconeLista /> },
    { aba: 'nova', href: '#/nova', rotulo: 'Nova roda', icone: <IconeNova /> },
    { aba: 'historico', href: '#/historico', rotulo: 'Histórico', icone: <IconeRelogio /> },
    { aba: 'config', href: '#/config', rotulo: 'Config', icone: <IconeAjustes /> },
  ];
  return (
    <nav className="nav" aria-label="Principal">
      {itens.map((i) => (
        <a key={i.aba} href={i.href} className={i.aba === ativa ? 'ativa' : ''} aria-current={i.aba === ativa ? 'page' : undefined}>
          {i.icone}
          {i.rotulo}
        </a>
      ))}
    </nav>
  );
}
