// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdatePrompt } from './UpdatePrompt';

const estado = vi.hoisted(() => ({ offlineReady: false, needRefresh: false, atualizar: vi.fn() }));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [estado.offlineReady, vi.fn()],
    needRefresh: [estado.needRefresh, vi.fn()],
    updateServiceWorker: estado.atualizar,
  }),
}));

beforeEach(() => {
  estado.offlineReady = false;
  estado.needRefresh = false;
  estado.atualizar.mockClear();
});
afterEach(cleanup);

describe('aviso de atualização do app', () => {
  it('não mostra nada sem novidade', () => {
    const { container } = render(<UpdatePrompt />);
    expect(container.textContent).toBe('');
  });

  it('avisa que o app está pronto para uso offline', () => {
    estado.offlineReady = true;
    render(<UpdatePrompt />);
    expect(screen.getByText('App pronto para uso offline')).toBeTruthy();
  });

  it('avisa da nova versão e só atualiza quando o usuário pede', async () => {
    estado.needRefresh = true;
    render(<UpdatePrompt />);
    expect(screen.getByText('Nova versão disponível.')).toBeTruthy();
    expect(estado.atualizar).not.toHaveBeenCalled();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(estado.atualizar).toHaveBeenCalledWith(true);
  });
});
