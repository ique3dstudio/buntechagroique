-- Deslocamento agora tem categoria própria ("Viagem") em vez de cair em
-- "Outro". Reclassifica os compromissos de viagem que a migração 045 criou
-- antes da categoria existir.

update agenda_compromissos
   set tipo = 'viagem', updated_at = now()
 where tipo = 'outro'
   and (motivo = 'Deslocamento' or motivo = 'Viagem comercial');
