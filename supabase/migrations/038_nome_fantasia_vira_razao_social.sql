-- Troca o rótulo do campo "Nome fantasia" (migração 014) por "Razão social"
-- na ficha da Carteira. Mantém a mesma chave (nome_fantasia) pra não perder
-- o que já tá preenchido nos clientes.

update campos_clientes set rotulo = 'Razão social' where chave = 'nome_fantasia';
