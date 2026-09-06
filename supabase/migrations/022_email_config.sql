-- Adiciona o e-mail do vendedor na tabela configuracoes, ao lado do celular.
alter table configuracoes add column if not exists email text;

update configuracoes set email = coalesce(email, 'gique@bentonit.com.br') where id = 1;
