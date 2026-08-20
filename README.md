# Congresso Nacional de Sementes — App do QR Code

App temporário (site estático) para a placa com QR code do congresso. Sem
build, sem framework: abre `index.html` e pronto. Isolado dos outros apps
da empresa — usa um projeto Supabase próprio, criado só para este evento.

## Fluxo

- **Formulário**: contato + pesquisa (nome, empresa, departamento, e-mail,
  telefone, cidade, estado, produto, comentários) — grava no Supabase.
- **Solicite seu orçamento**: botões que abrem uma conversa de WhatsApp já
  preenchida com o time certo (Hortaliças, Grandes culturas, B2B/Insumos,
  Forrageiras/Pastagens por região, ou Outros).

## Configurar antes de publicar

1. No Supabase (o projeto novo, exclusivo deste app): abra **SQL Editor**
   e rode o conteúdo de `supabase/schema.sql`. Isso cria a tabela
   `respostas_congresso` já protegida (o site só consegue *enviar*
   respostas, nunca ler as dos outros).
2. Em **Project Settings > API**, copie a **Project URL** e a **anon
   public key**.
3. Edite `config.js`:
   - Cole a URL e a anon key nos campos `supabaseUrl` e `supabaseAnonKey`.
   - Preencha os números de WhatsApp de cada área (formato
     `55DDDNUMERO`, só dígitos).

## Publicar no Render

1. No Render, crie um **Static Site** novo apontando para este repositório
   e esta branch.
2. Build command: (nenhum — deixe em branco).
3. Publish directory: `.` (raiz do projeto).
4. Deploy. A URL gerada é o que vai no QR code da placa.

## Depois do congresso

Este app é para durar cerca de uma semana. Depois do evento, você pode
pausar/deletar o Static Site no Render e, se quiser, pausar ou apagar o
projeto Supabase — como é um projeto isolado, isso não afeta nenhum outro
app da empresa.
