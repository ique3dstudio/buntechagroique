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

function inicioProximoMes(inicioMes) {
  const [ano, mes] = inicioMes.split('-').map(Number);
  return mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
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

// --- Visitas ---

router.get('/visitas', async (req, res) => {
  const { data, error } = await supabase
    .from('visitas')
    .select('*, contatos(nome)')
    .order('data', { ascending: false })
    .limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/visitas', async (req, res) => {
  const { contato_id, data: dataVisita, km, observacoes } = req.body;
  if (!contato_id || !dataVisita) {
    return res.status(400).json({ error: 'contato_id e data são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('visitas')
    .insert({ contato_id, data: dataVisita, km, observacoes })
    .select('*, contatos(nome)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
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
  const proximoMes = inicioProximoMes(mes);

  const { data: meta, error: metaError } = await supabase
    .from('metas')
    .select('*')
    .eq('mes', mes)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (metaError) return res.status(500).json({ error: metaError.message });

  const { data: negociacoesGanhas, error: negociacoesError } = await supabase
    .from('negociacoes')
    .select('valor')
    .eq('etapa', 'ganha')
    .gte('updated_at', mes)
    .lt('updated_at', proximoMes);
  if (negociacoesError) return res.status(500).json({ error: negociacoesError.message });
  const faturamentoMes = negociacoesGanhas.reduce((soma, n) => soma + Number(n.valor || 0), 0);

  const { data: visitas, error: visitasError } = await supabase
    .from('visitas')
    .select('contato_id, km')
    .gte('data', mes)
    .lt('data', proximoMes);
  if (visitasError) return res.status(500).json({ error: visitasError.message });
  const clientesVisitadosMes = new Set(visitas.map((v) => v.contato_id)).size;
  const kmRodadosMes = visitas.reduce((soma, v) => soma + Number(v.km || 0), 0);

  const statusContagens = {};
  for (const status of ['ativo', 'inativo', 'desenvolvimento', 'convertido']) {
    const { count, error } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    if (error) return res.status(500).json({ error: error.message });
    statusContagens[status] = count ?? 0;
  }

  res.json({
    mes,
    valor_meta: meta?.valor_meta ?? null,
    faturamento_mes: faturamentoMes,
    clientes_visitados_mes: clientesVisitadosMes,
    km_rodados_mes: kmRodadosMes,
    clientes_ativos: statusContagens.ativo,
    clientes_inativos: statusContagens.inativo,
    clientes_desenvolvimento: statusContagens.desenvolvimento,
    clientes_convertidos: statusContagens.convertido,
  });
});

export default router;
