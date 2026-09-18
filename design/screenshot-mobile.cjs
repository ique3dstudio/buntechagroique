// Captura do app em viewport de celular (390x844, iPhone-ish).
// Uso: node design/screenshot-mobile.cjs [aba] [saida.png]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const aba = process.argv[2] || 'inicio';
const saida = process.argv[3] || `design/mobile-${aba}.png`;

const vendedores = [{ id:'v1', nome:'Gustavo Ique', cargo:'Vendedor Júnior', regiao:'Minas Gerais',
  numero_vendedor:'3281', matricula:'12665', celular:'(11) 91741-2544', email:'gique@bentonit.com.br', foto_perfil_url:null }];
const resumo = { metaAno:1500000, vendidoAno:874590, pace:156353, meses:[], faturamento_mes:66590,
  clientes_visitados_mes:2, vendas_mes:3, km_rodados_mes:800, clientes_carteira:67, meta_geral:35000000 };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('pageerror', (e) => { if (!/L is not defined/.test(e.message)) console.log('pageerror:', e.message); });
  await page.route('**/api/**', (r) => {
    const p = new URL(r.request().url()).pathname.replace('/api','');
    const j = (x) => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(x) });
    if (p === '/vendedores') return j(vendedores);
    if (p === '/resumo') return j(resumo);
    if (p === '/config') return j({});
    return j([]);
  });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1200);
  if (aba !== 'inicio') { await page.click(`nav.abas button[data-aba="${aba}"]`).catch(()=>{}); await page.waitForTimeout(600); }
  if (process.env.GAVETA) { await page.click('#btn-hamburguer'); await page.waitForTimeout(500); }
  await page.screenshot({ path: saida, fullPage: process.env.FULL === '1' });
  console.log('salvo em', saida);
  await b.close();
})();
