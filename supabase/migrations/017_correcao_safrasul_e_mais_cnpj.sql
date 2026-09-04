-- Correcao: a "Safrasul Sementes" do vendedor e a filial de Montes Claros/MG (nao a
-- matriz de Campo Grande/MS que a busca anterior tinha confirmado por engano) -
-- confirmado pelo usuario. Mesmo grupo (raiz de CNPJ 02.498.157), filial diferente.
update clientes set
  endereco = 'Av. Governador Magalhães Pinto, 2191 - Alcides Rabelo, 39401-427',
  latitude = -16.7094243,
  longitude = -43.8432195,
  dados = dados || jsonb_build_object('cnpj', '02.498.157/0007-00', 'cidade', 'Montes Claros'),
  updated_at = now()
where nome = 'Safrasul Sementes';

-- Mais um CNPJ confirmado em busca na web.
update clientes set dados = dados || jsonb_build_object('cnpj', '09.644.458/0001-58', 'nome_fantasia', 'Chapadão Agro'), updated_at = now() where nome = 'Sementes Chapadão';
