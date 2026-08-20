(function () {
  const cfg = window.APP_CONFIG;

  // Cria o cliente Supabase de forma defensiva: se o script do CDN não
  // carregar (wifi ruim do evento, CDN fora do ar, etc.), o app continua
  // funcionando para navegação e WhatsApp — só o envio do formulário fica
  // indisponível, com aviso claro para o usuário.
  let supabase = null;
  try {
    supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  } catch (e) {
    console.error("Não foi possível iniciar o Supabase:", e);
  }

  // ---------- LinkedIn ----------
  const linkedinLink = document.getElementById("linkedin-link");
  if (linkedinLink && cfg.linkedinUrl) {
    linkedinLink.href = cfg.linkedinUrl;
  }

  // ---------- Navegação entre telas ----------
  function goto(viewId) {
    document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
    document.getElementById(viewId).classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goto(btn.dataset.goto));
  });

  // ---------- Produto: mostrar campo "outro" ----------
  const selectProduto = document.getElementById("select-produto");
  const inputProdutoOutro = document.getElementById("input-produto-outro");
  selectProduto.addEventListener("change", () => {
    inputProdutoOutro.style.display = selectProduto.value === "Outros" ? "block" : "none";
  });

  // ---------- Formulário de contato + pesquisa ----------
  const form = document.getElementById("form-contato");
  const formError = document.getElementById("form-error");
  const btnEnviar = document.getElementById("btn-enviar");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.style.display = "none";

    if (!form.checkValidity()) {
      formError.style.display = "block";
      form.reportValidity();
      return;
    }

    if (!supabase) {
      formError.textContent = "Não foi possível conectar. Verifique sua internet e recarregue a página.";
      formError.style.display = "block";
      return;
    }

    const fd = new FormData(form);
    const payload = {
      nome: fd.get("nome").trim(),
      empresa: fd.get("empresa").trim(),
      departamento: (fd.get("departamento") || "").trim() || null,
      email: fd.get("email").trim(),
      telefone: fd.get("telefone").trim(),
      cidade: fd.get("cidade").trim(),
      estado: fd.get("estado").trim(),
      produto: fd.get("produto") || null,
      produto_outro: (fd.get("produto_outro") || "").trim() || null,
      comentarios: fd.get("comentarios").trim(),
    };

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";

    const { error } = await supabase.from("respostas_congresso").insert(payload);

    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar!";

    if (error) {
      console.error(error);
      formError.textContent = "Não foi possível enviar. Verifique sua conexão e tente novamente.";
      formError.style.display = "block";
      return;
    }

    form.reset();
    inputProdutoOutro.style.display = "none";
    goto("view-form-ok");
  });

  // ---------- WhatsApp ----------
  function openWhatsApp(number, text) {
    if (!number || number.indexOf("SEUNUMEROAQUI") !== -1) {
      alert("Número de WhatsApp ainda não configurado para esta opção.");
      return;
    }
    const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  document.querySelectorAll("[data-wa]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.wa;
      const number = cfg.whatsapp[key];
      openWhatsApp(number, `Olá! Vim do Congresso Nacional de Sementes e quero um orçamento de ${btn.textContent.trim()}.`);
    });
  });

  document.querySelectorAll("[data-wa-forrageiras]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.waForrageiras;
      const number = cfg.whatsapp.forrageiras[key];
      openWhatsApp(number, `Olá! Vim do Congresso Nacional de Sementes e quero um orçamento de Forrageiras/Pastagens (${btn.textContent.trim()}).`);
    });
  });

  document.getElementById("btn-forrageiras-outro").addEventListener("click", () => {
    const texto = document.getElementById("input-forrageiras-outro").value.trim();
    const number = cfg.whatsapp.forrageiras.outro;
    openWhatsApp(
      number,
      `Olá! Vim do Congresso Nacional de Sementes e quero um orçamento de Forrageiras/Pastagens (região: ${texto || "não informada"}).`
    );
  });

  document.getElementById("btn-outros").addEventListener("click", () => {
    const texto = document.getElementById("input-outros").value.trim();
    const number = cfg.whatsapp.outros;
    openWhatsApp(
      number,
      `Olá! Vim do Congresso Nacional de Sementes e quero um orçamento: ${texto || "não especificado"}.`
    );
  });
})();
