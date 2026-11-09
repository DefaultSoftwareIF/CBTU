import { describe, expect, it } from 'vitest';
import { cabeNaApi, fmtNum, paraCampo, parseNum } from './format';

describe('cabeNaApi (limites de @Digits da API)', () => {
  it.each([
    [840, 5, true],
    [840.123, 5, true],
    [99999.999, 5, true],
    [840.1234, 5, false],
    [100000, 5, false],
    [-1.2, 3, true],
    [-1000, 3, false],
  ])('%d com %d dígitos inteiros: %s', (n, inteiros, esperado) => {
    expect(cabeNaApi(n, inteiros)).toBe(esperado);
  });
});

describe('formatação de medidas', () => {
  it.each([
    [840, '840,0'],
    [840.123, '840,123'],
    [1234.5, '1.234,5'],
  ])('fmtNum(%d) => %s', (n, texto) => {
    expect(fmtNum(n)).toBe(texto);
  });

  it('paraCampo não usa separador de milhar', () => {
    expect(paraCampo(1234.5)).toBe('1234,5');
  });

  it.each([840, 840.123, 1234.5, 99999.999, 0.001, -1.25])('%d sobrevive à ida e volta pelo campo', (n) => {
    expect(parseNum(paraCampo(n))).toBe(n);
  });
});
