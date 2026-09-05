-- Meta (R$1,5mi) e meta_geral passam a ser valores fixos - o app nao deixa mais
-- editar (so muda rodando SQL). Vendido_base e o ponto de partida do que ja foi
-- vendido no ano antes de usar o app pra registrar negociacoes ganhas; o "vendido
-- anual" exibido no dashboard = vendido_base + soma das negociacoes ganhas do ano
-- (calculado ao vivo em /resumo). Pace_mensal deixa de ser guardado - passa a ser
-- calculado ao vivo (meta - vendido) / meses restantes no ano, entao muda sozinho
-- a cada venda registrada e vira o mes.
alter table configuracoes rename column vendido_total to vendido_base;
alter table configuracoes drop column if exists pace_mensal;
alter table configuracoes add column if not exists meta_geral numeric;

update configuracoes set
  meta_valor = 1500000,
  vendido_base = 808000,
  meta_geral = 35000000
where id = 1;
