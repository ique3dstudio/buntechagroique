import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../services/supabase.js';
import { geocodificarEndereco } from '../services/geocode.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const CAMPOS_CONFIG = ['icone', 'capa', 'foto_perfil'];

// Aceita "lat, lng" (com ou sem espaço/vírgula/ponto-e-vírgula entre os números).
// Útil pra clientes em área rural, sem endereço reconhecível pelo geocodificador.
function tentarParsearCoordenadas(texto) {
  if (!texto) return null;
  const partes = texto.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean);
  if (partes.length !== 2) return null;
  const latitude = Number(partes[0]);
  const longitude = Number(partes[1]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

const ETAPAS = [
  'novo_lead',
  'qualificacao',
  'reuniao_agendada',
  'proposta_enviada',
  'negociacao',
  'ganha',
  'perdida',
];

// Geocodifica o endereço da matriz tentando do mais específico pro mais amplo:
// CEP e número costumam derrubar a busca do Nominatim, então vale insistir com
// rua+cidade e, no pior caso, só a cidade - melhor um pino aproximado do que
// nenhum pino.
async function geocodificarMatriz(endereco) {
  const semCep = endereco.replace(/,?\s*\d{5}-?\d{3}\s*$/, '').trim();
  const partes = semCep.split(',').map((p) => p.trim()).filter(Boolean);
  const cidade = partes[partes.length - 1];
  const rua = partes[0];

  const tentativas = [endereco, semCep];
  if (rua && cidade && rua !== cidade) tentativas.push(`${rua}, ${cidade}`);
  if (cidade) tentativas.push(cidade);

  for (const consulta of [...new Set(tentativas)]) {
    const coords = await geocodificarEndereco(`${consulta}, Brasil`).catch(() => null);
    if (coords) return coords;
  }
  return null;
}

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
  const { nome, segmento, site, telefone, cidade, cnpj, endereco } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

  let latitude = null;
  let longitude = null;
  let avisoGeocodificacao;
  if (endereco) {
    const enderecoCompleto = [endereco, cidade, 'Minas Gerais', 'Brasil'].filter(Boolean).join(', ');
    const coords = await geocodificarEndereco(enderecoCompleto).catch(() => null);
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else {
      avisoGeocodificacao = 'Não conseguimos localizar esse endereço no mapa. A empresa foi salva mesmo assim.';
    }
  }

  const { data, error } = await supabase
    .from('empresas')
    .insert({ nome, segmento, site, telefone, cidade, cnpj, endereco, latitude, longitude })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data, aviso: avisoGeocodificacao });
});

// --- Configurações visuais (icone, capa, foto de perfil) ---

router.get('/config', async (req, res) => {
  const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? {});
});

router.patch('/config', async (req, res) => {
  // meta_geral e vendido_base continuam fixos (so mudam via SQL direto). meta_valor
  // voltou a ser editavel pelo app, com um lapis dedicado no card "Meta anual".
  const { cargo, regiao, numero_vendedor, matricula, celular, email, meta_valor,
    matriz_nome, matriz_endereco, matriz_coordenadas } = req.body;
  const atualizacao = { updated_at: new Date().toISOString() };

  if (matriz_nome !== undefined) atualizacao.matriz_nome = matriz_nome || null;
  // Endereço novo zera as coordenadas: o mapa regeocodifica no próximo
  // carregamento. Coordenadas informadas na mão vencem (vêm depois).
  if (matriz_endereco !== undefined) {
    atualizacao.matriz_endereco = matriz_endereco || null;
    atualizacao.matriz_latitude = null;
    atualizacao.matriz_longitude = null;
  }
  if (matriz_coordenadas) {
    const coords = tentarParsearCoordenadas(matriz_coordenadas);
    if (!coords) {
      return res.status(400).json({ error: 'Coordenadas da matriz inválidas. Use o formato "latitude, longitude", ex: -23.0903, -47.2181.' });
    }
    atualizacao.matriz_latitude = coords.latitude;
    atualizacao.matriz_longitude = coords.longitude;
  }

  if (cargo !== undefined) atualizacao.cargo = cargo;
  if (regiao !== undefined) atualizacao.regiao = regiao;
  if (numero_vendedor !== undefined) atualizacao.numero_vendedor = numero_vendedor;
  if (matricula !== undefined) atualizacao.matricula = matricula;
  if (celular !== undefined) atualizacao.celular = celular;
  if (email !== undefined) atualizacao.email = email;
  if (meta_valor !== undefined) atualizacao.meta_valor = meta_valor;

  const { data, error } = await supabase.from('configuracoes').update(atualizacao).eq('id', 1).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/config/:campo', upload.single('arquivo'), async (req, res) => {
  const { campo } = req.params;
  if (!CAMPOS_CONFIG.includes(campo)) return res.status(400).json({ error: 'campo inválido' });
  if (!req.file) return res.status(400).json({ error: 'arquivo é obrigatório' });

  const extensao = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const caminho = `${campo}-${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from('app-assets')
    .upload(caminho, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(caminho);

  const { data, error } = await supabase
    .from('configuracoes')
    .update({ [`${campo}_url`]: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Mapa de clientes ---

router.get('/mapa/clientes', async (req, res) => {
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
  if (error) return res.status(500).json({ error: error.message });

  const resultado = [];
  for (const empresa of empresas) {
    const { data: contatosEmpresa, error: contatosError } = await supabase
      .from('contatos')
      .select('id')
      .eq('empresa_id', empresa.id);
    if (contatosError) return res.status(500).json({ error: contatosError.message });
    const contatoIds = contatosEmpresa.map((c) => c.id);

    let faturamento = 0;
    let ultimoPedido = null;
    let produtos = [];

    if (contatoIds.length) {
      const { data: negociacoesGanhas, error: negociacoesError } = await supabase
        .from('negociacoes')
        .select('valor, updated_at, produtos(nome)')
        .in('contato_id', contatoIds)
        .eq('etapa', 'ganha')
        .order('updated_at', { ascending: false });
      if (negociacoesError) return res.status(500).json({ error: negociacoesError.message });

      faturamento = negociacoesGanhas.reduce((soma, n) => soma + Number(n.valor || 0), 0);
      ultimoPedido = negociacoesGanhas[0]?.updated_at ?? null;
      produtos = [...new Set(negociacoesGanhas.map((n) => n.produtos?.nome).filter(Boolean))];
    }

    resultado.push({
      id: empresa.id,
      origem: 'empresa',
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      funil: null,
      foto_url: null,
      endereco: empresa.endereco,
      cidade: empresa.cidade,
      latitude: empresa.latitude,
      longitude: empresa.longitude,
      faturamento,
      ultimo_pedido: ultimoPedido,
      produtos,
    });
  }

  const { data: clientes, error: clientesError } = await supabase
    .from('clientes')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
  if (clientesError) return res.status(500).json({ error: clientesError.message });

  for (const cliente of clientes) {
    const d = cliente.dados || {};
    resultado.push({
      id: cliente.id,
      origem: 'cliente',
      nome: cliente.nome,
      cnpj: d.cnpj ?? null,
      funil: d.funil ?? null,
      foto_url: cliente.foto_url,
      endereco: cliente.endereco,
      cidade: d.cidade ?? null,
      latitude: cliente.latitude,
      longitude: cliente.longitude,
      faturamento: Number(d.faturamento) || 0,
      ultimo_pedido: d.data_ultima_compra ?? null,
      produtos: d.produto_principal ? [d.produto_principal] : [],
    });
  }

  // Matriz (Buntech Agro, Indaiatuba/SP) - ponto de partida das rotas, nao e
  // cliente nem empresa. Geocodifica uma unica vez e guarda o resultado.
  // Quando nao da pra mostrar, devolve o motivo em matriz_aviso - antes isso
  // falhava calado e o pino simplesmente sumia do mapa.
  let matrizAviso = null;
  const { data: config, error: configError } = await supabase
    .from('configuracoes')
    .select('matriz_nome, matriz_endereco, matriz_latitude, matriz_longitude')
    .eq('id', 1)
    .maybeSingle();

  if (configError) {
    matrizAviso = 'A matriz ainda não existe no banco: rode a migração 027 (colunas matriz_* em configuracoes) no SQL Editor do Supabase.';
  } else if (!config?.matriz_endereco && config?.matriz_latitude == null) {
    matrizAviso = 'Matriz sem endereço cadastrado. Use "Editar matriz" pra informar o endereço ou as coordenadas.';
  } else {
    let matrizLat = config.matriz_latitude;
    let matrizLng = config.matriz_longitude;

    if ((matrizLat == null || matrizLng == null) && config.matriz_endereco) {
      const coords = await geocodificarMatriz(config.matriz_endereco);
      if (coords) {
        matrizLat = coords.latitude;
        matrizLng = coords.longitude;
        await supabase
          .from('configuracoes')
          .update({ matriz_latitude: matrizLat, matriz_longitude: matrizLng })
          .eq('id', 1);
      } else {
        matrizAviso = `Não consegui localizar "${config.matriz_endereco}" no mapa. Use "Editar matriz" pra corrigir o endereço ou colar as coordenadas (latitude, longitude).`;
      }
    }

    if (matrizLat != null && matrizLng != null) {
      resultado.unshift({
        id: 'matriz',
        origem: 'matriz',
        nome: config.matriz_nome || 'Buntech Agro (matriz)',
        cnpj: null,
        funil: null,
        foto_url: null,
        endereco: config.matriz_endereco,
        cidade: null,
        latitude: Number(matrizLat),
        longitude: Number(matrizLng),
        faturamento: 0,
        ultimo_pedido: null,
        produtos: [],
      });
    }
  }

  res.json({ pontos: resultado, matriz_aviso: matrizAviso });
});

// --- Clientes (planilha, com campos dinâmicos) ---

router.get('/campos-clientes', async (req, res) => {
  const { data, error } = await supabase
    .from('campos_clientes')
    .select('*')
    .order('ordem', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/campos-clientes', async (req, res) => {
  const { rotulo, tipo, opcoes } = req.body;
  if (!rotulo) return res.status(400).json({ error: 'rótulo é obrigatório' });

  const chave = rotulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!chave) return res.status(400).json({ error: 'rótulo inválido' });

  const { data: existente } = await supabase.from('campos_clientes').select('id').eq('chave', chave).maybeSingle();
  if (existente) return res.status(400).json({ error: 'já existe um campo com esse nome' });

  const { count } = await supabase.from('campos_clientes').select('*', { count: 'exact', head: true });

  const { data, error } = await supabase
    .from('campos_clientes')
    .insert({
      chave,
      rotulo,
      tipo: tipo || 'texto',
      opcoes: opcoes && opcoes.length ? opcoes : null,
      ordem: (count ?? 0) + 1,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/clientes', async (req, res) => {
  const { data, error } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/clientes', async (req, res) => {
  const { nome, endereco, coordenadas, dados } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

  let latitude = null;
  let longitude = null;
  let aviso;

  if (coordenadas) {
    const coords = tentarParsearCoordenadas(coordenadas);
    if (!coords) {
      return res.status(400).json({ error: 'Coordenadas inválidas. Use o formato "latitude, longitude", ex: -18.512, -44.328.' });
    }
    latitude = coords.latitude;
    longitude = coords.longitude;
  } else if (endereco) {
    const cidade = dados?.cidade;
    const enderecoCompleto = [endereco, cidade, 'Minas Gerais', 'Brasil'].filter(Boolean).join(', ');
    const coords = await geocodificarEndereco(enderecoCompleto).catch(() => null);
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else {
      aviso = 'Não conseguimos localizar esse endereço no mapa. O cliente foi salvo mesmo assim — se for uma área rural, tenta preencher as coordenadas.';
    }
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({ nome, endereco, latitude, longitude, dados: dados || {} })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data, aviso });
});

router.patch('/clientes/:id', async (req, res) => {
  const { nome, endereco, coordenadas, dados } = req.body;

  const atualizacao = { updated_at: new Date().toISOString() };
  if (nome !== undefined) atualizacao.nome = nome;
  if (dados !== undefined) atualizacao.dados = dados;

  let aviso;
  if (coordenadas !== undefined) {
    if (coordenadas) {
      const coords = tentarParsearCoordenadas(coordenadas);
      if (!coords) {
        return res.status(400).json({ error: 'Coordenadas inválidas. Use o formato "latitude, longitude", ex: -18.512, -44.328.' });
      }
      atualizacao.latitude = coords.latitude;
      atualizacao.longitude = coords.longitude;
    } else {
      atualizacao.latitude = null;
      atualizacao.longitude = null;
    }
  } else if (endereco !== undefined) {
    atualizacao.endereco = endereco;
    if (endereco) {
      const cidade = dados?.cidade;
      const enderecoCompleto = [endereco, cidade, 'Minas Gerais', 'Brasil'].filter(Boolean).join(', ');
      const coords = await geocodificarEndereco(enderecoCompleto).catch(() => null);
      if (coords) {
        atualizacao.latitude = coords.latitude;
        atualizacao.longitude = coords.longitude;
      } else {
        atualizacao.latitude = null;
        atualizacao.longitude = null;
        aviso = 'Não conseguimos localizar esse endereço no mapa. O cliente foi salvo mesmo assim — se for uma área rural, tenta preencher as coordenadas.';
      }
    } else {
      atualizacao.latitude = null;
      atualizacao.longitude = null;
    }
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(atualizacao)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...data, aviso });
});

router.delete('/clientes/:id', async (req, res) => {
  const { error } = await supabase.from('clientes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

router.post('/clientes/:id/foto', upload.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'arquivo é obrigatório' });

  const extensao = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const caminho = `cliente-${req.params.id}-${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from('app-assets')
    .upload(caminho, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(caminho);

  const { data, error } = await supabase
    .from('clientes')
    .update({ foto_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/clientes/:id/historico-vendas', async (req, res) => {
  const { data, error } = await supabase
    .from('historico_vendas')
    .select('*')
    .eq('cliente_id', req.params.id)
    .order('produto', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Agenda (compromissos/visitas, com cliente vinculado pra montar rota no mapa) ---

const CAMPOS_COMPROMISSO = ['data', 'hora', 'hora_fim', 'tipo', 'titulo', 'cliente_id', 'localizacao', 'motivo', 'etapa_funil', 'descricao', 'status_confirmacao'];

router.get('/agenda', async (req, res) => {
  const { inicio, fim } = req.query;
  let query = supabase
    .from('agenda_compromissos')
    .select('*, clientes(nome, latitude, longitude, endereco)')
    .order('data', { ascending: true })
    .order('hora', { ascending: true, nullsFirst: false });
  if (inicio) query = query.gte('data', inicio);
  if (fim) query = query.lte('data', fim);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/agenda', async (req, res) => {
  const { data: dataCompromisso } = req.body;
  if (!dataCompromisso) return res.status(400).json({ error: 'data é obrigatória' });

  const registro = {};
  for (const campo of CAMPOS_COMPROMISSO) {
    if (req.body[campo] !== undefined) registro[campo] = req.body[campo] || null;
  }
  registro.data = dataCompromisso;

  const { data, error } = await supabase
    .from('agenda_compromissos')
    .insert(registro)
    .select('*, clientes(nome, latitude, longitude, endereco)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/agenda/:id', async (req, res) => {
  const atualizacao = { updated_at: new Date().toISOString() };
  for (const campo of CAMPOS_COMPROMISSO) {
    if (req.body[campo] !== undefined) atualizacao[campo] = req.body[campo] || null;
  }

  const { data, error } = await supabase
    .from('agenda_compromissos')
    .update(atualizacao)
    .eq('id', req.params.id)
    .select('*, clientes(nome, latitude, longitude, endereco)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/agenda/:id', async (req, res) => {
  const { error } = await supabase.from('agenda_compromissos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
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

  // O mes usado pro card de faturamento pode ser escolhido pelo seletor de
  // periodo (setembro a dezembro do ano atual) - as demais estatisticas
  // (visitas, km, status de clientes) continuam sempre olhando pro mes real.
  const anoAtual = new Date().getFullYear();
  const mesAtualNumero = new Date().getMonth() + 1;
  const mesFaturamentoNumero = req.query.mes
    ? Math.min(12, Math.max(1, Number(req.query.mes) || mesAtualNumero))
    : mesAtualNumero;
  const mesFaturamento = `${anoAtual}-${String(mesFaturamentoNumero).padStart(2, '0')}-01`;
  const proximoMesFaturamento = inicioProximoMes(mesFaturamento);

  const { data: meta, error: metaError } = await supabase
    .from('metas')
    .select('*')
    .eq('mes', mesFaturamento)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (metaError) return res.status(500).json({ error: metaError.message });

  const { data: negociacoesGanhas, error: negociacoesError } = await supabase
    .from('negociacoes')
    .select('valor')
    .eq('etapa', 'ganha')
    .gte('updated_at', mesFaturamento)
    .lt('updated_at', proximoMesFaturamento);
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

  const inicioAno = `${anoAtual}-01-01`;
  const inicioProximoAno = `${anoAtual + 1}-01-01`;
  const { data: negociacoesGanhasAno, error: negociacoesAnoError } = await supabase
    .from('negociacoes')
    .select('valor')
    .eq('etapa', 'ganha')
    .gte('updated_at', inicioAno)
    .lt('updated_at', inicioProximoAno);
  if (negociacoesAnoError) return res.status(500).json({ error: negociacoesAnoError.message });
  const faturamentoAnoNegociacoes = negociacoesGanhasAno.reduce((soma, n) => soma + Number(n.valor || 0), 0);

  // Se a migracao que adiciona meta_valor/vendido_base ainda nao rodou nesse banco,
  // nao derruba o /resumo inteiro - so deixa os cartoes de meta/pace sem dado.
  const { data: config } = await supabase
    .from('configuracoes')
    .select('meta_valor, vendido_base')
    .eq('id', 1)
    .maybeSingle();

  const temMeta = config && config.meta_valor != null;
  const vendidoBase = Number(config?.vendido_base) || 0;
  const metaValor = Number(config?.meta_valor) || 0;
  const vendidoAno = temMeta ? vendidoBase + faturamentoAnoNegociacoes : null;

  // Pace = quanto falta pra meta dividido pelos meses restantes no ano (mes atual
  // incluso). So muda de valor quando o mes vira (todo dia 1) ou quando vendidoAno muda.
  const mesAtual = new Date().getMonth() + 1;
  const mesesRestantes = Math.max(1, 13 - mesAtual);
  const paceMensal = temMeta ? Math.max(0, metaValor - vendidoAno) / mesesRestantes : null;

  res.json({
    mes,
    mes_faturamento_numero: mesFaturamentoNumero,
    valor_meta: meta?.valor_meta ?? null,
    faturamento_mes: faturamentoMes,
    vendido_ano: vendidoAno,
    pace_mensal: paceMensal,
    meses_restantes: mesesRestantes,
    clientes_visitados_mes: clientesVisitadosMes,
    km_rodados_mes: kmRodadosMes,
    clientes_ativos: statusContagens.ativo,
    clientes_inativos: statusContagens.inativo,
    clientes_desenvolvimento: statusContagens.desenvolvimento,
    clientes_convertidos: statusContagens.convertido,
  });
});

// --- RDV (rascunho de despesas/reembolso, futura integração com o portal Buntech) ---

router.get('/rdv', async (req, res) => {
  const { data, error } = await supabase.from('rdv').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/rdv', async (req, res) => {
  const { tipo, numero_pa, conta_contabil, quantidade, tipo_politica, politica, valor_total, centro_custo, observacao } = req.body;
  if (!conta_contabil) return res.status(400).json({ error: 'conta contábil é obrigatória' });
  if (valor_total == null || valor_total === '') return res.status(400).json({ error: 'valor total é obrigatório' });

  const { data, error } = await supabase
    .from('rdv')
    .insert({
      tipo: tipo || 'reembolso',
      numero_pa: numero_pa || null,
      conta_contabil,
      quantidade: quantidade || null,
      tipo_politica: tipo_politica || null,
      politica: politica || null,
      valor_total,
      centro_custo: centro_custo || 'PESQUISA AGRONEGOCIO',
      observacao: observacao || null,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/rdv/:id', async (req, res) => {
  const { status } = req.body;
  if (!['rascunho', 'enviado'].includes(status)) return res.status(400).json({ error: 'status inválido' });

  const { data, error } = await supabase
    .from('rdv')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/rdv/:id', async (req, res) => {
  const { error } = await supabase.from('rdv').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

router.post('/rdv/:id/comprovante', upload.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'arquivo é obrigatório' });

  const extensao = (req.file.originalname.split('.').pop() || 'pdf').toLowerCase();
  const caminho = `rdv-${req.params.id}-${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from('app-assets')
    .upload(caminho, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(caminho);

  const { data, error } = await supabase
    .from('rdv')
    .update({ comprovante_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
