import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

/** Rota atual a partir do hash da URL ("#/rodas" => "/rodas"). Roteamento mínimo, sem biblioteca. */
export function useHashRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1) || '/nova',
    () => '/nova',
  );
}

export function navegar(rota: string): void {
  window.location.hash = rota;
}
