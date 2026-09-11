-- Tira o campo "Produto principal (parado)" da Carteira - fica só "Produto
-- principal" (que já existia, cadastrado na migração 014).

delete from campos_clientes where chave = 'produto_principal_parado';
update clientes set dados = dados - 'produto_principal_parado';
