// Configuração do app do congresso — edite aqui antes de publicar.
window.APP_CONFIG = {
  // Dados do projeto Supabase NOVO (criado especialmente para este app).
  // Painel Supabase > Project Settings > API
  supabaseUrl: "https://gofqnrckdjqikbitglfh.supabase.co",
  // IMPORTANTE: aqui vai a "anon public key" (NUNCA a "service_role key").
  // Painel Supabase > Project Settings > API > Project API keys > anon public
  supabaseAnonKey: "COLOQUE_A_ANON_KEY_DO_SEU_PROJETO_SUPABASE",

  // Números de WhatsApp por área. Formato internacional, só dígitos
  // (Brasil: 55 + DDD + número).
  whatsapp: {
    hortalicas: "5511910097461",
    grandesCulturas: "5518997911679",
    b2bInsumos: "5511917410629",
    forrageiras: {
      saoPaulo: "5511956390977",
      minasGerais: "5511917412544",
      goias: "5511971924029",
      bahia: "5511971924029",
      matoGrossoSul: "5567996681117",
      outro: "5547999066045",
    },
    outros: "5547999066045",
  },
};
