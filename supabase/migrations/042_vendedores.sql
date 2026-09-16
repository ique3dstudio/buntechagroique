-- Antes só existia um "vendedor" fixo (singleton em configuracoes: cargo,
-- região, número, matrícula, celular, e-mail, foto). Agora cada vendedor tem
-- seu próprio registro em "vendedores", e o app deixa escolher qual está
-- ativo no aparelho (a escolha fica salva no navegador, não aqui).
create table if not exists vendedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text,
  regiao text,
  numero_vendedor text,
  matricula text,
  celular text,
  email text,
  foto_perfil_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migra o vendedor único que já existia em "configuracoes" pro primeiro
-- registro de "vendedores", só na primeira vez (tabela nova, vazia). A meta
-- anual (meta_valor) continua em "configuracoes": o dashboard calcula o pace
-- geral em cima dela, sem noção de qual vendedor está ativo no aparelho.
insert into vendedores (nome, cargo, regiao, numero_vendedor, matricula, celular, email, foto_perfil_url)
select
  'Gustavo Ique',
  c.cargo, c.regiao, c.numero_vendedor, c.matricula, c.celular, c.email, c.foto_perfil_url
from configuracoes c
where c.id = 1
  and not exists (select 1 from vendedores);
