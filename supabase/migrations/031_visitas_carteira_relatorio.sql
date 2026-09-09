-- Visitas: apontar pra Carteira e virar relatório de visita.
--
-- 1) O formulário "Registrar visita" listava os contatos do CRM, que estão
--    vazios - por isso o campo Cliente não abria nenhuma opção. A visita passa
--    a apontar pra tabela "clientes" (a Carteira), que é o que se usa de fato.
--    contato_id continua existindo (agora opcional) pras visitas antigas.
--
-- 2) Campos do relatório de visita, pra gerar o PDF direto do app em vez de
--    escrever fora e anexar.
--
-- Este script se vira sozinho: se a tabela "visitas" nunca chegou a ser criada
-- neste banco (a migração 003 não rodou - era o erro 42P01 "relation visitas
-- does not exist"), ele cria a tabela já no formato novo.

create table if not exists visitas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  km numeric,
  observacoes text,
  created_at timestamptz not null default now()
);

-- Vínculo com a Carteira.
alter table visitas add column if not exists cliente_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.visitas'::regclass and conname = 'visitas_cliente_id_fkey'
  ) then
    alter table visitas
      add constraint visitas_cliente_id_fkey
      foreign key (cliente_id) references clientes(id) on delete cascade;
  end if;
end $$;

-- Visitas antigas ligadas ao CRM: a coluna passa a ser opcional. Em banco novo
-- ela nem existe - aí é criada (com a ligação com "contatos" só se essa tabela
-- existir), porque o app ainda mostra o nome do contato das visitas antigas.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'visitas' and column_name = 'contato_id'
  ) then
    alter table visitas add column contato_id uuid;
    if to_regclass('public.contatos') is not null then
      alter table visitas
        add constraint visitas_contato_id_fkey
        foreign key (contato_id) references contatos(id) on delete cascade;
    end if;
  else
    alter table visitas alter column contato_id drop not null;
  end if;
end $$;

-- Campos do relatório.
alter table visitas add column if not exists objetivo text;
alter table visitas add column if not exists participantes text;
alter table visitas add column if not exists relato text;
alter table visitas add column if not exists proximos_passos text;
alter table visitas add column if not exists anexo_url text;
alter table visitas add column if not exists anexo_nome text;

create index if not exists visitas_cliente_idx on visitas (cliente_id);
