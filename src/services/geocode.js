// Geocodificacao gratuita via Nominatim (OpenStreetMap). Uso leve/pessoal:
// respeita a politica do servico (1 req por vez, User-Agent identificado).
//
// addressdetails=1 traz de volta a cidade/estado que o Nominatim entendeu pra
// aquela consulta - sem isso não dá pra conferir se o pino caiu na cidade
// certa (um endereço mal escrito pode "achar" alguma coisa em outro estado).
export async function geocodificarEndereco(enderecoCompleto) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', enderecoCompleto);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'br');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'buntechagro-painel-vendas/1.0 (uso interno)' },
  });
  if (!res.ok) return null;

  const resultados = await res.json();
  if (!resultados.length) return null;

  const r = resultados[0];
  const endereco = r.address || {};
  return {
    latitude: Number(r.lat),
    longitude: Number(r.lon),
    // O Nominatim usa granularidades diferentes dependendo do lugar (cidade
    // grande vem em "city", cidade pequena às vezes só em "town"/"village"/
    // "municipality") - junta tudo que pode servir de nome de cidade.
    cidadeResolvida: endereco.city || endereco.town || endereco.village || endereco.municipality || endereco.county || '',
    estadoResolvido: endereco.state || '',
    enderecoCompleto: r.display_name || '',
  };
}

// Sigla -> nome completo do estado, pra montar uma consulta melhor pro
// Nominatim (ex: "Governador Valadares, Minas Gerais, Brasil" acha muito
// mais fácil que só a sigla).
export const NOME_ESTADO = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};
