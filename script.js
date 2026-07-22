/* =========================================================
   MUSEU DO TROPEIRO — script.js
   Menu responsivo, header dinâmico, scroll reveal, formulários
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---- Marca link ativo no menu conforme a página atual ---- */
  const paginaAtual = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === paginaAtual) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---- Header muda de aparência ao rolar ---- */
  const header = document.querySelector(".header");
  const aoRolar = debounce(() => {
    if (window.scrollY > 12) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }, 30);
  window.addEventListener("scroll", aoRolar);
  aoRolar();

  /* ---- Menu mobile ---- */
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const overlay = document.querySelector(".nav-overlay");

  function abrirMenu() {
    nav.classList.add("open");
    overlay.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }
  function fecharMenu() {
    nav.classList.remove("open");
    overlay.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.contains("open") ? fecharMenu() : abrirMenu();
    });
    overlay?.addEventListener("click", fecharMenu);
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", fecharMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fecharMenu();
    });
  }

  /* ---- Reveal on scroll (Intersection Observer) ---- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const observer = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("is-visible");
            observer.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Formulário de contato (visite.html) — sem backend, apenas feedback local ---- */
  const formContato = document.querySelector("#form-contato");
  if (formContato) {
    formContato.addEventListener("submit", (e) => {
      e.preventDefault();
      const toast = document.querySelector("#toast-contato");
      if (formContato.checkValidity()) {
        toast.textContent = "Mensagem registrada! Assim que o site tiver envio automático de e-mail configurado, sua mensagem chegará direto à administração do museu.";
        toast.classList.add("show");
        formContato.reset();
      } else {
        formContato.reportValidity();
      }
    });
  }

  /* ---- Newsletter simples (index.html) ---- */
  const formNewsletter = document.querySelector("#form-newsletter");
  if (formNewsletter) {
    formNewsletter.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = formNewsletter.querySelector("input[type=email]");
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const toast = document.querySelector("#toast-newsletter");
      if (regex.test(email.value)) {
        toast.textContent = "Inscrição registrada! (função de envio real a ser conectada a um serviço de e-mail marketing antes do lançamento)";
        toast.classList.add("show");
        formNewsletter.reset();
      } else {
        email.setCustomValidity("Digite um e-mail válido.");
        formNewsletter.reportValidity();
        email.setCustomValidity("");
      }
    });
  }
});

/* ---- Debounce simples para eventos de scroll ---- */
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Fichas de catalogação do acervo (abre/fecha detalhe por categoria)
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-abrir-ficha]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-abrir-ficha');
      var dialog = document.getElementById('ficha-' + id);
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    });
  });
  document.querySelectorAll('.ficha-dialog').forEach(function (dialog) {
    var fechar = dialog.querySelector('.ficha-dialog__fechar');
    if (fechar) {
      fechar.addEventListener('click', function () { dialog.close(); });
    }
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
  });
});
