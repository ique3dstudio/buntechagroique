-- Configuracoes visuais do app: icone (favicon/tela inicial), capa e foto de perfil.
-- Registro unico (id sempre 1).
create table configuracoes (
  id int primary key default 1,
  icone_url text,
  capa_url text,
  foto_perfil_url text,
  updated_at timestamptz not null default now(),
  constraint configuracoes_singleton check (id = 1)
);

insert into configuracoes (id) values (1) on conflict (id) do nothing;

-- Bucket publico para guardar essas imagens (upload feito pelo backend com a
-- service_role key; leitura publica direta pela URL, sem precisar de policy).
insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;
