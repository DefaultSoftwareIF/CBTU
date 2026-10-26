import { useRegisterSW } from 'virtual:pwa-register/react';

/** Avisa quando o app está pronto offline e quando existe uma versão nova para instalar. */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const fechar = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="toast" role="status">
      {needRefresh ? (
        <>
          <span>Nova versão disponível.</span>
          <button className="btn-mini" onClick={() => updateServiceWorker(true)}>
            Atualizar
          </button>
        </>
      ) : (
        <span>App pronto para uso offline</span>
      )}
      <button className="btn-mini secundario" onClick={fechar}>
        Fechar
      </button>
    </div>
  );
}
