-- Reunião fixa de alinhamento com o João (coordenador): toda sexta, 09:00-10:00.
-- Uma linha só - a agenda projeta as ocorrências de todas as sextas a partir
-- daqui. 2026-09-11 é a primeira sexta a partir de hoje.
--
-- Seguro rodar de novo: não duplica se a série já existir.

insert into agenda_compromissos
  (data, hora, hora_fim, tipo, titulo, motivo, descricao, status_confirmacao, recorrencia)
select
  '2026-09-11', '09:00', '10:00', 'reuniao',
  'Reunião de alinhamento com o João',
  'Alinhamento semanal',
  'João — coordenador',
  'confirmado',
  'semanal'
where not exists (
  select 1 from agenda_compromissos
   where recorrencia = 'semanal'
     and titulo = 'Reunião de alinhamento com o João'
);
