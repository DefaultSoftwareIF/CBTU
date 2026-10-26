import { describe, expect, it } from 'vitest';
import {
  PERFIS_INICIAIS,
  calcularRemocaoMm,
  medidasAposUsinagem,
  ranquear,
  situacaoRoda,
  usinagensAteDescarte,
} from './calculo';
import type { Medidas } from '../types';

// Medidas de exemplo do protótipo (roda RD-0417).
const rd0417: Medidas = { diametro: 840, aro: 135, frisoEspessura: 28, frisoAltura: 30, anguloEixo: 1.2 };

describe('ranquear (valores PROVISÓRIOS do protótipo)', () => {
  it('reproduz o exemplo do protótipo: NF < modificado < AAR-1B', () => {
    const r = ranquear(rd0417, PERFIS_INICIAIS);
    expect(r.map((i) => [i.perfil.nome, i.remocaoMm])).toEqual([
      ['AAR-1B NF', 1.8],
      ['AAR-1B modificado', 2.2],
      ['AAR-1B', 2.6],
    ]);
  });

  it('ignora perfis desativados', () => {
    const perfis = PERFIS_INICIAIS.map((p) => (p.id === 'aar-1b-nf' ? { ...p, ativo: false } : p));
    expect(ranquear(rd0417, perfis)[0].perfil.nome).toBe('AAR-1B modificado');
  });

  it('retorna lista vazia quando nenhum perfil está ativo', () => {
    expect(ranquear(rd0417, PERFIS_INICIAIS.map((p) => ({ ...p, ativo: false })))).toEqual([]);
  });
});

describe('calcularRemocaoMm', () => {
  it('não remove friso quando a roda já está dentro do alvo (só conta o desvio do eixo)', () => {
    const m: Medidas = { ...rd0417, frisoEspessura: 20, frisoAltura: 20, anguloEixo: 0 };
    expect(calcularRemocaoMm(m, PERFIS_INICIAIS[0])).toBe(0);
  });

  it('usa o módulo do ângulo do eixo', () => {
    const a = calcularRemocaoMm({ ...rd0417, anguloEixo: 1 }, PERFIS_INICIAIS[0]);
    const b = calcularRemocaoMm({ ...rd0417, anguloEixo: -1 }, PERFIS_INICIAIS[0]);
    expect(a).toBe(b);
  });
});

describe('medidasAposUsinagem', () => {
  it('reduz o diâmetro e leva o friso ao alvo do perfil', () => {
    const apos = medidasAposUsinagem(rd0417, PERFIS_INICIAIS[1], 1.8);
    expect(apos.diametro).toBe(838.2);
    expect(apos.frisoEspessura).toBe(26.8);
    expect(apos.aro).toBe(135);
  });
});

describe('usinagensAteDescarte', () => {
  it('é null enquanto o diâmetro mínimo não está configurado', () => {
    expect(usinagensAteDescarte(840, 1.8, {})).toBeNull();
  });

  it('conta quantas usinagens cabem até o limite', () => {
    expect(usinagensAteDescarte(840, 1.8, { diametroMinimo: 833 })).toBe(3); // 7 / 1.8 = 3,88
  });

  it('nunca fica negativo', () => {
    expect(usinagensAteDescarte(830, 1.8, { diametroMinimo: 833 })).toBe(0);
  });
});

describe('situacaoRoda', () => {
  const limites = { diametroMinimo: 780, frisoEspessuraMinima: 22, alertaFaltandoMm: 30 };

  it('sem limites configurados, a roda fica "Em uso"', () => {
    expect(situacaoRoda(rd0417, {})).toBe('EM_USO');
  });

  it.each([
    [840, 'EM_USO'],
    [805, 'ATENCAO'], // faltam 25 mm
    [810, 'ATENCAO'], // faltam exatamente 30 mm
    [811, 'EM_USO'],
    [780, 'DESCARTE'],
    [772, 'DESCARTE'],
  ])('diâmetro %s => %s', (diametro, esperado) => {
    expect(situacaoRoda({ ...rd0417, diametro }, limites)).toBe(esperado);
  });

  it('descarta pela espessura mínima do friso', () => {
    expect(situacaoRoda({ ...rd0417, frisoEspessura: 22 }, limites)).toBe('DESCARTE');
  });
});
