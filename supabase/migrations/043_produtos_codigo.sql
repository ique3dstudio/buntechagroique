-- Cada produto do catálogo TOTVS tem um código (ex: PAN01187) que identifica
-- a referência exata (embalagem, cor, peso). Guarda isso em "produtos" e já
-- carrega o catálogo atual, pra não precisar cadastrar item por item na mão.
alter table produtos add column if not exists codigo text;
create unique index if not exists produtos_codigo_key on produtos (codigo) where codigo is not null;

insert into produtos (codigo, nome) values
  ('PAN01187', 'SEEDGEL FR GRAF BIG BAG 1000KG'),
  ('PAN01201', 'SEEDGEL FR M BIGBAG 1000KG'),
  ('PAN01204', 'SEEDGEL FR BIGBAG 1000KG'),
  ('PAN01205', 'SEEDGEL FR SACO 25KG'),
  ('PAN01206', 'SEEDGEL FR M SACARIA 25KG'),
  ('PAN01219', 'SEEDGEL FR M BB 1000KG'),
  ('PAN01226', 'SEEDCOLOR AMARELO CAIXA 25KG'),
  ('PAN01228', 'SEEDCOLOR AZUL CAIXA 25KG'),
  ('PAN01229', 'SEEDCOLOR LARANJA CAIXA 25KG'),
  ('PAN01231', 'SEEDCOLOR PRETO CAIXA 25KG'),
  ('PAN01232', 'SEEDCOLOR VERDE CAIXA 25KG'),
  ('PAN01233', 'SEEDCOLOR VERMELHO CAIXA 25KG'),
  ('PAN01303', 'SEEDCOLOR LARANJA P BIGBAG 500KG'),
  ('PAN01304', 'SEEDCOLOR PRETO BIGBAG 500KG'),
  ('PAN01409', 'SEEDFLOW PRETO CAIXA 15KG'),
  ('PAN01412', 'SEEDFLOW AZUL CAIXA 15KG'),
  ('PAN01432', 'SEEDGRAF CAIXA 20KG'),
  ('PAN01433', 'SEEDGRAF BIG BAG 500KG'),
  ('PAN01462', 'SEEDFLOW PEROLA CAIXA 15KG'),
  ('PAN01463', 'SEEDFLOW PRETO GRAFITE CAIXA 15KG'),
  ('PAN01485', 'SEEDCOLOR LARANJA BIGBAG 500KG'),
  ('PAN01491', 'SEEDFLOW PRETO BIGBAG 500KG'),
  ('PAN01545', 'SEEDGEL FR PREMIUM BIG BAG 1000KG')
on conflict (codigo) do nothing;
