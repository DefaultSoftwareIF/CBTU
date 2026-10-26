import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { sincronizar } from './services/sync';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Pede ao navegador para não apagar os dados locais (importante no iOS/Safari).
void navigator.storage?.persist?.();

// Gatilhos de sincronização: ao abrir, ao voltar a rede e ao voltar para o app.
void sincronizar();
window.addEventListener('online', () => void sincronizar());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void sincronizar();
});
