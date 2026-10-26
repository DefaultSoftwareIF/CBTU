import type { ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useOnline } from '../hooks/useOnline';
import { IconeAjustes, IconeLista, IconeNova, IconeRelogio, IconeVoltar, Marca } from './icons';

function usePendentes(): number {
  return (
    useLiveQuery(
      async () =>
        (await db.rodas.where('syncStatus').equals('pendente').count()) +
        (await db.usinagens.where('syncStatus').equals('pendente').count()),
      [],
      0,
    ) ?? 0
  );
}

/** "Online · 0 pendentes" / "Offline · 2 pendentes". */
export function StatusPill() {
  const online = useOnline();
  const pendentes = usePendentes();
  return (
    <div className="pill-status" data-testid="status-conexao">
      <span className={`ponto ${online ? 'ok' : 'alerta'}`} />
      <span>
        {online ? 'Online' : 'Offline'} · {pendentes} {pendentes === 1 ? 'pendente' : 'pendentes'}
      </span>
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
