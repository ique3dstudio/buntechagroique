-- "Filipe (Itanhandu)" e "Filipe Carlos Lopes (Verde Agro)" sao a mesma pessoa/cliente
-- (confirmado pelo usuario). Mescla os dois num so, mantendo o id de "Filipe Carlos
-- Lopes (Verde Agro)" (que ja tem o historico_vendas importado da planilha forecast).
update historico_vendas set cliente_nome = 'Filipe Carlos Lopes (Verde Agro)'
  where cliente_id = (select id from clientes where nome = 'Filipe Carlos Lopes (Verde Agro)');

update clientes set
  dados = dados || jsonb_build_object(
    'responsavel', 'Filipe',
    'cidade', 'Itanhandu',
    'contato', '(35) 99111-0221',
    'situacao', 'Desenvolvimento',
    'observacoes', 'Queria negociar uma carga.',
    'visitado', 'Não',
    'observacao_forecast', 'Cadastro mesclado com "Filipe (Itanhandu)" em 2026-09-05 - mesma pessoa/cliente, confirmado pelo usuário.'
  ),
  updated_at = now()
where nome = 'Filipe Carlos Lopes (Verde Agro)';

delete from clientes where nome = 'Filipe (Itanhandu)';
