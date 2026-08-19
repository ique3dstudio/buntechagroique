import { Router } from 'express';
import { supabase } from '../services/supabase.js';

const router = Router();

function inicioMesAtual() {
  const agora = new Date();
  const ano = agora.getUTCFullYear();
  const mes = String(agora.getUTCMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}-01`;
}

// --- Clientes ---

router.get('/clientes', async (req, res) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/clientes', async (req, res) => {
  const { nome, empresa, telefone, email, status, observacoes } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

  const { data, error } = await supabase
    .from('clientes')
    .insert({ nome, empresa, telefone, email, status, observacoes })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// --- Propostas ---

router.get('/propostas', async (req, res) => {
  const { data, error } = await supabase
    .from('propostas')
    .select('*, clientes(nome)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/propostas', async (req, res) => {
  const { cliente_id, titulo, valor, data_prevista } = req.body;
  if (!cliente_id || !titulo) {
    return res.status(400).json({ error: 'cliente_id e titulo são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('propostas')
    .insert({ cliente_id, titulo, valor, data_prevista })
    .select('*, clientes(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/propostas/:id', async (req, res) => {
  const { status } = req.body;
  if (!['em_andamento', 'ganha', 'perdida'].includes(status)) {
    return res.status(400).json({ error: 'status inválido' });
  }

  const { data, error } = await supabase
    .from('propostas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*, clientes(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Follow-ups ---

router.get('/follow-ups', async (req, res) => {
  const { data, error } = await supabase
    .from('follow_ups')
    .select('*, clientes(nome)')
    .eq('concluido', false)
    .order('data', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/follow-ups', async (req, res) => {
  const { cliente_id, descricao, data: dataFollowUp } = req.body;
  if (!cliente_id || !descricao || !dataFollowUp) {
    return res.status(400).json({ error: 'cliente_id, descricao e data são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('follow_ups')
    .insert({ cliente_id, descricao, data: dataFollowUp })
    .select('*, clientes(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/follow-ups/:id/concluir', async (req, res) => {
  const { data, error } = await supabase
    .from('follow_ups')
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

  const { data, error } = await supabase
    .from('metas')
    .insert({ mes, valor_meta })
    .select()
    .single();
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

  const { data: propostas, error: propostasError } = await supabase
    .from('propostas')
    .select('valor, status');
  if (propostasError) return res.status(500).json({ error: propostasError.message });

  const valorRealizado = propostas
    .filter((p) => p.status === 'ganha')
    .reduce((soma, p) => soma + Number(p.valor || 0), 0);
  const propostasEmAndamento = propostas.filter((p) => p.status === 'em_andamento').length;

  const { count: followUpsPendentes, error: followUpsError } = await supabase
    .from('follow_ups')
    .select('*', { count: 'exact', head: true })
    .eq('concluido', false);
  if (followUpsError) return res.status(500).json({ error: followUpsError.message });

  res.json({
    mes,
    valor_meta: meta?.valor_meta ?? null,
    valor_realizado: valorRealizado,
    propostas_em_andamento: propostasEmAndamento,
    follow_ups_pendentes: followUpsPendentes ?? 0,
  });
});

export default router;
