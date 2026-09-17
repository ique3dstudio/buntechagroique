-- Checklist simples do dia, em cima da Agenda: adicionar tarefa e marcar
-- como concluída ao longo do dia. Sem data/hora - é só uma lista corrida.
create table if not exists tarefas (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);
