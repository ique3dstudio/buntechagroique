-- Completa CNPJ e nome fantasia de clientes com informacoes reais achadas na web
-- (Receita Federal / Serasa Experian / Econodata / sites oficiais), cruzando nome +
-- cidade + endereco ja cadastrados pra confirmar que e a empresa certa. Clientes que
-- parecem ser pessoa fisica (nao encontrada em base publica de CNPJ) ficaram de fora
-- de proposito - CPF de pessoa fisica nao e uma busca apropriada de se fazer.

update clientes set dados = dados || jsonb_build_object('cnpj', '03.675.216/0001-45', 'nome_fantasia', 'Sementes Valeminas Bonanza'), updated_at = now() where nome = 'Vale de Minas';
update clientes set dados = dados || jsonb_build_object('cnpj', '21.837.067/0001-55'), updated_at = now() where nome = 'Sementes Germiplanta';
update clientes set dados = dados || jsonb_build_object('cnpj', '60.680.469/0001-40', 'nome_fantasia', 'Semensol Sementes'), updated_at = now() where nome = 'Sementes Semensol';
update clientes set dados = dados || jsonb_build_object('cnpj', '05.814.680/0001-09'), updated_at = now() where nome = 'Sementes Grão de Ouro';
update clientes set dados = dados || jsonb_build_object('cnpj', '96.267.075/0001-02', 'nome_fantasia', 'Pontal Brasil'), updated_at = now() where nome = 'Sementes Pontal';
update clientes set dados = dados || jsonb_build_object('cnpj', '22.791.346/0001-98'), updated_at = now() where nome = 'Agro Samatelli / Pastotech';
update clientes set dados = dados || jsonb_build_object('cnpj', '02.498.157/0001-14'), updated_at = now() where nome = 'Safrasul Sementes';
update clientes set dados = dados || jsonb_build_object('cnpj', '37.536.291/0001-47'), updated_at = now() where nome = 'AG Croppers';
update clientes set dados = dados || jsonb_build_object('cnpj', '12.478.250/0001-10', 'nome_fantasia', 'BRSEEDS Sementes'), updated_at = now() where nome = 'BR Seeds';
update clientes set dados = dados || jsonb_build_object('cnpj', '14.380.314/0001-71'), updated_at = now() where nome = 'Sementes Certa';
update clientes set dados = dados || jsonb_build_object('cnpj', '47.618.137/0001-78'), updated_at = now() where nome = 'Sementes Forte';
update clientes set dados = dados || jsonb_build_object('cnpj', '05.737.282/0003-90'), updated_at = now() where nome = 'Futura Agronegócios';
update clientes set dados = dados || jsonb_build_object('cnpj', '58.525.668/0001-32'), updated_at = now() where nome = 'Seprotec';
update clientes set dados = dados || jsonb_build_object('cnpj', '05.671.783/0008-25'), updated_at = now() where nome = 'Agromax';
update clientes set dados = dados || jsonb_build_object('cnpj', '09.576.637/0001-03'), updated_at = now() where nome = 'Sementes Gerplant';
update clientes set dados = dados || jsonb_build_object('cnpj', '43.256.498/0002-41', 'nome_fantasia', 'Sementes Nasce Bem'), updated_at = now() where nome = 'Agrocel (Nasce bem)';
update clientes set dados = dados || jsonb_build_object('cnpj', '04.984.476/0001-65', 'nome_fantasia', 'S J Rações São João Agropecuária'), updated_at = now() where nome = 'SJ Rações';
update clientes set dados = dados || jsonb_build_object('cnpj', '18.560.813/0001-00', 'cidade', 'Chapada Gaúcha', 'nome_fantasia', 'Cooperativa Agropecuária Pioneira'), updated_at = now() where nome = 'COOAPI';
update clientes set dados = dados || jsonb_build_object('cnpj', '19.811.959/0001-35', 'cidade', 'Uberlândia'), updated_at = now() where nome = 'Sementes Cabral';
update clientes set dados = dados || jsonb_build_object('cidade', 'Montes Claros', 'nome_fantasia', 'Cooperativa Grande Sertão'), updated_at = now() where nome = 'Grande Sertão';
