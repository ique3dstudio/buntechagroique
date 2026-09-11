-- O campo "Site" (migração 032) passa a ser do tipo "link": a Carteira
-- mostra ele como um link clicável em vez de texto solto.

update campos_clientes set tipo = 'link' where chave = 'site';
