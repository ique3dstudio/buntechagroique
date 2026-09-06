-- Status de confirmacao do compromisso na Agenda, pra poder planejar rascunhos
-- antes do cliente confirmar. Fica em cinza claro por padrao (rascunho) e some
-- avançando conforme a negociacao da visita evolui:
-- rascunho -> aguardando -> confirmado (ou remarcado / cancelado).
alter table agenda_compromissos add column if not exists status_confirmacao text not null default 'rascunho';

update agenda_compromissos set status_confirmacao = coalesce(status_confirmacao, 'rascunho');
