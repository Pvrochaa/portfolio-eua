(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DEFAULT_LANG = "en";
  var currentLang = DEFAULT_LANG;

  /* ----- Tradução ----- */
  function applyLang(lang) {
    currentLang = window.I18N[lang] ? lang : DEFAULT_LANG;
    var dict = window.I18N[currentLang];
    var fallback = window.I18N[DEFAULT_LANG];
    var t = function (key) { return dict[key] !== undefined ? dict[key] : fallback[key]; };

    document.documentElement.lang = currentLang === "pt" ? "pt-BR" : "en";
    document.title = t("meta.title");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (v !== undefined) el.textContent = v;
    });
    // data-i18n-attr="alt:p1.alt;aria-label:nav.label"
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        var v = t(parts[1]);
        if (parts[0] && v !== undefined) el.setAttribute(parts[0].trim(), v);
      });
    });
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.description"));
  }
  window.setLang = applyLang;

  // ?lang=pt abre a versão em português (dicionário em js/i18n.js)
  applyLang(new URLSearchParams(window.location.search).get("lang") === "pt" ? "pt" : DEFAULT_LANG);

  /* ----- Menu mobile ----- */
  var menuBtn = document.getElementById("menu-toggle");
  var menu = document.getElementById("menu");
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ----- Imagens que não carregaram ----- */
  document.querySelectorAll(".browser__shot img, .portrait img").forEach(function (img) {
    var fail = function () { img.classList.add("is-broken"); };
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ----- Barra de progresso, sombra do menu, voltar ao topo, seção ativa ----- */
  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".progress");
  var toTop = document.getElementById("to-top");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    if (header) header.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 700);

    var active = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= 140) active = i; });
    navLinks.forEach(function (a, i) {
      var on = i === active;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ----- Brilho que segue o cursor nos cards ----- */
  document.querySelectorAll(".skill-card, .project, .code-card").forEach(function (el) {
    el.classList.add("spot");
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ----- Aparecer ao rolar ----- */
  var targets = Array.prototype.slice.call(document.querySelectorAll(
    ".section__head, .skill-card, .project, .about__card, .about__text, .code-card, .col__title, .timeline li, .contact .container > *"
  ));
  targets.forEach(function (el) {
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
  });
  // atraso escalonado entre irmãos
  targets.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (n) { return n.classList.contains("reveal"); });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 4) * 0.08 + "s");
  });

  function settle(el) {
    // depois de aparecer, devolve o controle do transform ao hover
    setTimeout(function () { el.classList.remove("reveal", "in"); el.style.removeProperty("--d"); }, 1000);
  }
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
        settle(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ----- Copiar e-mail ----- */
  var copyBtn = document.getElementById("copy-email");
  var live = document.getElementById("live");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var text = copyBtn.getAttribute("data-copy");
    var done = function () {
      var msg = window.I18N[currentLang]["contact.copied"];
      copyBtn.textContent = msg;
      if (live) live.textContent = msg;
      setTimeout(function () { copyBtn.textContent = window.I18N[currentLang]["contact.copy"]; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { window.location.href = "mailto:" + text; });
    } else {
      window.location.href = "mailto:" + text;
    }
  });

  /* ----- Código do hero: linhas uma a uma (clique no editor para repetir) ----- */
  var lines = Array.prototype.slice.call(document.querySelectorAll(".editor__code .line"));
  var cursor = document.querySelector(".cursor");
  var editor = document.querySelector(".editor");
  if (!lines.length) return;
  var timer = null;

  function placeCursor(line) { if (cursor && line) line.appendChild(cursor); }

  function play() {
    clearInterval(timer);
    lines.forEach(function (l) { l.classList.remove("shown"); });
    if (reduce) {
      lines.forEach(function (l) { l.classList.add("shown"); });
      placeCursor(lines[lines.length - 1]);
      return;
    }
    var i = 0;
    placeCursor(lines[0]);
    timer = setInterval(function () {
      lines[i].classList.add("shown");
      placeCursor(lines[i]);
      i += 1;
      if (i >= lines.length) clearInterval(timer);
    }, 260);
  }
  play();
  if (editor && !reduce) {
    editor.style.cursor = "pointer";
    editor.addEventListener("click", play);
  }
})();
