-- Conserta a matriz que não aparecia no mapa.
--
-- Duas causas: (1) o nome da rua tinha sido gravado errado ("Roque Reinaldo
-- Frias"; as fontes de cadastro empresarial trazem "Roque Medaldo Frias"), o
-- que fazia a geocodificação não achar nada; (2) sem coordenadas, o mapa
-- simplesmente omitia o pino.
--
-- Aqui o endereço é corrigido E as coordenadas de Indaiatuba são gravadas como
-- ponto de partida garantido. Se o pino não cair exatamente na empresa, ajuste
-- em Mapa > "Editar matriz" colando as coordenadas exatas do Google Maps.
--
-- Também recria as colunas se a migração 025 não tiver rodado - dá pra rodar
-- este arquivo sozinho.

alter table configuracoes add column if not exists matriz_nome text;
alter table configuracoes add column if not exists matriz_endereco text;
alter table configuracoes add column if not exists matriz_latitude numeric;
alter table configuracoes add column if not exists matriz_longitude numeric;

update configuracoes
   set matriz_nome = coalesce(matriz_nome, 'Buntech Agro (matriz)'),
       matriz_endereco = 'Rua Roque Medaldo Frias, 1341, Recreio Campestre Jóia, Indaiatuba - SP',
       matriz_latitude = coalesce(matriz_latitude, -23.0903),
       matriz_longitude = coalesce(matriz_longitude, -47.2181)
 where id = 1
   -- não sobrescreve um endereço que você já tenha corrigido na mão
   and coalesce(matriz_endereco, '') in (
     '',
     'Rua Roque Reinaldo Frias, 1421, Recreio Campestre Jóia, Indaiatuba - SP, 13347-035'
   );
