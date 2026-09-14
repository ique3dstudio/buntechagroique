-- "Contato" (telefone) e "Responsável" (nome) virão sempre juntos, e o
-- cliente pode ter mais de um. Isso não cabe mais no esquema de campo
-- dinâmico simples (um valor só por campo) - vira uma coluna própria, um
-- array de {telefone, responsavel}, igual "histórico de vendas" já é uma
-- estrutura própria em vez de um campo dinâmico.

alter table clientes add column if not exists contatos jsonb not null default '[]'::jsonb;

-- Migra o que já tinha em "contato" (telefone) e "responsavel" (nome) pro
-- primeiro contato da lista nova - só quando pelo menos um dos dois existe.
update clientes
set contatos = jsonb_build_array(
  jsonb_build_object(
    'telefone', coalesce(dados->>'contato', ''),
    'responsavel', coalesce(dados->>'responsavel', '')
  )
)
where contatos = '[]'::jsonb
  and (dados->>'contato' is not null or dados->>'responsavel' is not null);

-- Tira os dois campos antigos da ficha (e do jsonb) - agora é só "Contatos".
delete from campos_clientes where chave in ('contato', 'responsavel');
update clientes set dados = dados - 'contato' - 'responsavel';
