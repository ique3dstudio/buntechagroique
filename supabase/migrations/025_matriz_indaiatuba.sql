-- Ponto de partida das rotas: a matriz da Buntech, em Indaiatuba/SP. Aparece
-- no Mapa com um icone diferente dos clientes (nao e cliente, e a empresa).
-- Endereco achado via busca na web (Receita Federal / paginas de cadastro
-- empresarial) - se a geocodificacao nao achar esse endereco exato, ajuste
-- matriz_endereco (ou preencha matriz_latitude/matriz_longitude direto) e o
-- proximo carregamento do mapa tenta geocodificar de novo.
alter table configuracoes add column if not exists matriz_nome text;
alter table configuracoes add column if not exists matriz_endereco text;
alter table configuracoes add column if not exists matriz_latitude numeric;
alter table configuracoes add column if not exists matriz_longitude numeric;

update configuracoes set
  matriz_nome = coalesce(matriz_nome, 'Buntech Agro (matriz)'),
  matriz_endereco = coalesce(matriz_endereco, 'Rua Roque Reinaldo Frias, 1421, Recreio Campestre Jóia, Indaiatuba - SP, 13347-035')
where id = 1;
