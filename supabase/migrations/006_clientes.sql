-- Aba "Clientes": tabela com esquema flexivel (campos dinamicos via jsonb),
-- espelhando as colunas da planilha "Clientes Minas Gerais" do usuario, com
-- endereco/lat/lng ja preparados para a integracao futura com o Mapa.

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  latitude numeric,
  longitude numeric,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Definicao dos campos dinamicos (a "estrutura da planilha"). Adicionar uma
-- nova linha aqui = adicionar uma nova coluna pro usuario preencher, sem
-- precisar alterar a tabela clientes.
create table campos_clientes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  rotulo text not null,
  tipo text not null default 'texto', -- texto, texto_longo, numero, data, selecao
  opcoes text[],
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

insert into campos_clientes (chave, rotulo, tipo, opcoes, ordem) values
  ('responsavel', 'Responsável', 'texto', null, 1),
  ('cidade', 'Cidade', 'texto', null, 2),
  ('equipamento', 'Equipamento', 'texto', null, 3),
  ('produto', 'Produto', 'texto', null, 4),
  ('contato', 'Contato', 'texto', null, 5),
  ('porte', 'Porte', 'selecao', array['Pequeno','Médio','Grande'], 6),
  ('situacao', 'Situação', 'selecao', array['Ativo','Desenvolvimento','Inativo'], 7),
  ('observacoes', 'Observações', 'texto_longo', null, 8),
  ('visitado', 'Visitado', 'selecao', array['Sim','Não'], 9),
  ('atualizacao', 'Atualização', 'texto_longo', null, 10),
  ('feedback', 'Feedback', 'texto', null, 11),
  ('data_ultima_compra', 'Data última compra', 'data', null, 12),
  ('volume_ton_ano', 'Volume (ton/ano)', 'numero', null, 13),
  ('faturamento', 'Faturamento', 'numero', null, 14),
  ('data_ultimo_contato', 'Data último contato', 'data', null, 15),
  ('potencial_estimado_ton_ano', 'Potencial estimado (ton/ano)', 'numero', null, 16);

-- Os 36 clientes da aba "Clientes Minas Gerais" da planilha enviada
-- (ignorando "Demais Carteiras" e um bloco de totais no fim da planilha).
insert into clientes (nome, dados) values
('SJ Rações', jsonb_build_object('responsavel', 'Adriano Almeida (Gerente) e Beto (Dono)', 'cidade', 'Itanhomi', 'equipamento', 'Betoneira', 'produto', 'Seedgel FR', 'contato', '(33) 98867-8204', 'porte', 'Pequeno', 'situacao', 'Ativo', 'observacoes', 'Cliente novo, comprou 9 toneladas de Seedgel FR e quer que ensine a aplicar (Data prevista: 14/07)', 'visitado', 'Sim', 'atualizacao', 'Foi ensinado todo o processo de revestimento ao responsável e aos funcionários. Solicitaram amostra de seedcolor Azul (da cor da marca)', 'feedback', '😍 Cliente gostou e elogiou')),
('LPC Sementes', jsonb_build_object('responsavel', 'Paulinho da mata', 'cidade', 'Governador Valadares', 'equipamento', 'Coater', 'contato', '(33) 99126-0011', 'situacao', 'Ativo', 'observacoes', 'Clarent está tentando entrar. Cliente já tinha uma máquina, agora comprou outra.', 'visitado', 'Não')),
('Vale de Minas', jsonb_build_object('responsavel', 'Pedro (Dono)', 'cidade', 'Montes Claros', 'equipamento', 'Betoneira', 'produto', 'Seedgel FR', 'contato', '(38) 99168-0061', 'porte', 'Pequeno', 'situacao', 'Ativo', 'observacoes', 'Interessado em Seedcolor, solicitou amostras para testes. Está com dificuldades em revestir Mombaça, solicitou suporte.', 'visitado', 'Sim', 'atualizacao', 'Problema de Mombaça resolvido. Aplicação de seedcolor foi eficiente, cliente gostou e vai fechar pedido. Tem problema com frete, quer tentar conjulgar carga e pedir um pouco toda semana.', 'feedback', '😍 Cliente gostou e elogiou')),
('Filipe (Itanhandu)', jsonb_build_object('responsavel', 'Filipe', 'cidade', 'Itanhandu', 'contato', '(35) 99111-0221', 'situacao', 'Desenvolvimento', 'observacoes', 'Queria negociar uma carga', 'visitado', 'Não')),
('Agromax', jsonb_build_object('responsavel', 'Max Dias (Dono)', 'cidade', 'Brasília de Minas', 'equipamento', 'Coater', 'produto', 'Seedgel FR', 'contato', '(38) 99992-5508', 'situacao', 'Ativo', 'observacoes', 'Comprou mês passado', 'visitado', 'Não', 'atualizacao', 'Também faz a própria mistura segundo o Pedro')),
('Pastotech', jsonb_build_object('responsavel', 'Pedro Henrique', 'contato', '(34) 99829-9921', 'porte', 'Grande', 'situacao', 'Ativo', 'observacoes', 'OK', 'visitado', 'Não')),
('Sementes Bem', jsonb_build_object('responsavel', 'Ricardo Fonseca', 'contato', '(38) 99993-2293', 'situacao', 'Inativo', 'observacoes', 'Está interessado no Seedgel Black', 'visitado', 'Não')),
('Sementes Papaléguas', jsonb_build_object('situacao', 'Ativo', 'visitado', 'Não')),
('Maykel Humberto', jsonb_build_object('situacao', 'Ativo', 'visitado', 'Não')),
('Grafterra', jsonb_build_object('situacao', 'Ativo', 'visitado', 'Não')),
('J&M Plantar', jsonb_build_object('situacao', 'Ativo', 'visitado', 'Não')),
('Sementes Schmitz', jsonb_build_object('cidade', 'Chapada Gaúcha', 'situacao', 'Ativo', 'visitado', 'Não')),
('Safrasul Sementes', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'Vini está conversando.', 'visitado', 'Não')),
('Olevino', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Não encontrou nada na internet desse cliente.', 'visitado', 'Não')),
('Germinar', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Não encontrei nada no endereço que achei no Econodata.', 'visitado', 'Não')),
('Sementes Gerplant', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Cliente já comprou da gente no passado mas o preço estava alto, hoje compra das pedras congonhas e paga 635/ton + 125/ton de frete.
Consumo de 300 ton na safra', 'visitado', 'Não')),
('Sementes Barbosa', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Cliente comprou 50TON em 2024, mas em 2025 não fez compra nenhuma. Tentou visita mas ele não estava.', 'visitado', 'Não')),
('Sementes Germiplanta', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Cliente hoje não faz revestimento de nenhuma semente e também não utiliza grafite. Em nova visita, cogitou a possibilidade de revestir.', 'visitado', 'Não')),
('Agroforte Sementes', jsonb_build_object('cidade', 'Chapada Gaúcha', 'situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Não encontrei nada no endereço que achei no Econodata', 'visitado', 'Não')),
('Grande Sertão', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Empresa do ramo de polpa de suco .', 'visitado', 'Não')),
('Sementes Serra Verde', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Sem retorno do Alê no CRM', 'visitado', 'Não')),
('Sementes Chapadão', jsonb_build_object('cidade', 'Chapada Gaúcha', 'situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Conheceu uns dos donos, hoje não fazem revestimento de semente.', 'visitado', 'Não')),
('AG Croppers', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Cliente hoje não faz nenhum tipo de revestimento, ainda não conseguiu uma visita presencial, apenas por telefone.', 'visitado', 'Não')),
('Agropecuaria Vila Verde', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Não encontrei nada no endereço que encontrei no Econodata', 'visitado', 'Não')),
('COOAPI', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Cooperativa hoje tem foco maior em venda de sementes nuas.', 'visitado', 'Não')),
('Sementes Cabral', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Cliente é uma agropecuaria de venda de produtos, não possuem nenhuma produção ou beneficiamento de forrageiras.', 'visitado', 'Não')),
('Sementes Grão de Ouro', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Sem retorno do Alê no CRM', 'visitado', 'Não')),
('Sementes Nelore', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Não existe mais, Paulo da LPC disse que comprou alguns maquinários dessa empresa quando fechou.', 'visitado', 'Não')),
('Sementes Semensol', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Cliente hoje trabalha apenas com soja e milho.', 'visitado', 'Não')),
('Sementes Triangulo', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Empresa hoje trabalha com Silicato, tive um bom contato inicial, mas ainda não com o tomador de decisão.', 'visitado', 'Não')),
('Agrocel (Nasce bem)', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Mudou de SP', 'visitado', 'Não')),
('Antonio Mendonça dos Santos', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Cliente não localizado no endereço, nem nenhuma estrutura na região.', 'visitado', 'Não')),
('M.G.V. Agroindustrial ltda', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Cliente de beneficiamento de amendoim.', 'visitado', 'Não')),
('Minas Seeds', jsonb_build_object('situacao', 'Inativo', 'observacoes', 'CRM do Alexandre: Ficou sabendo dessa empresa em Patrocínio, mas em contato com o dono, hoje todo o revestimento é feito na Germimax em Tupaciguara.', 'visitado', 'Não')),
('Sementes Minas Brasil Comercio e Serviços ltda', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: No CRM está constado que vendeu R$5.100', 'visitado', 'Não')),
('Agro Samatelli Comercio e Producao de Sementes Ltda.', jsonb_build_object('situacao', 'Desenvolvimento', 'observacoes', 'CRM do Alexandre: Comprou conosco', 'visitado', 'Não'));
