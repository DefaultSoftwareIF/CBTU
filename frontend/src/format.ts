/** Número no padrão brasileiro: 1234.5 => "1.234,5". */
export function fmtNum(n: number, casas = 1): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export const fmtMm = (n: number, casas = 1) => `${fmtNum(n, casas)} mm`;

export function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Aceita "1234,5" e "1234.5". Texto vazio ou inválido vira NaN. */
export function parseNum(texto: string): number {
  const t = texto.trim().replace(',', '.');
  return t === '' ? NaN : Number(t);
}
