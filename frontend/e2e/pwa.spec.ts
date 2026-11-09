import { expect, test } from '@playwright/test';

/** Critério da issue "base do front": o app abre e pode ser instalado como PWA. */
test('app abre e atende aos critérios de instalação do navegador', async ({ page, context }) => {
  await context.route('**/api/sync**', (route) =>
    route.fulfill({ json: { rodas: [], usinagens: [], cursor: new Date().toISOString() } }),
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Nova roda', level: 1 })).toBeVisible();
  await expect(page.getByText('App pronto para uso offline')).toBeVisible();

  const cdp = await context.newCDPSession(page);

  const { errors: errosManifesto } = await cdp.send('Page.getAppManifest');
  expect(errosManifesto).toEqual([]);

  // É a mesma verificação que o Chromium faz para oferecer a instalação.
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);

  for (const icone of ['/icons/icon-192.png', '/icons/icon-512.png']) {
    const resposta = await page.request.get(icone);
    expect(resposta.ok(), icone).toBe(true);
    expect(resposta.headers()['content-type']).toContain('image/png');
  }
});
