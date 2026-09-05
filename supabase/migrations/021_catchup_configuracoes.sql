-- Migracao de "recuperacao": deixa a tabela configuracoes em dia independente de
-- quais das migracoes 009/013/018/019 ja rodaram antes (o erro "column
-- configuracoes.meta_valor does not exist" mostra que pelo menos uma delas nao
-- chegou a rodar). Segura de rodar de novo, nao importa o estado atual.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'configuracoes' and column_name = 'vendido_total'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'configuracoes' and column_name = 'vendido_base'
  ) then
    alter table configuracoes rename column vendido_total to vendido_base;
  end if;
end $$;

alter table configuracoes add column if not exists cargo text default 'Vendedor Júnior';
alter table configuracoes add column if not exists regiao text default 'Minas Gerais';
alter table configuracoes add column if not exists numero_vendedor text;
alter table configuracoes add column if not exists matricula text;
alter table configuracoes add column if not exists celular text;
alter table configuracoes add column if not exists meta_valor numeric;
alter table configuracoes add column if not exists meta_geral numeric;
alter table configuracoes add column if not exists vendido_base numeric;
alter table configuracoes drop column if exists pace_mensal;

update configuracoes set
  cargo = coalesce(cargo, 'Vendedor Júnior'),
  regiao = coalesce(regiao, 'Minas Gerais'),
  meta_valor = coalesce(meta_valor, 1500000),
  meta_geral = coalesce(meta_geral, 35000000),
  vendido_base = coalesce(vendido_base, 808000)
where id = 1;
