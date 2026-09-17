-- Tarefas do dia: cliente vinculado e prioridade.
--
-- A prioridade aparece só como emoji na lista (🔥 alta, 💧 média, ❄️ baixa) e
-- manda na ordenação - as altas ficam sempre no topo.

alter table tarefas add column if not exists cliente_id uuid references clientes(id) on delete set null;
alter table tarefas add column if not exists prioridade text not null default 'media';

alter table tarefas drop constraint if exists tarefas_prioridade_check;
alter table tarefas add constraint tarefas_prioridade_check
  check (prioridade in ('alta', 'media', 'baixa'));
