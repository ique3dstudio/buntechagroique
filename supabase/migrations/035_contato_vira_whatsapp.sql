-- O campo "Contato" (telefone) da Carteira passa a ser do tipo "whatsapp":
-- a ficha do cliente mostra ele como um link que já abre a conversa no
-- WhatsApp da pessoa, em vez de só o número em texto.

update campos_clientes set tipo = 'whatsapp' where chave = 'contato';
