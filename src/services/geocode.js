// Geocodificacao gratuita via Nominatim (OpenStreetMap). Uso leve/pessoal:
// respeita a politica do servico (1 req por vez, User-Agent identificado).
export async function geocodificarEndereco(enderecoCompleto) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', enderecoCompleto);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'br');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'buntechagro-painel-vendas/1.0 (uso interno)' },
  });
  if (!res.ok) return null;

  const resultados = await res.json();
  if (!resultados.length) return null;

  return { latitude: Number(resultados[0].lat), longitude: Number(resultados[0].lon) };
}
