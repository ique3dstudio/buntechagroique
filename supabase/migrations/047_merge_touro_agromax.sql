-- "Touro Sementes" e "Agromax" são a mesma empresa, em dois CNPJs diferentes.
-- Confirmado pelo usuário. Fica só o cadastro do Agromax, que manda em tudo
-- que os dois tinham preenchido.
--
-- Do lado da Touro só sobrevive o que foi pedido: código, razão social, CNPJ,
-- contatos e o histórico/forecast de vendas. Como são CNPJs diferentes, esses
-- dados não se misturam com os do Agromax - entram identificados:
--   * código/razão social/CNPJ da Touro viram os campos "(2º CNPJ)" na ficha;
--   * cada linha do histórico guarda em qual CNPJ a venda foi faturada.
--
-- O resto da Touro (pedidos, negociações, compromissos, tarefas, visitas,
-- propostas e follow-ups) é apagado junto com o cadastro dela.

-- 1) De qual CNPJ é cada linha do histórico/forecast.
alter table historico_vendas add column if not exists cnpj_origem text;

-- 2) Campos do 2º CNPJ na ficha da Carteira. A ficha é montada a partir de
--    campos_clientes, então basta cadastrar aqui que eles já aparecem.
insert into campos_clientes (chave, rotulo, tipo, opcoes, ordem) values
  ('codigo_2', 'Código (2º CNPJ)', 'texto', null, 23),
  ('nome_fantasia_2', 'Razão social (2º CNPJ)', 'texto', null, 24),
  ('cnpj_2', 'CNPJ/CPF (2º CNPJ)', 'documento', null, 25)
on conflict (chave) do nothing;

-- 3) A mesclagem.
do $$
declare
  id_agromax uuid;
  id_touro uuid;
  cnpj_agromax text;
  cnpj_touro text;
  dados_touro jsonb;
  contatos_touro jsonb;
  contatos_final jsonb;
begin
  select id, dados->>'cnpj' into id_agromax, cnpj_agromax
    from clientes where nome ilike '%agromax%' order by nome limit 1;
  select id, dados, contatos into id_touro, dados_touro, contatos_touro
    from clientes where nome ilike '%touro%' order by nome limit 1;

  if id_agromax is null then raise exception 'Não achei o cliente Agromax na carteira.'; end if;

  -- Sem Touro na carteira a mesclagem já rodou antes: sai quieto em vez de
  -- quebrar, pra migração poder ser reaplicada junto com as outras.
  if id_touro is null then
    raise notice 'Touro já não está na carteira - mesclagem já feita, nada a fazer.';
    return;
  end if;

  cnpj_touro := nullif(dados_touro->>'cnpj', '');

  -- 3a) Marca o histórico que já era do Agromax com o CNPJ dele.
  update historico_vendas
     set cnpj_origem = coalesce(cnpj_agromax, 'Agromax')
   where cliente_id = id_agromax and cnpj_origem is null;

  -- 3b) Traz o histórico/forecast da Touro, marcado com o CNPJ dela. Sem esse
  --     passo antes do delete, a cascata da FK levaria essas linhas embora.
  update historico_vendas
     set cliente_id = id_agromax,
         cnpj_origem = coalesce(cnpj_touro, 'Touro Sementes')
   where cliente_id = id_touro;

  -- 3c) Contatos dos dois na mesma lista, os do Agromax primeiro. Telefone
  --     repetido nos dois cadastros fica só uma vez, na versão do Agromax.
  select coalesce(jsonb_agg(c order by ord), '[]'::jsonb) into contatos_final
    from (
      select distinct on (c->>'telefone') c, ord from (
        select c, ord from clientes, jsonb_array_elements(clientes.contatos) with ordinality as t(c, ord)
         where clientes.id = id_agromax
        union all
        select c, ord + 1000 from jsonb_array_elements(coalesce(contatos_touro, '[]'::jsonb)) with ordinality as t(c, ord)
      ) todos
      order by c->>'telefone', ord
    ) unicos;

  -- 3d) Código, razão social e CNPJ da Touro entram como "2º CNPJ" - os do
  --     Agromax ficam como estão, que é a preferência pedida.
  update clientes set
    dados = dados || jsonb_strip_nulls(jsonb_build_object(
      'codigo_2', nullif(dados_touro->>'codigo', ''),
      'nome_fantasia_2', nullif(dados_touro->>'nome_fantasia', ''),
      'cnpj_2', cnpj_touro,
      'observacao_forecast', nullif(trim(
        coalesce(dados->>'observacao_forecast' || ' | ', '') ||
        'Cadastro mesclado com "Touro Sementes" - mesma empresa, CNPJ diferente. ' ||
        'Código, razão social e CNPJ da Touro estão nos campos "(2º CNPJ)"; no histórico ' ||
        'de vendas, a coluna CNPJ mostra em qual dos dois cada venda foi faturada.'
      ), '')
    )),
    contatos = contatos_final,
    updated_at = now()
  where id = id_agromax;

  -- 3e) Some com a Touro. O delete do cadastro leva junto, por cascata,
  --     visitas/propostas/follow-ups; o resto sai explícito porque a FK
  --     desses só zera o vínculo e deixaria registro órfão na base.
  delete from pedidos where cliente_id = id_touro;
  delete from negociacoes where cliente_id = id_touro;
  delete from agenda_compromissos where cliente_id = id_touro;
  delete from tarefas where cliente_id = id_touro;
  delete from clientes where id = id_touro;
end $$;
