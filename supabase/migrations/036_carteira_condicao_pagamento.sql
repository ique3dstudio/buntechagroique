-- Novo campo na Carteira: Condição de pagamento (mesmo mecanismo do "Site" -
-- migração 032). Fica no fim da ficha, depois do "Site" (ordem 26).

insert into campos_clientes (chave, rotulo, tipo, opcoes, ordem) values
  ('condicao_pagamento', 'Condição de pagamento', 'texto', null, 27)
on conflict (chave) do nothing;
