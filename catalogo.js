/* =========================================================
   CATÁLOGO DIGITAL — filtros, busca, grade e modal de detalhe
   Depende de assets/catalogo-data.js (window.CATALOGO)
   ========================================================= */
(function () {
  const dados = window.CATALOGO || [];
  const elGrid = document.getElementById("cat-grid");
  const elFiltros = document.getElementById("cat-filtros");
  const elBusca = document.getElementById("cat-busca");
  const elContador = document.getElementById("cat-contador");
  if (!elGrid || !dados.length) return;

  // Achata todas as peças com referência à categoria
  const pecas = [];
  dados.forEach((cat) => {
    cat.itens.forEach((it) => {
      pecas.push({
        nome: cat.nome,
        slug: cat.slug,
        reg: it.reg,
        img: it.img,
        intro: cat.intro,
        topicos: cat.topicos || [],
      });
    });
  });

  const totalPecas = pecas.length;
  let filtroAtual = "todos";
  let termoBusca = "";

  /* ---- Filtros por categoria ---- */
  const categorias = [{ nome: "Todas", slug: "todos", total: totalPecas }].concat(
    dados.map((c) => ({ nome: c.nome, slug: c.slug, total: c.total }))
  );
  categorias.forEach((c) => {
    const b = document.createElement("button");
    b.className = "cat-filtro" + (c.slug === "todos" ? " ativo" : "");
    b.dataset.slug = c.slug;
    b.innerHTML = `${c.nome} <span>${c.total}</span>`;
    b.addEventListener("click", () => {
      filtroAtual = c.slug;
      document.querySelectorAll(".cat-filtro").forEach((x) => x.classList.remove("ativo"));
      b.classList.add("ativo");
      render();
    });
    elFiltros.appendChild(b);
  });

  /* ---- Busca ---- */
  elBusca.addEventListener("input", (e) => {
    termoBusca = e.target.value.trim().toLowerCase();
    render();
  });

  /* ---- Render da grade ---- */
  function render() {
    const lista = pecas.filter((p) => {
      const okCat = filtroAtual === "todos" || p.slug === filtroAtual;
      const okBusca =
        !termoBusca ||
        p.nome.toLowerCase().includes(termoBusca) ||
        p.reg.toLowerCase().includes(termoBusca) ||
        (p.intro || "").toLowerCase().includes(termoBusca);
      return okCat && okBusca;
    });

    elGrid.innerHTML = "";
    if (!lista.length) {
      elGrid.innerHTML = '<p class="cat-vazio">Nenhuma peça encontrada para esta busca.</p>';
      elContador.textContent = "";
      return;
    }
    elContador.textContent =
      lista.length === totalPecas
        ? `${totalPecas} peças catalogadas`
        : `Mostrando ${lista.length} de ${totalPecas} peças`;

    lista.forEach((p) => {
      const btn = document.createElement("button");
      btn.className = "cat-peca";
      btn.innerHTML = `
        <img class="cat-peca__img" src="${p.img}" alt="${p.nome} — registro ${p.reg}" loading="lazy">
        <div class="cat-peca__info">
          <div class="cat-peca__nome">${p.nome}</div>
          <div class="cat-peca__reg">Reg. ${p.reg}</div>
        </div>`;
      btn.addEventListener("click", () => abrirModal(p));
      elGrid.appendChild(btn);
    });
  }

  /* ---- Modal ---- */
  const modal = document.getElementById("cat-modal");
  const mImg = document.getElementById("modal-img");
  const mTag = document.getElementById("modal-tag");
  const mTit = document.getElementById("modal-titulo");
  const mReg = document.getElementById("modal-reg");
  const mIntro = document.getElementById("modal-intro");
  const mTop = document.getElementById("modal-topicos");
  const mFechar = document.getElementById("modal-fechar");

  function abrirModal(p) {
    mImg.src = p.img;
    mImg.alt = `${p.nome} — registro ${p.reg}`;
    mTag.textContent = "Acervo do Museu";
    mTit.textContent = p.nome;
    mReg.textContent = `Número de registro: ${p.reg} · Reserva técnica do Museu de Ipoema`;
    mIntro.textContent = p.intro || "";
    mTop.innerHTML = "";
    (p.topicos || []).forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      mTop.appendChild(li);
    });
    modal.classList.add("aberto");
    document.body.style.overflow = "hidden";
    mFechar.focus();
  }
  function fecharModal() {
    modal.classList.remove("aberto");
    document.body.style.overflow = "";
  }
  mFechar.addEventListener("click", fecharModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("aberto")) fecharModal();
  });

  render();
})();
