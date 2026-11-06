import { expect, test } from '@playwright/test';

/** Detalhes do design que só um navegador real calcula (o jsdom dos testes unitários não aplica CSS). */
const FONTE_MONO = /IBM Plex Mono/;

test.beforeEach(async ({ context }) => {
  await context.route('**/api/sync**', (route) =>
    route.fulfill({ json: { rodas: [], usinagens: [], cursor: new Date().toISOString() } }),
  );
});

test('campos de valor usam a fonte mono em todas as telas', async ({ page }) => {
  await page.goto('/');
  for (const rotulo of ['ID da roda', 'Diâmetro (mm)', 'Largura do aro (mm)', 'Ângulo do eixo (°)']) {
    await expect(page.getByLabel(rotulo, { exact: true })).toHaveCSS('font-family', FONTE_MONO);
  }

  await page.getByRole('link', { name: 'Rodas', exact: true }).click();
  await expect(page.getByLabel('Buscar por ID')).toHaveCSS('font-family', FONTE_MONO);

  await page.getByRole('link', { name: 'Config', exact: true }).click();
  await expect(page.getByLabel('Diâmetro mínimo (mm)')).toHaveCSS('font-family', FONTE_MONO);
});

test('card do eixo mostra a ilustração ao lado do campo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 980 });
  await page.goto('/');

  const ilustracao = page.getByTestId('ilustracao-eixo');
  await expect(ilustracao).toBeVisible();

  const campo = await page.getByLabel('Ângulo do eixo (°)', { exact: true }).boundingBox();
  const desenho = await ilustracao.boundingBox();
  expect(desenho!.x).toBeGreaterThanOrEqual(campo!.x + campo!.width);
  expect(desenho!.x + desenho!.width).toBeLessThanOrEqual(390);
});

test('cards seguem o espaçamento do design', async ({ page }) => {
  await page.goto('/#/config');
  await expect(page.locator('.card.perfis')).toHaveCSS('row-gap', '4px');
  await expect(page.getByRole('button', { name: 'Adicionar perfil' })).toHaveCSS('min-height', '52px');
});
