/* =========================================================
   CURADOR DIGITAL — "Tião", guia tropeiro do Museu do Tropeiro
   Widget de chat que se auto-injeta em todas as páginas.
   Conversa via /api/curador (OpenRouter/DeepSeek no backend).
   ========================================================= */
(function () {
  const ENDPOINT = "/api/curador";
  const SAUDACAO =
    "Uai, seja bem-vindo ao Museu do Tropeiro! Sou o Tião, seu guia por aqui. Posso contar a história do museu, falar das peças do acervo ou ajudar você a planejar sua visita. O que você quer saber?";
  const SUGESTOES = [
    "Qual a história do museu?",
    "Qual o horário de visita?",
    "O que é um cincerro?",
    "Como chego em Ipoema?",
  ];
  const CONTATO =
    'No momento não consegui falar com o curador. Você pode falar direto com o museu pelo telefone (31) 3839-2991 ou pelo e-mail museutropeiro@yahoo.com.';

  const historico = []; // {role, content}

  // ---- Monta o DOM ----
  const botao = document.createElement("button");
  botao.className = "curador-botao";
  botao.setAttribute("aria-label", "Abrir o curador digital");
  botao.innerHTML = '<span class="curador-botao__avatar" aria-hidden="true">🤠</span><span>Fale com o curador</span>';

  const painel = document.createElement("div");
  painel.className = "curador-painel";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-label", "Curador digital do Museu do Tropeiro");
  painel.innerHTML = `
    <div class="curador-topo">
      <span class="curador-topo__avatar" aria-hidden="true">🤠</span>
      <div>
        <h4>Tião · Curador digital</h4>
        <p>Museu do Tropeiro — Ipoema/Itabira</p>
      </div>
      <button class="curador-fechar" aria-label="Fechar">&times;</button>
    </div>
    <div class="curador-msgs" id="curador-msgs" aria-live="polite"></div>
    <div class="curador-sugestoes" id="curador-sugestoes"></div>
    <form class="curador-form" id="curador-form">
      <label class="sr-only" for="curador-input">Sua pergunta</label>
      <input id="curador-input" type="text" autocomplete="off" placeholder="Escreva sua pergunta…" maxlength="500">
      <button type="submit" aria-label="Enviar">➤</button>
    </form>`;

  document.body.appendChild(botao);
  document.body.appendChild(painel);

  const elMsgs = painel.querySelector("#curador-msgs");
  const elSug = painel.querySelector("#curador-sugestoes");
  const form = painel.querySelector("#curador-form");
  const input = painel.querySelector("#curador-input");
  const fechar = painel.querySelector(".curador-fechar");

  let iniciado = false;

  function abrir() {
    painel.classList.add("aberto");
    botao.style.display = "none";
    if (!iniciado) {
      iniciado = true;
      addMsg("bot", SAUDACAO);
      renderSugestoes();
    }
    setTimeout(() => input.focus(), 100);
  }
  function fecharPainel() {
    painel.classList.remove("aberto");
    botao.style.display = "";
  }

  botao.addEventListener("click", abrir);
  fechar.addEventListener("click", fecharPainel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && painel.classList.contains("aberto")) fecharPainel();
  });

  function addMsg(tipo, texto) {
    const div = document.createElement("div");
    div.className = "cmsg cmsg--" + (tipo === "user" ? "user" : "bot");
    div.textContent = texto;
    elMsgs.appendChild(div);
    elMsgs.scrollTop = elMsgs.scrollHeight;
    return div;
  }

  function renderSugestoes() {
    elSug.innerHTML = "";
    SUGESTOES.forEach((s) => {
      const b = document.createElement("button");
      b.className = "curador-sugestao";
      b.textContent = s;
      b.addEventListener("click", () => enviar(s));
      elSug.appendChild(b);
    });
  }

  async function enviar(texto) {
    texto = (texto || input.value).trim();
    if (!texto) return;
    input.value = "";
    elSug.innerHTML = "";
    addMsg("user", texto);
    historico.push({ role: "user", content: texto });

    const carregando = addMsg("bot", "…");
    carregando.classList.add("cmsg--carregando");

    try {
      const r = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historico }),
      });
      const data = await r.json().catch(() => ({}));
      carregando.remove();
      if (!r.ok || !data.reply) {
        addMsg("bot", data.erro ? data.erro : CONTATO);
        return;
      }
      addMsg("bot", data.reply);
      historico.push({ role: "assistant", content: data.reply });
    } catch (e) {
      carregando.remove();
      addMsg("bot", CONTATO);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    enviar();
  });
})();
