-- Reestrutura o banco para se aproximar do modelo de dados do RD Station CRM:
-- separa Contatos de Empresas, adiciona Produtos, transforma o status simples
-- de Propostas em um funil de etapas (Negociações), e tipa as Atividades.

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text,
  site text,
  telefone text,
  cidade text,
  created_at timestamptz not null default now()
);

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric,
  created_at timestamptz not null default now()
);

-- Clientes -> Contatos
alter table clientes rename to contatos;
alter table contatos add column empresa_id uuid references empresas(id);
alter table contatos add column cargo text;
alter table contatos add column origem text;

-- Propostas -> Negociações
alter table propostas rename to negociacoes;
alter table negociacoes rename column cliente_id to contato_id;
alter table negociacoes rename column status to etapa;
alter table negociacoes add column produto_id uuid references produtos(id);
alter table negociacoes add column origem text;
alter table negociacoes add column temperatura text not null default 'morno';
alter table negociacoes add column motivo_perda text;

-- Follow-ups -> Atividades
alter table follow_ups rename to atividades;
alter table atividades rename column cliente_id to contato_id;
alter table atividades add column negociacao_id uuid references negociacoes(id);
alter table atividades add column tipo text not null default 'tarefa';
