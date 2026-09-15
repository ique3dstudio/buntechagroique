-- Nova aba "Negociações": registro de negociações ligado à Carteira (não
-- mais só ao "contatos" do CRM) + "Previsão de pedidos" (ritmo de compra do
-- cliente, projetado na Agenda pra lembrar de mandar mensagem).
--
-- 1) negociacoes ganha cliente_id (aponta pra "clientes", a Carteira de
--    verdade) e observacoes. contato_id/titulo deixam de ser obrigatórios,
--    porque o formulário novo não pede mais "contato do CRM" nem "título" -
--    só cliente, produto, fase e observações. Registros antigos (criados
--    pela aba CRM) continuam existindo e aparecendo normalmente.
alter table negociacoes alter column contato_id drop not null;
alter table negociacoes alter column titulo drop not null;
alter table negociacoes add column if not exists cliente_id uuid references clientes(id) on delete set null;
alter table negociacoes add column if not exists observacoes text;

-- 2) "Previsão de pedidos" reaproveita a Agenda: cada ritmo de cliente (ex:
--    "a cada 15 dias") vira uma série recorrente com
--    recorrencia = 'personalizada' e o intervalo em dias aqui.
alter table agenda_compromissos add column if not exists recorrencia_intervalo_dias integer;
