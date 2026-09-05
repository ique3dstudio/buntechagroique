-- Meta deixa de ficar escondida atras de Face ID (o vendedor quer ela visivel).
-- Adiciona vendido_total (quanto ja foi vendido no ano, informado manualmente - o
-- app ainda nao tem integracao de vendas em tempo real) e pace_mensal (quanto
-- precisa vender por mes pra bater a meta ate o fim do ano).
alter table configuracoes add column if not exists vendido_total numeric;
alter table configuracoes add column if not exists pace_mensal numeric;

update configuracoes set
  meta_valor = 1500000,
  vendido_total = 808000,
  pace_mensal = 138240
where id = 1;
