-- Separa cargo e regiao (antes um so texto "Vendedor Junior - Minas Gerais") em
-- campos proprios, e adiciona a meta (valor grande, fica oculta na tela ate o
-- usuario revelar com Face ID/Touch ID do aparelho).
alter table configuracoes add column if not exists regiao text default 'Minas Gerais';
alter table configuracoes add column if not exists meta_valor numeric;

update configuracoes set
  cargo = 'Vendedor Júnior',
  regiao = 'Minas Gerais',
  meta_valor = 5000000
where id = 1;
