/** Medida para leitura: ao menos 1 casa e até 3, sem perder precisão. 1234.5 => "1.234,5"; 840.123 => "840,123". */
export function fmtNum(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3 });
}

export const fmtMm = (n: number) => `${fmtNum(n)} mm`;

/** Medida para um campo editável: sem separador de milhar, para o parseNum conseguir ler de volta. */
export function paraCampo(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3, useGrouping: false });
}

export function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Aceita "1234,5" e "1234.5". Texto vazio ou inválido vira NaN. */
export function parseNum(texto: string): number {
  const t = texto.trim().replace(',', '.');
  return t === '' ? NaN : Number(t);
}

/** Confere os limites de @Digits da API: até `inteiros` dígitos antes da vírgula e 3 casas depois. */
export function cabeNaApi(n: number, inteiros: number): boolean {
  return Math.abs(n) < 10 ** inteiros && Number(n.toFixed(3)) === n;
}
