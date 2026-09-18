// Cliente da API do RD Station CRM (v1).
//
// Autenticação é um token de conta só, que vai na query string - não tem
// OAuth nem header de autorização. O token nunca aparece no código: sai de
// RD_STATION_TOKEN no ambiente (.env local, variável de ambiente no Render).
//
// Limite da API: 120 requisições por minuto. As funções de listagem paginam
// sozinhas e respeitam esse teto.

const BASE = 'https://crm.rdstation.com/api/v1';
const LIMITE_POR_MINUTO = 120;
const INTERVALO_MIN_MS = Math.ceil(60000 / LIMITE_POR_MINUTO); // ~500ms

let ultimaChamada = 0;

export function rdStationConfigurado() {
  return !!process.env.RD_STATION_TOKEN;
}

// Espaça as chamadas pra não estourar o limite da conta inteira - o RD conta
// por token, então uma rajada nossa derrubaria outras integrações do cliente.
async function respeitarLimite() {
  const espera = ultimaChamada + INTERVALO_MIN_MS - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaChamada = Date.now();
}

async function chamar(caminho, { metodo = 'GET', params = {}, corpo } = {}) {
  const token = process.env.RD_STATION_TOKEN;
  if (!token) throw new Error('RD_STATION_TOKEN não está configurado no ambiente.');

  const url = new URL(`${BASE}${caminho}`);
  url.searchParams.set('token', token);
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(chave, valor);
  }

  await respeitarLimite();

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch (erro) {
    throw new Error(`Não consegui falar com o RD Station: ${erro.message}`);
  }

  if (resposta.status === 401 || resposta.status === 403) {
    // 403 também é o que um proxy de saída devolve quando bloqueia o destino,
    // e aí a culpa não é do token. Carregar o corpo da resposta evita mandar
    // quem for depurar trocar um token que estava certo.
    const detalhe = await resposta.text().catch(() => '');
    throw new Error(
      `Acesso negado (${resposta.status}) ao chamar o RD Station. ` +
      `Pode ser token inválido ou a rede bloqueando crm.rdstation.com. Resposta: ${detalhe.slice(0, 200) || '(vazia)'}`
    );
  }
  if (resposta.status === 429) {
    throw new Error('Limite de requisições do RD Station atingido (120/min). Tente de novo em instantes.');
  }
  if (!resposta.ok) {
    // A mensagem de erro do RD vem em formatos diferentes por endpoint;
    // guarda o texto cru pra não perder a pista do que deu errado.
    const texto = await resposta.text().catch(() => '');
    throw new Error(`RD Station respondeu ${resposta.status}: ${texto.slice(0, 300)}`);
  }

  // DELETE costuma voltar sem corpo.
  const texto = await resposta.text();
  return texto ? JSON.parse(texto) : null;
}

// --- Leitura ---

export function verificarToken() {
  return chamar('/token/check');
}

// O RD devolve as listas dentro de uma chave que muda por recurso
// (deals, contacts, organizations), com total e paginação ao lado.
function extrairLista(resposta, chave) {
  if (Array.isArray(resposta)) return resposta;
  return resposta?.[chave] || [];
}

async function listarTudo(caminho, chave, params = {}, limitePaginas = 20) {
  const itens = [];
  for (let pagina = 1; pagina <= limitePaginas; pagina++) {
    const resposta = await chamar(caminho, { params: { ...params, page: pagina, limit: 200 } });
    const lote = extrairLista(resposta, chave);
    itens.push(...lote);
    if (lote.length < 200) break;
  }
  return itens;
}

export const listarNegociacoes = (params) => listarTudo('/deals', 'deals', params);
export const listarContatos = (params) => listarTudo('/contacts', 'contacts', params);
export const listarEmpresas = (params) => listarTudo('/organizations', 'organizations', params);

// --- Escrita ---

export const criarContato = (contato) => chamar('/contacts', { metodo: 'POST', corpo: { contact: contato } });
export const criarEmpresa = (empresa) => chamar('/organizations', { metodo: 'POST', corpo: { organization: empresa } });
export const criarNegociacao = (negociacao) => chamar('/deals', { metodo: 'POST', corpo: { deal: negociacao } });
