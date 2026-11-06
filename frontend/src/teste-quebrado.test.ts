import { expect, it } from 'vitest';

// Teste quebrado de propósito: este PR só existe para comprovar que o CI bloqueia o merge.
it('falha de propósito', () => {
  expect(1).toBe(2);
});
