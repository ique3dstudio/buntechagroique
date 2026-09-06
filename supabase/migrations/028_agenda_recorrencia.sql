-- Compromissos recorrentes (reunião fixa toda sexta, visita quinzenal, etc).
--
-- Guarda UMA linha por série, com a regra de repetição, e a agenda projeta as
-- ocorrências na hora de exibir - do mesmo jeito que Google Calendar e Teams
-- fazem. Nada de encher a tabela com uma linha por semana.
--
-- recorrencia_excecoes guarda os dias em que a série foi cancelada só naquela
-- data ("essa semana não tem"), sem apagar a série inteira.

alter table agenda_compromissos add column if not exists recorrencia text;          -- null | semanal | quinzenal | mensal
alter table agenda_compromissos add column if not exists recorrencia_ate date;       -- null = sem data pra acabar
alter table agenda_compromissos add column if not exists recorrencia_excecoes date[] not null default '{}';

create index if not exists agenda_compromissos_recorrencia_idx
  on agenda_compromissos (recorrencia)
  where recorrencia is not null;
