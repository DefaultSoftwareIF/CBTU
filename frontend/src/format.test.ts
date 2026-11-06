import { describe, expect, it } from 'vitest';
import { cabeNaApi } from './format';

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
