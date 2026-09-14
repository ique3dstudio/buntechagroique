-- Três acertos na ficha da Carteira:
--
-- 1) CNPJ virou CNPJ/CPF (mesmo campo, só o rótulo muda) e o valor guardado
--    é reformatado com pontuação exata, olhando pra quantidade de dígitos
--    (14 = CNPJ, 11 = CPF).
-- 2) E-mail sempre em minúsculo.
-- 3) Cidade só com a primeira letra de cada palavra maiúscula, e ganha o
--    "- UF" quando ainda não tem. Só faz isso pras cidades que dá pra saber
--    o estado com certeza (nome que não se repete em outro estado do
--    Brasil) - o app aplica a mesma regra na tela pra qualquer cidade nova
--    que caia nessa lista, mesmo sem rodar migração de novo.
--
--    "Campo Grande" (cliente Safrasul Sementes) fica de fora de propósito:
--    é o nome da capital de Mato Grosso do Sul, mas também existe como
--    localidade dentro de Minas Gerais - sem saber qual dos dois é esse
--    cliente, não dá pra adivinhar certo.

update campos_clientes set rotulo = 'CNPJ/CPF', tipo = 'documento' where chave = 'cnpj';
update campos_clientes set tipo = 'email' where chave = 'email';
update campos_clientes set tipo = 'cidade' where chave = 'cidade';

-- Reformata o CNPJ/CPF guardado (tira tudo que não é número e recoloca a
-- pontuação de acordo com o tamanho).
update clientes
set dados = jsonb_set(dados, '{cnpj}', to_jsonb(
  case length(regexp_replace(dados->>'cnpj', '\D', '', 'g'))
    when 14 then regexp_replace(regexp_replace(dados->>'cnpj', '\D', '', 'g'), '(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})', '\1.\2.\3/\4-\5')
    when 11 then regexp_replace(regexp_replace(dados->>'cnpj', '\D', '', 'g'), '(\d{3})(\d{3})(\d{3})(\d{2})', '\1.\2.\3-\4')
    else dados->>'cnpj'
  end
))
where dados->>'cnpj' is not null and dados->>'cnpj' <> '';

-- E-mail em minúsculo.
update clientes
set dados = jsonb_set(dados, '{email}', to_jsonb(lower(dados->>'email')))
where dados->>'email' is not null and dados->>'email' <> '';

-- Cidade: só a primeira letra de cada palavra maiúscula.
update clientes
set dados = jsonb_set(dados, '{cidade}', to_jsonb(initcap(dados->>'cidade')))
where dados->>'cidade' is not null and dados->>'cidade' <> '';

-- "- UF" pras cidades que dá pra saber com certeza (nomes inequívocos).
update clientes
set dados = jsonb_set(dados, '{cidade}', to_jsonb(initcap(dados->>'cidade') || ' - MG'))
where dados->>'cidade' is not null
  and dados->>'cidade' !~* ' - [A-Za-z]{2}$'
  and lower(dados->>'cidade') in (
    'itanhomi', 'governador valadares', 'montes claros', 'itanhandu',
    'brasilia de minas', 'brasília de minas',
    'chapada gaucha', 'chapada gaúcha',
    'tupaciguara', 'araxa', 'araxá'
  );
