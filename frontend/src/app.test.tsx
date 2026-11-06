// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { db } from './db';
import { salvarConfig } from './services/config';
import { sincronizar } from './services/sync';
import { registrarUsinagem } from './services/usinagens';
import { CONFIG_INICIAL } from './domain/calculo';

// O service worker não existe no jsdom.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

const MEDIDAS = { diametro: 840, aro: 135, frisoEspessura: 28, frisoAltura: 30, anguloEixo: 1.2 };

function definirOnline(valor: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value: valor, configurable: true });
  window.dispatchEvent(new Event(valor ? 'online' : 'offline'));
}

/** Servidor falso: aceita tudo que receber e não tem novidades para baixar. */
function simularServidor() {
  const fetchFalso = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      const corpo = JSON.parse(init.body as string) as { rodas: { id: string }[]; usinagens: { id: string }[] };
      return Response.json({
        rodasAceitas: corpo.rodas.map((r) => r.id),
        rodasIgnoradas: [],
        usinagensAceitas: corpo.usinagens.map((u) => u.id),
        usinagensIgnoradas: [],
      });
    }
    return Response.json({ rodas: [], usinagens: [], cursor: '2026-10-26T20:00:00.000Z' });
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

beforeEach(async () => {
  window.location.hash = '';
  await db.delete();
  await db.open();
  definirOnline(true);
  simularServidor();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('fluxo principal', () => {
  it('valida o formulário, recomenda o perfil, registra offline e sincroniza ao voltar a rede', async () => {
    definirOnline(false);
    const user = userEvent.setup();
    render(<App />);

    // Formulário vazio: mostra os erros e não avança.
    await user.click(screen.getByRole('button', { name: 'Calcular perfil recomendado' }));
    expect(await screen.findByText('Informe o ID da roda')).toBeTruthy();
    expect(screen.getByText('Informe o diâmetro')).toBeTruthy();

    // Preenche com as medidas do protótipo.
    await user.type(screen.getByLabelText('ID da roda'), 'rd-0417');
    await user.type(screen.getByLabelText('Diâmetro (mm)'), '840,0');
    await user.type(screen.getByLabelText('Largura do aro (mm)'), '135,0');
    await user.type(screen.getByLabelText('Espessura do friso (mm)'), '28,0');
    await user.type(screen.getByLabelText('Altura do friso (mm)'), '30,0');
    await user.type(screen.getByLabelText('Ângulo do eixo (°)'), '1,2');
    await user.click(screen.getByRole('button', { name: 'Calcular perfil recomendado' }));

    // Resultado calculado no aparelho (ID normalizado para maiúsculas).
    expect((await screen.findByTestId('perfil-recomendado')).textContent).toBe('AAR-1B NF');
    expect(screen.getByTestId('remocao-estimada').textContent).toBe('1,8 mm');
    expect(screen.getByText('RD-0417')).toBeTruthy();

    // Registra: fica pendente (1 roda + 1 usinagem) enquanto offline.
    await user.click(screen.getByRole('button', { name: 'Registrar usinagem com este perfil' }));
    expect(await screen.findByRole('heading', { name: 'Histórico de usinagens' })).toBeTruthy();
    expect((await screen.findByTestId('sync-status')).textContent).toBe('Pendente de envio');
    expect(await db.usinagens.count()).toBe(1);

    // O indicador de conexão fica na tela "Nova roda" (como no protótipo).
    await user.click(screen.getByRole('link', { name: 'Nova roda' }));
    // waitFor: o contador começa em 0 até a consulta ao IndexedDB responder.
    await waitFor(() => expect(screen.getByTestId('status-conexao').textContent).toBe('Offline · 2 pendentes'));

    // A rede volta: envia e marca como sincronizado.
    definirOnline(true);
    await sincronizar();
    await waitFor(() => expect(screen.getByTestId('status-conexao').textContent).toBe('Online · 0 pendentes'));
    await user.click(screen.getByRole('link', { name: 'Histórico' }));
    expect((await screen.findByTestId('sync-status')).textContent).toBe('Sincronizado');
  });

  it('não duplica a usinagem ao tocar duas vezes em "Registrar"', async () => {
    const user = userEvent.setup();
    await db.rodas.clear();
    window.location.hash = '#/nova';
    render(<App />);

    await user.type(screen.getByLabelText('ID da roda'), 'RD-1');
    await user.type(screen.getByLabelText('Diâmetro (mm)'), '840');
    await user.type(screen.getByLabelText('Largura do aro (mm)'), '135');
    await user.type(screen.getByLabelText('Espessura do friso (mm)'), '28');
    await user.type(screen.getByLabelText('Altura do friso (mm)'), '30');
    await user.type(screen.getByLabelText('Ângulo do eixo (°)'), '1');
    await user.click(screen.getByRole('button', { name: 'Calcular perfil recomendado' }));

    const botao = await screen.findByRole('button', { name: 'Registrar usinagem com este perfil' });
    await user.dblClick(botao);

    await screen.findByRole('heading', { name: 'Histórico de usinagens' });
    expect(await db.usinagens.count()).toBe(1);
  });
});

describe('lista de rodas e limites', () => {
  it('classifica Atenção e Descarte conforme os limites configurados', async () => {
    await salvarConfig({
      ...CONFIG_INICIAL,
      limites: { diametroMinimo: 780, alertaFaltandoMm: 30 },
    });
    const perfil = CONFIG_INICIAL.perfis[0];
    await registrarUsinagem('RD-0417', { ...MEDIDAS, diametro: 840 }, perfil, 1.8); // 838,2 → em uso
    await registrarUsinagem('RD-0392', { ...MEDIDAS, diametro: 808 }, perfil, 1.8); // 806,2 → faltam 26,2 → atenção
    await registrarUsinagem('RD-0301', { ...MEDIDAS, diametro: 781 }, perfil, 1.8); // 779,2 → descarte

    window.location.hash = '#/rodas';
    render(<App />);

    expect(await screen.findByRole('button', { name: 'Todas · 3' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Atenção · 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Descarte · 1' })).toBeTruthy();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Descarte · 1' }));
    expect(screen.getByText('RD-0301')).toBeTruthy();
    expect(screen.queryByText('RD-0417')).toBeNull();
  });
});

describe('registro recusado pela API', () => {
  const perfil = CONFIG_INICIAL.perfis[0];

  /** Recusa com 400 qualquer lote que contenha a roda indicada, como o Bean Validation faz com o lote inteiro. */
  function servidorQueRecusa(rodaId: string | null, status = 400) {
    const fetchFalso = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== 'POST') return Response.json({ rodas: [], usinagens: [], cursor: '2026-10-26T20:00:00.000Z' });
      const corpo = JSON.parse(init.body as string) as { rodas: { id: string }[]; usinagens: { id: string; rodaId: string }[] };
      if (rodaId && (corpo.rodas.some((r) => r.id === rodaId) || corpo.usinagens.some((u) => u.rodaId === rodaId))) {
        return new Response(null, { status });
      }
      return Response.json({
        rodasAceitas: corpo.rodas.map((r) => r.id),
        rodasIgnoradas: [],
        usinagensAceitas: corpo.usinagens.map((u) => u.id),
        usinagensIgnoradas: [],
      });
    });
    vi.stubGlobal('fetch', fetchFalso);
    return fetchFalso;
  }

  async function registrarOffline(...ids: string[]) {
    definirOnline(false);
    for (const id of ids) await registrarUsinagem(id, MEDIDAS, perfil, 1.8);
    definirOnline(true);
  }

  const statusRodas = async () =>
    Object.fromEntries((await db.rodas.toArray()).map((r) => [r.id, r.syncStatus]));

  it('isola o registro recusado e envia os outros do mesmo lote', async () => {
    await registrarOffline('RD-1', 'RD-RUIM', 'RD-3', 'RD-4');
    servidorQueRecusa('RD-RUIM');

    await sincronizar();

    expect(await statusRodas()).toEqual({
      'RD-1': 'sincronizado',
      'RD-RUIM': 'recusado',
      'RD-3': 'sincronizado',
      'RD-4': 'sincronizado',
    });
    const usinagens = await db.usinagens.toArray();
    expect(usinagens.filter((u) => u.syncStatus === 'recusado').map((u) => u.rodaId)).toEqual(['RD-RUIM']);
    expect(usinagens.filter((u) => u.syncStatus === 'sincronizado')).toHaveLength(3);
  });

  it('continua baixando alterações depois de uma recusa', async () => {
    await registrarOffline('RD-RUIM');
    const fetchFalso = servidorQueRecusa('RD-RUIM');

    await sincronizar();

    expect(fetchFalso.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method !== 'POST')).toBe(true);
    expect((await db.meta.get('syncCursor'))?.valor).toBe('2026-10-26T20:00:00.000Z');
  });

  it('reenvia o recusado e ele se resolve quando a API passa a aceitar', async () => {
    await registrarOffline('RD-RUIM');
    servidorQueRecusa('RD-RUIM');
    await sincronizar();
    expect((await db.rodas.get('RD-RUIM'))?.syncStatus).toBe('recusado');

    servidorQueRecusa(null);
    await sincronizar();

    expect((await db.rodas.get('RD-RUIM'))?.syncStatus).toBe('sincronizado');
  });

  it('falha de servidor (500) não marca como recusado: tudo segue pendente', async () => {
    await registrarOffline('RD-1');
    servidorQueRecusa('RD-1', 500);

    await sincronizar();

    expect((await db.rodas.get('RD-1'))?.syncStatus).toBe('pendente');
  });

  it('mostra o aviso e o selo ao usuário, sem contar como pendente', async () => {
    await registrarOffline('RD-RUIM');
    servidorQueRecusa('RD-RUIM');
    await sincronizar();

    render(<App />);

    expect((await screen.findByTestId('aviso-recusados')).textContent).toContain('2 registros recusados');
    await waitFor(() => expect(screen.getByTestId('status-conexao').textContent).toBe('Online · 0 pendentes'));

    window.location.hash = '#/roda/RD-RUIM';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect((await screen.findByTestId('sync-status')).textContent).toBe('Recusado pelo servidor');
    expect(screen.getByTestId('sync-status-roda').textContent).toBe('Recusado pelo servidor');
  });
});

describe('validação conforme os limites da API', () => {
  async function preencher(campos: Partial<Record<string, string>>) {
    const user = userEvent.setup();
    window.location.hash = '#/nova';
    render(<App />);
    const valores: Record<string, string> = {
      'ID da roda': 'RD-1',
      'Diâmetro (mm)': '840',
      'Largura do aro (mm)': '135',
      'Espessura do friso (mm)': '28',
      'Altura do friso (mm)': '30',
      'Ângulo do eixo (°)': '1',
      ...campos,
    };
    for (const [rotulo, valor] of Object.entries(valores)) await user.type(screen.getByLabelText(rotulo), valor!);
    await user.click(screen.getByRole('button', { name: 'Calcular perfil recomendado' }));
  }

  it.each([
    ['Diâmetro (mm)', '840,1234', 'Use até 5 dígitos e 3 casas decimais'],
    ['Diâmetro (mm)', '100000', 'Use até 5 dígitos e 3 casas decimais'],
    ['Ângulo do eixo (°)', '1,2345', 'Use até 3 dígitos e 3 casas decimais'],
    ['Ângulo do eixo (°)', '1000', 'Use até 3 dígitos e 3 casas decimais'],
    ['ID da roda', 'R'.repeat(41), 'Use no máximo 40 caracteres'],
  ])('%s com "%s" é barrado no formulário', async (rotulo, valor, mensagem) => {
    await preencher({ [rotulo]: valor });
    expect(await screen.findByText(mensagem)).toBeTruthy();
    expect(screen.queryByTestId('perfil-recomendado')).toBeNull();
  });

  it('aceita o limite exato de 3 casas decimais', async () => {
    await preencher({ 'Diâmetro (mm)': '840,123' });
    expect(await screen.findByTestId('perfil-recomendado')).toBeTruthy();
  });

  it('Config barra alvo de perfil com mais de 3 casas decimais', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/config';
    render(<App />);
    await user.click((await screen.findAllByRole('button', { name: 'Editar' }))[0]);
    const alvo = screen.getByLabelText('Alvo: espessura do friso (mm)');
    await user.clear(alvo);
    await user.type(alvo, '26,1234');
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }));
    expect((await screen.findByRole('alert')).textContent).toContain('até 3 casas decimais');
  });
});
