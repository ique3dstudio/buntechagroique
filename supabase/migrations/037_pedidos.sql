-- Aba "Criar pedido": registro dos pedidos lançados no TOTVS Protheus, pra
-- ter o valor entrando no faturamento do dashboard sem esperar a integração
-- de verdade com o TOTVS. Os campos cobrem tudo que aparece com asterisco
-- vermelho (obrigatório) nas telas de "Pedidos de Venda" do Protheus - Tipo
-- Pedido, Cliente, Loja, Tipo Cliente, Cond. Pagto, Tipo Frete, Presença
-- Comercial - mais os campos extras pedidos: Comunicação interna, Produto,
-- Número do vendedor, Unidade, Quantidade e Preço unitário (o valor total é
-- quantidade × preço unitário).

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  data date not null default current_date,
  tipo_pedido text,
  loja text,
  tipo_cliente text,
  cond_pagamento text,
  tipo_frete text,
  presenca_comercial text,
  comunicacao_interna text,
  produto text,
  numero_vendedor text,
  unidade text,
  quantidade numeric,
  preco_unitario numeric,
  valor_total numeric not null default 0,
  created_at timestamptz not null default now()
);
