// Screenshot do app no viewport de referência do redesign (1672x941).
// Usa dados de exemplo para o layout poder ser avaliado sem Supabase.
// Uso: node design/screenshot.cjs [aba] [saida.png]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const aba = process.argv[2] || 'inicio';
const saida = process.argv[3] || `design/atual-${aba}.png`;

const vendedores = [{
  id: 'v1', nome: 'Gustavo Ique', cargo: 'Vendedor Júnior', regiao: 'Minas Gerais',
  numero_vendedor: '3281', matricula: '12665', celular: '(11) 91741-2544',
  email: 'gique@bentonit.com.br', foto_perfil_url: null,
}];
const clientes = [{ id: 'c1', nome: 'Agromax', dados: { funil: 'Lead Frio' }, contatos: [] }];
const produtos = [
  { id: 'p1', codigo: 'PAN01545', nome: 'SEEDGEL FR PREMIUM BIG BAG 1000KG', preco: 0 },
  { id: 'p2', codigo: 'PAN01187', nome: 'SEEDGEL FR GRAF BIG BAG 1000KG', preco: 0 },
  { id: 'p3', codigo: 'PAN01201', nome: 'SEEDGEL FR M BIGBAG 1000KG', preco: 0 },
];
const tarefas = [
  { id: 't1', texto: 'Ligar par a U', concluida: false, prioridade: 'alta', cliente_id: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 't2', texto: 'Ligar para o Jean', concluida: false, prioridade: 'media', cliente_id: null, created_at: '2026-01-02T00:00:00Z' },
  { id: 't3', texto: 'Pegar Amostra Larissa', concluida: false, prioridade: 'media', cliente_id: 'c1', clientes: { nome: 'Agromax' }, created_at: '2026-01-03T00:00:00Z' },
  { id: 't4', texto: 'Ligar para A', concluida: false, prioridade: 'baixa', cliente_id: null, created_at: '2026-01-04T00:00:00Z' },
];
const visitas = [
  { id: 'vi1', data: '2026-09-10', km: 100, clientes: { nome: 'Germimax' }, observacoes: 'Primeiro contato com cliente (Apresentação) e tentativa de negociação', objetivo: 'Apresentação' },
  { id: 'vi2', data: '2026-09-09', km: 700, clientes: { nome: 'Pastotech' }, observacoes: 'Primeiro contato com cliente (Apresentação) e tentativa de negociação', objetivo: 'Apresentação' },
];
const resumo = {
  metaAno: 1500000, vendidoAno: 874590, pace: 156353, meses: [],
  faturamento_mes: 66590, clientes_visitados_mes: 2, vendas_mes: 3,
  km_rodados_mes: 800, clientes_carteira: 67, meta_geral: 35000000,
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
  page.on('pageerror', (e) => { if (!/L is not defined/.test(e.message)) console.log('pageerror:', e.message); });

  await page.route('**/api/**', (route) => {
    const p = new URL(route.request().url()).pathname.replace('/api', '');
    const json = (x, s = 200) => route.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(x) });
    if (p === '/vendedores') return json(vendedores);
    if (p === '/clientes') return json(clientes);
    if (p === '/produtos') return json(produtos);
    if (p === '/tarefas') return json(tarefas);
    if (p === '/visitas') return json(visitas);
    if (p === '/resumo') return json(resumo);
    if (p === '/config') return json({});
    return json([]);
  });

  await page.goto(process.env.APP_URL || 'http://localhost:3000');
  await page.waitForTimeout(1200);
  if (aba !== 'inicio') {
    await page.click(`nav.abas button[data-aba="${aba}"]`).catch(() => {});
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: saida });
  console.log('salvo em', saida);
  await browser.close();
})();
