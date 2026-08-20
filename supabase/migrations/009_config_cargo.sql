-- Cargo editavel exibido ao lado da foto de perfil (ex: "Vendedor Junior - Minas Gerais")
alter table configuracoes add column cargo text default 'Vendedor Junior - Minas Gerais';
update configuracoes set cargo = 'Vendedor Junior - Minas Gerais' where cargo is null;
