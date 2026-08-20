-- Corrige "Bucket not found": a migracao 005 nao chegou a ser executada
-- (ou so parcialmente). Seguro rodar de novo mesmo que parte ja exista.

create table if not exists configuracoes (
  id int primary key default 1,
  icone_url text,
  capa_url text,
  foto_perfil_url text,
  updated_at timestamptz not null default now(),
  constraint configuracoes_singleton check (id = 1)
);

insert into configuracoes (id) values (1) on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;
