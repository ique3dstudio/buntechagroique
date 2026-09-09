-- Visitas: apontar pra Carteira e virar relatório de visita.
--
-- 1) O formulário "Registrar visita" listava os contatos do CRM, que estão
--    vazios - por isso o campo Cliente não abria nenhuma opção. A visita passa
--    a apontar pra tabela "clientes" (a Carteira), que é o que se usa de fato.
--    contato_id continua existindo (agora opcional) pras visitas antigas.
--
-- 2) Campos do relatório de visita, pra gerar o PDF direto do app em vez de
--    escrever fora e anexar.

alter table visitas add column if not exists cliente_id uuid references clientes(id) on delete cascade;
alter table visitas alter column contato_id drop not null;

alter table visitas add column if not exists objetivo text;
alter table visitas add column if not exists participantes text;
alter table visitas add column if not exists relato text;
alter table visitas add column if not exists proximos_passos text;
alter table visitas add column if not exists anexo_url text;
alter table visitas add column if not exists anexo_nome text;

create index if not exists visitas_cliente_idx on visitas (cliente_id);
