-- Novo campo na Carteira: Site.
--
-- Mesmo mecanismo da migração 030 (código/e-mail): a Carteira monta a ficha
-- a partir da tabela campos_clientes, então basta cadastrar o campo aqui -
-- ele já aparece na ficha do cliente e no formulário de novo cliente, sem
-- mexer no app. Fica no fim da lista (ordem 26 - depois de "Produto
-- principal", que hoje é o maior valor).

insert into campos_clientes (chave, rotulo, tipo, opcoes, ordem) values
  ('site', 'Site', 'texto', null, 26)
on conflict (chave) do nothing;
