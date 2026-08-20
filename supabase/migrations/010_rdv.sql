-- Aba RDV: rascunho local das despesas/reembolsos, espelhando os campos do
-- portal da Buntech (portalbun.bentonit.com.br/Despesa). Por enquanto o envio
-- pro portal de verdade e manual - essa tabela e so a area de preparo.
create table rdv (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'reembolso', -- reembolso | adiantamento
  numero_pa text,
  conta_contabil text not null,
  quantidade numeric,
  tipo_politica text, -- ex: cafe/almoco/jantar, so pra contas de refeicao
  politica numeric, -- valor-teto informado pelo portal pro tipo_politica
  valor_total numeric not null,
  centro_custo text not null default 'PESQUISA AGRONEGOCIO',
  observacao text,
  comprovante_url text,
  status text not null default 'rascunho', -- rascunho | enviado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
