import { expect, test, type BrowserContext } from '@playwright/test';

/** API simulada: aceita tudo que for enviado e devolve "nada novo" no download. */
async function simularApi(context: BrowserContext) {
  const enviados = { rodas: [] as string[], usinagens: [] as string[] };

  await context.route('**/api/sync**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const corpo = req.postDataJSON() as { rodas: { id: string }[]; usinagens: { id: string }[] };
      const rodasAceitas = corpo.rodas.map((r) => r.id);
      const usinagensAceitas = corpo.usinagens.map((u) => u.id);
      enviados.rodas.push(...rodasAceitas);
      enviados.usinagens.push(...usinagensAceitas);
      await route.fulfill({ json: { rodasAceitas, rodasIgnoradas: [], usinagensAceitas, usinagensIgnoradas: [] } });
    } else {
      await route.fulfill({ json: { rodas: [], usinagens: [], cursor: new Date().toISOString() } });
    }
  });

  return enviados;
}

test('cadastra e registra usinagem offline, e sincroniza quando a rede volta', async ({ page, context }) => {
  const enviados = await simularApi(context);

  // 1) Primeira visita online: o service worker faz o precache do app.
  await page.goto('/');
  await expect(page.getByText('App pronto para uso offline')).toBeVisible();

  // 2) Fica offline e recarrega: o app precisa abrir mesmo assim.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Nova roda', level: 1 })).toBeVisible();
  await expect(page.getByTestId('status-conexao')).toHaveText('Offline · 0 pendentes');

  // 3) Cadastra a roda com as medidas do protótipo e calcula o perfil (tudo no aparelho).
  await page.getByLabel('ID da roda', { exact: true }).fill('RD-0417');
  await page.getByLabel('Diâmetro (mm)', { exact: true }).fill('840,0');
  await page.getByLabel('Largura do aro (mm)', { exact: true }).fill('135,0');
  await page.getByLabel('Espessura do friso (mm)', { exact: true }).fill('28,0');
  await page.getByLabel('Altura do friso (mm)', { exact: true }).fill('30,0');
  await page.getByLabel('Ângulo do eixo (°)', { exact: true }).fill('1,2');
  await page.getByRole('button', { name: 'Calcular perfil recomendado' }).click();

  await expect(page.getByTestId('perfil-recomendado')).toHaveText('AAR-1B NF');
  await expect(page.getByTestId('remocao-estimada')).toHaveText('1,8 mm');

  // 4) Registra a usinagem: fica pendente (1 roda + 1 usinagem).
  await page.getByRole('button', { name: 'Registrar usinagem com este perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Histórico de usinagens' })).toBeVisible();
  await expect(page.getByTestId('sync-status')).toHaveText('Pendente de envio');
  await page.getByRole('link', { name: 'Nova roda', exact: true }).click();
  await expect(page.getByTestId('status-conexao')).toHaveText('Offline · 2 pendentes');

  // 5) Rede volta: tudo é enviado e passa a "Sincronizado".
  await context.setOffline(false);
  await expect(page.getByTestId('status-conexao')).toHaveText('Online · 0 pendentes');
  await page.getByRole('link', { name: 'Histórico', exact: true }).click();
  await expect(page.getByTestId('sync-status')).toHaveText('Sincronizado');
  expect(enviados.rodas).toEqual(['RD-0417']);
  expect(enviados.usinagens).toHaveLength(1);
});

test('formulário vazio mostra os erros e não avança', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Calcular perfil recomendado' }).click();

  await expect(page.getByText('Informe o ID da roda')).toBeVisible();
  await expect(page.getByText('Informe o diâmetro')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nova roda', level: 1 })).toBeVisible();
});
