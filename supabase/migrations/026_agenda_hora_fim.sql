-- Hora de término do compromisso. Sem ela a agenda não consegue desenhar o
-- bloco na grade de horas (a altura do bloco = duração), que é como funciona
-- o Google Calendar / calendário do Teams.
alter table agenda_compromissos add column if not exists hora_fim time;

-- Compromissos que já existiam com hora de início viram blocos de 1 hora.
update agenda_compromissos
   set hora_fim = (hora + interval '1 hour')::time
 where hora is not null and hora_fim is null;
