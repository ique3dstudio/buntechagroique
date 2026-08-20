-- Rode este script no SQL Editor do seu projeto Supabase (o novo, exclusivo
-- para o congresso). Cria a tabela de respostas do formulário e protege o
-- acesso: qualquer pessoa pode ENVIAR uma resposta (insert), mas ninguém
-- consegue LER as respostas dos outros pelo app público (select bloqueado
-- para o público; só quem acessa o painel do Supabase com login vê os dados).

create table if not exists public.respostas_congresso (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null,
  empresa text not null,
  departamento text,
  email text not null,
  telefone text not null,
  cidade text not null,
  estado text not null,
  produto text,
  produto_outro text,
  comentarios text not null
);

alter table public.respostas_congresso enable row level security;

create policy "permitir insert publico"
  on public.respostas_congresso
  for insert
  to anon
  with check (true);

-- Nenhuma policy de select/update/delete é criada para "anon" de propósito:
-- isso impede que o site público consiga listar ou alterar respostas.
-- Para consultar os dados depois do congresso, use o Table Editor do
-- Supabase (com seu login) ou exporte via SQL Editor.

-- Contador simples de visitas: uma linha por vez que o app é aberto.
-- Mesma lógica de proteção: só insert público, ninguém de fora lê.
create table if not exists public.visitas_congresso (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.visitas_congresso enable row level security;

create policy "permitir insert publico"
  on public.visitas_congresso
  for insert
  to anon
  with check (true);

-- Para ver o total de visitas depois, rode no SQL Editor:
-- select count(*) from public.visitas_congresso;
