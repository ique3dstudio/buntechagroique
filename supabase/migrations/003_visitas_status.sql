-- Registro de visitas em campo (para a aba Inicio: clientes visitados e km rodados)
create table visitas (
  id uuid primary key default gen_random_uuid(),
  contato_id uuid not null references contatos(id) on delete cascade,
  data date not null,
  km numeric,
  observacoes text,
  created_at timestamptz not null default now()
);

-- O status de contato passa a ser: desenvolvimento, ativo, inativo, convertido
update contatos set status = 'desenvolvimento' where status = 'lead';
