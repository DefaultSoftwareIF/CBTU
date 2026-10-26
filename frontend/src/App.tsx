import { useState } from 'react';
import { UpdatePrompt } from './components/UpdatePrompt';
import { navegar, useHashRoute } from './hooks/useHashRoute';
import { Config } from './pages/Config';
import { Historico } from './pages/Historico';
import { NovaRoda, type Rascunho } from './pages/NovaRoda';
import { Resultado } from './pages/Resultado';
import { Rodas } from './pages/Rodas';

export default function App() {
  const rota = useHashRoute();
  // Medidas digitadas na tela "Nova roda", mantidas até registrar (ou ao voltar para editar).
  const [rascunho, setRascunho] = useState<Rascunho | undefined>();

  let pagina;
  if (rota === '/rodas') {
    pagina = <Rodas />;
  } else if (rota === '/config') {
    pagina = <Config />;
  } else if (rota === '/historico') {
    pagina = <Historico />;
  } else if (rota.startsWith('/roda/')) {
    pagina = <Historico rodaId={decodeURIComponent(rota.slice('/roda/'.length))} />;
  } else if (rota === '/resultado' && rascunho) {
    pagina = <Resultado rascunho={rascunho} onRegistrado={() => setRascunho(undefined)} />;
  } else {
    pagina = (
      <NovaRoda
        key={rascunho?.rodaId ?? 'novo'}
        rascunho={rascunho}
        onCalcular={(r) => {
          setRascunho(r);
          navegar('/resultado');
        }}
      />
    );
  }

  return (
    <>
      {pagina}
      <UpdatePrompt />
    </>
  );
}
