import { Router } from 'express';
import { supabase } from '../services/supabase.js';

const router = Router();

const ETAPAS = [
  'novo_lead',
  'qualificacao',
  'reuniao_agendada',
  'proposta_enviada',
  'negociacao',
  'ganha',
  'perdida',
];

function inicioMesAtual() {
  const agora = new Date();
  const ano = agora.getUTCFullYear();
  const mes = String(agora.getUTCMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}-01`;
}

// --- Empresas ---

router.get('/empresas', async (req, res) => {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/empresas', async (req, res) => {
  const { nome, segmento, site, telefone, cidade } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

  const { data, error } = await supabase
    .from('empresas')
    .insert({ nome, segmento, site, telefone, cidade })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// --- Produtos ---

router.get('/produtos', async (req, res) => {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/produtos', async (req, res) => {
  const { nome, preco } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

  const { data, error } = await supabase
    .from('produtos')
    .insert({ nome, preco })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// --- Contatos ---

router.get('/contatos', async (req, res) => {
  const { data, error } = await supabase
    .from('contatos')
    .select('*, empresas(nome)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/contatos', async (req, res) => {
  const { nome, empresa_id, telefone, email, cargo, origem, status, observacoes } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

  const { data, error } = await supabase
    .from('contatos')
    .insert({ nome, empresa_id: empresa_id || null, telefone, email, cargo, origem, status, observacoes })
    .select('*, empresas(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// --- Negociações ---

router.get('/negociacoes', async (req, res) => {
  const { data, error } = await supabase
    .from('negociacoes')
    .select('*, contatos(nome), produtos(nome)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/negociacoes', async (req, res) => {
  const { contato_id, produto_id, titulo, valor, origem, temperatura, data_prevista } = req.body;
  if (!contato_id || !titulo) {
    return res.status(400).json({ error: 'contato_id e titulo são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('negociacoes')
    .insert({
      contato_id,
      produto_id: produto_id || null,
      titulo,
      valor,
      origem,
      temperatura: temperatura || 'morno',
      data_prevista,
    })
    .select('*, contatos(nome), produtos(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/negociacoes/:id', async (req, res) => {
  const { etapa, motivo_perda } = req.body;
  if (!ETAPAS.includes(etapa)) {
    return res.status(400).json({ error: 'etapa inválida' });
  }

  const atualizacao = { etapa, updated_at: new Date().toISOString() };
  if (etapa === 'perdida') atualizacao.motivo_perda = motivo_perda || null;

  const { data, error } = await supabase
    .from('negociacoes')
    .update(atualizacao)
    .eq('id', req.params.id)
    .select('*, contatos(nome), produtos(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Atividades ---

router.get('/atividades', async (req, res) => {
  const { data, error } = await supabase
    .from('atividades')
    .select('*, contatos(nome)')
    .eq('concluido', false)
    .order('data', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/atividades', async (req, res) => {
  const { contato_id, negociacao_id, tipo, descricao, data: dataAtividade } = req.body;
  if (!contato_id || !descricao || !dataAtividade) {
    return res.status(400).json({ error: 'contato_id, descricao e data são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('atividades')
    .insert({
      contato_id,
      negociacao_id: negociacao_id || null,
      tipo: tipo || 'tarefa',
      descricao,
      data: dataAtividade,
    })
    .select('*, contatos(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/atividades/:id/concluir', async (req, res) => {
  const { data, error } = await supabase
    .from('atividades')
    .update({ concluido: true })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Metas e resumo do mês ---

router.post('/metas', async (req, res) => {
  const { mes, valor_meta } = req.body;
  if (!mes || valor_meta == null) {
    return res.status(400).json({ error: 'mes e valor_meta são obrigatórios' });
  }

  const { data, error } = await supabase.from('metas').insert({ mes, valor_meta }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/resumo', async (req, res) => {
  const mes = inicioMesAtual();

  const { data: meta, error: metaError } = await supabase
    .from('metas')
    .select('*')
    .eq('mes', mes)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (metaError) return res.status(500).json({ error: metaError.message });

  const { data: negociacoes, error: negociacoesError } = await supabase
    .from('negociacoes')
    .select('valor, etapa');
  if (negociacoesError) return res.status(500).json({ error: negociacoesError.message });

  const valorRealizado = negociacoes
    .filter((n) => n.etapa === 'ganha')
    .reduce((soma, n) => soma + Number(n.valor || 0), 0);
  const negociacoesEmAberto = negociacoes.filter((n) => n.etapa !== 'ganha' && n.etapa !== 'perdida').length;

  const { count: atividadesPendentes, error: atividadesError } = await supabase
    .from('atividades')
    .select('*', { count: 'exact', head: true })
    .eq('concluido', false);
  if (atividadesError) return res.status(500).json({ error: atividadesError.message });

  res.json({
    mes,
    valor_meta: meta?.valor_meta ?? null,
    valor_realizado: valorRealizado,
    negociacoes_em_aberto: negociacoesEmAberto,
    atividades_pendentes: atividadesPendentes ?? 0,
  });
});

export default router;
