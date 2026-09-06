-- Aba "Agenda": compromissos/visitas com data, hora, cliente vinculado (pra
-- poder puxar coordenadas e montar rota no Mapa), motivo, etapa do funil e
-- descricao. cliente_id aponta pra "clientes" (nao pro "contatos" do CRM) --
-- e o cadastro com endereco/lat/lng usado no Mapa.

create table if not exists agenda_compromissos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  hora time,
  tipo text not null default 'visita', -- visita, reuniao, ligacao, outro
  titulo text,
  cliente_id uuid references clientes(id) on delete set null,
  localizacao text,
  motivo text,
  etapa_funil text,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agenda_compromissos_data_idx on agenda_compromissos (data);
