-- Agenda comercial do Gustavo: viagem de 21/09 a 03/10/2026.
-- Um compromisso por trecho de deslocamento e um por cliente visitado, pra
-- cada visita poder puxar as coordenadas do cadastro e entrar na rota do dia.
--
-- Sem hora: o calendário mostra tudo na faixa "Dia todo", que é o que a
-- planilha de origem traz (só data, trecho e clientes).
--
-- cliente_id sai de uma busca por nome na carteira - quando o cliente ainda
-- não está cadastrado, fica nulo e o compromisso vale do mesmo jeito, só não
-- entra no traçado da rota.
--
-- Seguro rodar de novo: não duplica compromisso já existente na mesma data.

insert into agenda_compromissos
  (data, tipo, titulo, localizacao, motivo, descricao, status_confirmacao, cliente_id)
select
  v.data::date, v.tipo, v.titulo, v.localizacao, v.motivo, v.descricao, v.status,
  (select c.id from clientes c where c.nome ilike v.busca_cliente limit 1)
from (values
  ('2026-09-21', 'outro',  'Deslocamento: Indaiatuba → Monte Santo de Minas (3h)', 'Monte Santo de Minas - MG', 'Deslocamento',     'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', null),
  ('2026-09-21', 'visita', 'Gangini',                                              'Monte Santo de Minas - MG', 'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Gangini%'),
  ('2026-09-21', 'visita', 'Barbosa',                                              'Monte Santo de Minas - MG', 'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Barbosa%'),

  ('2026-09-22', 'outro',  'Deslocamento: Monte Santo de Minas → Curvelo (8h)',    'Curvelo - MG',              'Deslocamento',     'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', null),
  ('2026-09-22', 'visita', 'Gerplant',                                             'Curvelo - MG',              'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'aguardando', '%Gerplant%'),
  ('2026-09-22', 'visita', 'Germina',                                              'Curvelo - MG',              'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Germina%'),

  ('2026-09-23', 'outro',  'Deslocamento: Curvelo → Corinto (40 min)',             'Corinto - MG',              'Deslocamento',     'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', null),
  ('2026-09-23', 'visita', 'Triângulo',                                            'Corinto - MG',              'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Tri%ngulo%'),

  ('2026-09-24', 'outro',  'Deslocamento: Corinto → Pavão (11h)',                  'Pavão - MG',                'Deslocamento',     'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', null),
  ('2026-09-24', 'visita', 'JM Plantar',                                           'Pavão - MG',                'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%JM%Plantar%'),

  ('2026-09-25', 'outro',  'Em Pavão',                                             'Pavão - MG',                'Viagem comercial', 'Dia em Pavão - sem visita marcada',       'confirmado', null),

  ('2026-09-26', 'outro',  'Deslocamento: Pavão → Capelinha (5h)',                 'Capelinha - MG',            'Deslocamento',     'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', null),

  ('2026-09-27', 'outro',  'Deslocamento: Capelinha → Montes Claros (4h)',         'Montes Claros - MG',        'Deslocamento',     'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', null),

  ('2026-09-28', 'visita', 'Agromax',                                              'Montes Claros - MG',        'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Agromax%'),
  ('2026-09-28', 'visita', 'Tolentino',                                            'Montes Claros - MG',        'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'aguardando', '%Tolentino%'),

  ('2026-09-29', 'visita', 'Nasce bem',                                            'Montes Claros - MG',        'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Nasce%bem%'),
  ('2026-09-29', 'visita', 'Grão de Ouro',                                         'Montes Claros - MG',        'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'aguardando', '%Gr%o de Ouro%'),

  ('2026-09-30', 'outro',  'Deslocamento: Montes Claros → Chapada Gaúcha (7h)',    'Chapada Gaúcha - MG',       'Deslocamento',     'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', null),
  ('2026-09-30', 'visita', 'Schimitz',                                             'Chapada Gaúcha - MG',       'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Sch%mitz%'),

  ('2026-10-01', 'visita', 'Papa leguas',                                          'Chapada Gaúcha - MG',       'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'confirmado', '%Papa%gua%'),
  ('2026-10-01', 'visita', 'Grande sertão',                                        'Chapada Gaúcha - MG',       'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'aguardando', '%Grande sert%o%'),

  ('2026-10-02', 'outro',  'Deslocamento: Chapada Gaúcha → Indaiatuba (15h)',      'Indaiatuba - SP',           'Deslocamento',     'Viagem de volta - 15h, chega dia 03/10',  'confirmado', null),
  ('2026-10-02', 'visita', 'Serra Verde',                                          'Chapada Gaúcha - MG',       'Visita comercial', 'Agenda comercial - viagem 21/09 a 03/10', 'aguardando', '%Serra Verde%'),

  ('2026-10-03', 'outro',  'Chegada em Indaiatuba',                                'Indaiatuba - SP',           'Deslocamento',     'Continuação da viagem de volta (saída 02/10)', 'confirmado', null)
) as v(data, tipo, titulo, localizacao, motivo, descricao, status, busca_cliente)
where not exists (
  select 1 from agenda_compromissos a
   where a.data = v.data::date
     and a.titulo = v.titulo
);
