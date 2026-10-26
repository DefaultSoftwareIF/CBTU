import type { ReactNode } from 'react';

function Icone({ children, size = 24, cor = 'currentColor' }: { children: ReactNode; size?: number; cor?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={cor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconeLista = () => (
  <Icone>
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  </Icone>
);
export const IconeNova = () => (
  <Icone>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </Icone>
);
export const IconeRelogio = () => (
  <Icone>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icone>
);
export const IconeAjustes = ({ size = 24 }: { size?: number }) => (
  <Icone size={size}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icone>
);
export const IconeVoltar = () => (
  <Icone size={22}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icone>
);
export const IconeSeta = () => (
  <Icone size={20}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icone>
);
export const IconeMais = () => (
  <Icone size={22}>
    <path d="M12 5v14M5 12h14" />
  </Icone>
);

/** Marca provisória (roda estilizada), igual à do protótipo. */
export const Marca = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#FFFFFF" strokeWidth="2" aria-hidden="true">
    <circle cx="16" cy="16" r="13" />
    <circle cx="16" cy="16" r="9" stroke="#E9783F" />
    <circle cx="16" cy="16" r="3" />
    <path d="M16 3v6M16 23v6M3 16h6M23 16h6" />
  </svg>
);
