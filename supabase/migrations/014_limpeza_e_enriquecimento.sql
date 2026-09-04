-- 1) Remove campos que o usuario nao quer mais na aba Clientes.
delete from campos_clientes where chave in ('produto', 'atualizacao', 'feedback', 'status_atividade');
update clientes set dados = dados - 'produto' - 'atualizacao' - 'feedback' - 'status_atividade';

-- 2) Novos campos: CNPJ, nome fantasia e produto principal (geral, nao so dos parados)
insert into campos_clientes (chave, rotulo, tipo, opcoes, ordem) values
  ('cnpj', 'CNPJ', 'texto', null, 23),
  ('nome_fantasia', 'Nome fantasia', 'texto', null, 24),
  ('produto_principal', 'Produto principal', 'texto', null, 25)
on conflict (chave) do nothing;

-- 3) Cidade e CNPJ completados com o que ja tinhamos da planilha forecast (Enderecos_Coordenadas)
-- mais o que foi confirmado agora em busca na web (Receita Federal / Google / redes sociais).
update clientes set dados = dados || jsonb_build_object('cidade', 'Governador Valadares', 'cnpj', '27.517.756/0001-69'), updated_at = now() where nome = 'LPC Sementes';
update clientes set dados = dados || jsonb_build_object('cidade', 'Montes Claros'), updated_at = now() where nome = 'Vale de Minas';
update clientes set dados = dados || jsonb_build_object('cidade', 'Brasilia de Minas'), updated_at = now() where nome = 'Agromax';
update clientes set dados = dados || jsonb_build_object('cidade', 'Tupaciguara'), updated_at = now() where nome = 'Agro Samatelli / Pastotech';
update clientes set dados = dados || jsonb_build_object('cidade', 'Araxa', 'cnpj', '36.814.648/0001-49', 'nome_fantasia', 'Sementes Grafterra'), updated_at = now() where nome = 'Grafterra';
update clientes set dados = dados || jsonb_build_object('cidade', 'Chapada Gaucha'), updated_at = now() where nome = 'Sementes Schmitz';
update clientes set dados = dados || jsonb_build_object('cidade', 'Campo Grande'), updated_at = now() where nome = 'Safrasul Sementes';
update clientes set dados = dados || jsonb_build_object('cidade', 'Curvelo'), updated_at = now() where nome = 'Germinar';
update clientes set dados = dados || jsonb_build_object('cidade', 'Curvelo'), updated_at = now() where nome = 'Sementes Gerplant';
update clientes set dados = dados || jsonb_build_object('cidade', 'Uberaba'), updated_at = now() where nome = 'Sementes Germiplanta';
update clientes set dados = dados || jsonb_build_object('cidade', 'Chapada Gaucha', 'cnpj', '15.596.136/0001-83'), updated_at = now() where nome = 'Sementes Serra Verde';
update clientes set dados = dados || jsonb_build_object('cidade', 'Chapada Gaucha'), updated_at = now() where nome = 'Sementes Chapadão';
update clientes set dados = dados || jsonb_build_object('cidade', 'Uberaba'), updated_at = now() where nome = 'AG Croppers';
update clientes set dados = dados || jsonb_build_object('cidade', 'Montes Claros'), updated_at = now() where nome = 'Sementes Grão de Ouro';
update clientes set dados = dados || jsonb_build_object('cidade', 'Tupaciguara'), updated_at = now() where nome = 'Sementes Semensol';
update clientes set dados = dados || jsonb_build_object('cidade', 'Uberlandia'), updated_at = now() where nome = 'Sementes Triangulo';
-- "Sementes Bem" pode ser o mesmo grupo empresarial da "Safrasul Sementes" ja cadastrada
-- (mesma raiz de CNPJ 02.498.157, achado em busca na web) - nao mesclei automaticamente
-- porque nao temos certeza se e o mesmo cliente/relacionamento comercial. Revisar manualmente.
update clientes set dados = dados || jsonb_build_object('cidade', 'Campo Grande', 'nome_fantasia', 'Safrasul Sementes', 'observacao_forecast', 'Possivel mesmo grupo empresarial que o cliente "Safrasul Sementes" (raiz de CNPJ 02.498.157 em comum, achado em busca na web) - confirmar antes de mesclar.'), updated_at = now() where nome = 'Sementes Bem';
update clientes set dados = dados || jsonb_build_object('cidade', 'Novo Cruzeiro (?)'), updated_at = now() where nome = 'Sementes Minas Brasil Comercio e Serviços ltda';
update clientes set dados = dados || jsonb_build_object('cidade', 'Aracatuba'), updated_at = now() where nome = 'BR Seeds';
update clientes set dados = dados || jsonb_build_object('cidade', 'Mirabela', 'cnpj', '14.847.482/0001-24'), updated_at = now() where nome = 'Da Mata Sementes';
update clientes set dados = dados || jsonb_build_object('cidade', 'Alvares Machado'), updated_at = now() where nome = 'Sementes Certa';
update clientes set dados = dados || jsonb_build_object('cidade', 'Jaboticabal'), updated_at = now() where nome = 'Sementes Forte';
update clientes set dados = dados || jsonb_build_object('cidade', 'Alvares Machado', 'cnpj', '32.819.593/0001-09'), updated_at = now() where nome = 'Sementes Nigre';
update clientes set dados = dados || jsonb_build_object('cidade', 'Cosmorama (?)'), updated_at = now() where nome = 'Sementes Oliveira';
update clientes set dados = dados || jsonb_build_object('cidade', 'Presidente Prudente', 'nome_fantasia', 'Semenseed'), updated_at = now() where nome = 'Sementes Presidente';
update clientes set dados = dados || jsonb_build_object('cidade', 'Alvares Machado'), updated_at = now() where nome = 'Sementes Pontal';
update clientes set dados = dados || jsonb_build_object('cidade', 'Paracatu (?)'), updated_at = now() where nome = 'Sementes Progresso';
update clientes set dados = dados || jsonb_build_object('cidade', 'Rio Verde (?)'), updated_at = now() where nome = 'Sementes Vitória / Versori';
update clientes set dados = dados || jsonb_build_object('cidade', 'Ribeirao Preto'), updated_at = now() where nome = 'Seprotec';
update clientes set dados = dados || jsonb_build_object('cidade', 'Jales', 'cnpj', '49.651.409/0001-67', 'nome_fantasia', 'Xingu Sementes e Nutrição Animal'), updated_at = now() where nome = 'Xingu';
update clientes set dados = dados || jsonb_build_object('cidade', 'Governador Valadares', 'cnpj', '20.406.833/0001-64'), updated_at = now() where nome = 'Dumato Agro Ltda';
update clientes set dados = dados || jsonb_build_object('cidade', 'Perdizes', 'cnpj', '36.123.871/0001-40'), updated_at = now() where nome = 'Analyce Comercio de Sementes Ltda';
update clientes set dados = dados || jsonb_build_object('cidade', 'Uberlandia'), updated_at = now() where nome = 'Futura Agronegócios';
update clientes set dados = dados || jsonb_build_object('cidade', 'Chapada Gaúcha', 'cnpj', '31.740.124/0001-37'), updated_at = now() where nome = 'Agroforte Sementes';
update clientes set dados = dados || jsonb_build_object('cidade', 'Betim', 'cnpj', '22.463.491/0001-40'), updated_at = now() where nome = 'Agropecuaria Vila Verde';

-- 4) Produto principal (maior faturamento acumulado) e data da ultima compra, calculados a
-- partir do historico_vendas ja importado - só afeta quem tem historico (leads sem compra
-- ficam como estavam).
update clientes c set dados = c.dados || jsonb_build_object('produto_principal', h.produto), updated_at = now()
from (
  select distinct on (cliente_id) cliente_id, produto
  from historico_vendas
  where cliente_id is not null
  order by cliente_id,
    (coalesce(fat_2023, 0) + coalesce(fat_2024, 0) + coalesce(fat_2025, 0) + coalesce(fat_2026_janjul, 0)) desc
) h
where h.cliente_id = c.id;

update clientes c set dados = c.dados || jsonb_build_object('data_ultima_compra', to_char(h.max_data, 'YYYY-MM-DD')), updated_at = now()
from (
  select cliente_id, max(ultima_compra) as max_data
  from historico_vendas
  where cliente_id is not null and ultima_compra is not null
  group by cliente_id
) h
where h.cliente_id = c.id;
