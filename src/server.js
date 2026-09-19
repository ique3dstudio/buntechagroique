import 'dotenv/config';
import express from 'express';
import apiRouter from './routes/api.js';
import { supabase } from './services/supabase.js';

const app = express();
const port = process.env.PORT || 3000;
const somenteLeitura = process.env.SOMENTE_LEITURA === 'true';

app.use(express.json());

// Modo demonstração: bloqueia qualquer gravação (POST/PATCH/PUT/DELETE) antes
// de chegar nas rotas, pra dar um link "só visualizar" sem risco de alguém
// mexer nos dados reais. Ativa com a env var SOMENTE_LEITURA=true - pensado
// pra rodar num segundo serviço de deploy separado do uso real do dia a dia.
if (somenteLeitura) {
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    res.status(403).json({ error: 'Modo somente leitura — esta é uma cópia de demonstração, sem gravação de dados.' });
  });
}

app.use('/api', apiRouter);

app.get('/manifest.json', async (req, res) => {
  const { data } = await supabase.from('configuracoes').select('icone_url').eq('id', 1).maybeSingle();
  const icone = data?.icone_url;
  res.json({
    name: 'Buntech Agro — Painel de Vendas',
    short_name: 'Buntech Agro',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f7f6',
    theme_color: '#0B6FB0',
    icons: icone ? [
      { src: icone, sizes: '192x192', type: 'image/png' },
      { src: icone, sizes: '512x512', type: 'image/png' },
    ] : [],
  });
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
