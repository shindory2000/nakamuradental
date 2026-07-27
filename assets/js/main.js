/* =========================================================
   Nakamura Dental Office — front-end
   ========================================================= */
(function () {
  "use strict";

  var d = document;
  var yr = d.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- header ---------- */
  var header = d.getElementById("header");
  var hero = d.querySelector(".hero, .page-hero");
  function onScroll() {
    var solid = window.scrollY > 40;
    header.classList.toggle("solid", solid);
    // white-on-photo styling only while over the hero image
    if (hero) {
      var overHero = window.scrollY < hero.offsetHeight - 90;
      header.classList.toggle("on-photo", overHero && !solid);
    }
  }
  if (header) { onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); }

  /* ---------- drawer ---------- */
  var burger = d.getElementById("burger"), drawer = d.getElementById("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = d.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        d.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- split characters for stagger ---------- */
  d.querySelectorAll(".chars").forEach(function (el) {
    if (el.dataset.split) return;
    el.dataset.split = "1";
    var txt = el.textContent;
    el.textContent = "";
    txt.split("").forEach(function (c, i) {
      var s = d.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? " " : c;
      s.style.transitionDelay = (i * 0.035).toFixed(3) + "s";
      el.appendChild(s);
    });
  });

  /* ---------- reveal on scroll ---------- */
  var targets = d.querySelectorAll(".reveal, .lines, .chars, .wipe");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- hero 3-photo fade ---------- */
  var slides = d.querySelectorAll(".hero-slides .slide");
  if (slides.length > 1) {
    var dots = d.querySelectorAll(".hero-dots button");
    var i = 0, timer;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      dots.forEach(function (b, k) { b.classList.toggle("on", k === i); });
    }
    function play() { timer = setInterval(function () { show(i + 1); }, 5600); }
    function restart() { clearInterval(timer); play(); }
    dots.forEach(function (b, k) {
      b.addEventListener("click", function () { show(k); restart(); });
    });
    show(0); play();
  }

  /* ---------- inject illustrations (each element loads its own SVG) ---------- */
  var svgCache = {};
  d.querySelectorAll("[data-tram]").forEach(function (el) {
    var src = el.getAttribute("data-tram");
    if (!src) return;
    if (!svgCache[src]) {
      svgCache[src] = fetch(src).then(function (r) { return r.text(); });
    }
    svgCache[src].then(function (svg) { el.innerHTML = svg; }).catch(function () {});
  });

  /* ---------- FAQ accordion ---------- */
  d.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- NEWS ---------- */
  var list = d.getElementById("newsList");
  if (list) {
    var CAT = { "お知らせ": "", "診療案内": "info", "重要": "holiday", "休診": "holiday" };
    var base = list.getAttribute("data-src") || "data/news.json";

    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function fmt(iso) {
      var x = new Date(iso + "T00:00:00");
      if (isNaN(x)) return iso;
      return x.getFullYear() + "." + ("0" + (x.getMonth() + 1)).slice(-2) + "." + ("0" + x.getDate()).slice(-2);
    }
    function render(items) {
      if (!items || !items.length) {
        list.innerHTML = '<p class="news-empty">現在お知らせはありません。</p>';
        return;
      }
      items.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      list.innerHTML = items.slice(0, 6).map(function (n) {
        return '<a class="news-item" href="#news">' +
          '<span class="news-date">' + fmt(n.date) + "</span>" +
          '<span class="news-cat ' + (CAT[n.category] || "") + '">' + esc(n.category || "お知らせ") + "</span>" +
          '<span class="news-title">' + esc(n.title) + "</span>" +
          '<span class="arw">›</span></a>';
      }).join("");
    }

    var saved = null;
    try { saved = JSON.parse(localStorage.getItem("ndo_news") || "null"); } catch (e) {}
    if (saved && saved.length) render(saved);
    else fetch(base).then(function (r) { return r.json(); }).then(render).catch(function () { render([]); });
  }
})();
