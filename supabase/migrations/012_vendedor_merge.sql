-- Dados do vendedor, exibidos junto ao cargo no cabecalho do perfil.
alter table configuracoes add column if not exists numero_vendedor text;
alter table configuracoes add column if not exists matricula text;
alter table configuracoes add column if not exists celular text;

update configuracoes set
  numero_vendedor = '3281',
  matricula = '12665',
  celular = '(11) 91741-2544'
where id = 1;

-- "Pastotech" e "Agro Samatelli Comercio e Producao de Sementes Ltda." sao a mesma
-- empresa (confirmado pelo usuario). Mescla os dois cadastros num so, mantendo o id
-- de "Pastotech" (que ja carrega o historico_vendas importado da planilha forecast),
-- com nome e dados priorizando a planilha forecast (a tabela mais recente enviada).
update historico_vendas set cliente_nome = 'Agro Samatelli / Pastotech'
  where cliente_id = (select id from clientes where nome = 'Pastotech');

update clientes set
  nome = 'Agro Samatelli / Pastotech',
  dados = jsonb_build_object(
    'responsavel', 'Pedro Henrique',
    'contato', '(34) 99829-9921',
    'porte', 'Grande',
    'situacao', 'Ativo',
    'observacoes', 'OK. CRM do Alexandre: Comprou conosco.',
    'visitado', 'Não',
    'funil', 'Recorrente',
    'alerta_financeiro', 'Regularizar financeiro + Limite prestes a vencer',
    'observacao_forecast', 'Cadastro mesclado com "Agro Samatelli Comercio e Producao de Sementes Ltda." em 04/09/2026 - mesma empresa (confirmado pelo usuário).'
  ),
  updated_at = now()
where nome = 'Pastotech';

delete from clientes where nome = 'Agro Samatelli Comercio e Producao de Sementes Ltda.';
