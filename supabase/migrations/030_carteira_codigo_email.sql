-- Dois campos novos na Carteira: código do cliente e e-mail.
--
-- A Carteira monta a ficha a partir da tabela campos_clientes, então basta
-- cadastrar os campos aqui - eles já aparecem na ficha do cliente e no
-- formulário de novo cliente, sem mexer no app.
--
-- Ordem: "Código" abre a ficha (é o identificador) e o e-mail fica colado no
-- telefone. A posição 4 está livre desde que o campo "Produto" saiu.

update campos_clientes set ordem = 4 where chave = 'contato';

insert into campos_clientes (chave, rotulo, tipo, opcoes, ordem) values
  ('codigo', 'Código', 'texto', null, 0),
  ('email', 'E-mail', 'texto', null, 5)
on conflict (chave) do nothing;
