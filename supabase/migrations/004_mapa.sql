-- Dados para o mapa de clientes: CNPJ, endereco e coordenadas geocodificadas
alter table empresas add column cnpj text;
alter table empresas add column endereco text;
alter table empresas add column latitude numeric;
alter table empresas add column longitude numeric;
