-- Estrutura inicial: clientes, propostas, follow_ups e metas.
-- Ja executada manualmente no SQL Editor do Supabase; mantida aqui so como
-- historico (a 002_crm.sql renomeia/expande essas tabelas).

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  telefone text,
  email text,
  status text not null default 'lead',
  observacoes text,
  created_at timestamptz not null default now()
);

create table propostas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo text not null,
  valor numeric,
  status text not null default 'em_andamento',
  data_prevista date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  descricao text not null,
  data date not null,
  concluido boolean not null default false,
  created_at timestamptz not null default now()
);

create table metas (
  id uuid primary key default gen_random_uuid(),
  mes date not null,
  valor_meta numeric not null,
  created_at timestamptz not null default now()
);
