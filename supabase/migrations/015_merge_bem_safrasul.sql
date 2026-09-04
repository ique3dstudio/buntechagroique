-- "Sementes Bem" e "Safrasul Sementes" sao o mesmo grupo empresarial (mesma raiz de
-- CNPJ 02.498.157, achado em busca na web - ja sinalizado na migracao 014). Confirmado
-- pelo usuario. Mescla os dois num so cadastro, mantendo o id de "Safrasul Sementes"
-- (que ja tem o historico_vendas importado da planilha forecast, com endereco de maior
-- confianca), priorizando os dados mais recentes da planilha forecast.
-- Merge via "||" (nao substitui o objeto inteiro) pra preservar produto_principal e
-- data_ultima_compra que a migracao 014 ja tinha calculado pro Safrasul a partir do
-- historico_vendas.
update clientes set
  dados = dados || jsonb_build_object(
    'responsavel', 'Ricardo Fonseca',
    'contato', '(38) 99993-2293',
    'situacao', 'Inativo',
    'observacoes', 'Vini está conversando. Está interessado no Seedgel Black.',
    'visitado', 'Não',
    'nome_fantasia', 'Bem Industrias de Sementes Ltda',
    'meses_sem_comprar', '12',
    'ultima_compra_geral', '2024-01-30',
    'produto_principal_parado', 'SEEDGEL FR M BB 1000KG',
    'observacao_forecast', 'Cadastro mesclado com "Sementes Bem" em 2026-09-04 - mesmo grupo empresarial (raiz de CNPJ 02.498.157 em comum), confirmado pelo usuário.'
  ),
  updated_at = now()
where nome = 'Safrasul Sementes';

delete from clientes where nome = 'Sementes Bem';
