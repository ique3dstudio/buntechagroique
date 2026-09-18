-- Três ajustes na ficha da Carteira:
--
-- 1) "Condição de pagamento" vira select com as mesmas opções (códigos
--    TOTVS) que já existem no formulário de Criar Pedido, em vez de texto
--    livre — evita grafia divergente entre a ficha e o pedido lançado.
update campos_clientes
set tipo = 'selecao',
    opcoes = array[
      '200 - 20/80 - DDL',
      '500 - 00 - A VISTA',
      '501 - 00/14/28 - DDL',
      '502 - 00/30 - DDL',
      '503 - 00/30/60 - DDL',
      '504 - 00/30/60/90 - DDL',
      '505 - 00/30/60/90/120 - DDL',
      '541 - 75 - DDL',
      '542 - 90 - DDL',
      '543 - 92 - DDL',
      '544 - 120 - DDL',
      '545 - 30/60/90/120 - DDL',
      '546 - 35 - DDL',
      '547 - 30/45 - DDL'
    ]
where chave = 'condicao_pagamento';

-- 2) "Produto principal" vira select com o catálogo de produtos (mesma
-- lista usada no Orçamento/Criar Pedido) em vez de texto livre. Tipo
-- próprio ("produto") porque a lista é dinâmica (tabela produtos), não um
-- conjunto fixo de opções como o "selecao" comum.
update campos_clientes set tipo = 'produto' where chave = 'produto_principal';

-- 3) "Produto principal (parado)" sai da ficha - só sobra o "Produto
-- principal" de cima.
delete from campos_clientes where chave = 'produto_principal_parado';
update clientes set dados = dados - 'produto_principal_parado';

-- 4) "Volume (ton/ano)" vira "Ritmo (Ton/Mês)" (só o rótulo muda).
update campos_clientes set rotulo = 'Ritmo (Ton/Mês)' where chave = 'volume_ton_ano';
