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
      items.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
      list.innerHTML = items.slice(0, 6).map(function (n) {
        return '<a class="news-item" href="#news">' +
          '<time class="news-date" datetime="' + esc(n.date) + '">' + fmt(n.date) + "</time>" +
          '<span class="news-cat ' + (CAT[n.category] || "") + '">' + esc(n.category || "お知らせ") + "</span>" +
          '<span class="news-title">' + esc(n.title) + "</span>" +
          '<span class="arw">›</span></a>';
      }).join("");
    }

    // 一覧は build.py が HTML に焼き込み済み（検索エンジン向け）。ここでは最新の news.json で描き直す。
    // 公開ページは必ず data/news.json を表示する。
    // 管理画面の下書き(localStorage)を混ぜると、編集した本人の端末でだけ
    // 未公開の内容が反映済みに見えてしまい、公開されたものと区別がつかなくなる。
    // 管理画面から直接公開すると ?v= は変わらないので、毎回サーバーに更新の有無を確認させる。
    fetch(base, { cache: "no-cache" }).then(function (r) { return r.json(); }).then(render).catch(function () { render([]); });
  }

  /* ---------- 本日の診療・休診カレンダー（assets/js/clinic-days.js を使う） ---------- */
  var todayEls = d.querySelectorAll("[data-today]"), calEls = d.querySelectorAll("[data-cal]");
  if (window.ClinicDays && (todayEls.length || calEls.length)) {
    var CD = window.ClinicDays;
    function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    // 閲覧者の端末の時計ではなく、日本時間で判定する
    function tokyoNow() {
      var p = {};
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
        .forEach(function (x) { p[x.type] = x.value; });
      return { date: p.year + "-" + p.month + "-" + p.day, min: (+p.hour) * 60 + (+p.minute) };
    }
    function getJSON(u, opt) { return fetch(u, opt).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }

    Promise.all([getJSON("data/closures.json", { cache: "no-cache" }), getJSON("data/jp-holidays.json")]).then(function (res) {
      var closures = res[0] || [], holidays = res[1] || {}, now = tokyoNow();

      function paintToday() {
        now = tokyoNow();
        var st = CD.todayStatus(now, closures, holidays);
        todayEls.forEach(function (el) {
          el.className = "today today--" + st.state;
          el.innerHTML = '<span class="today-dot" aria-hidden="true"></span><b>' + esc(st.head) + "</b>" +
            (st.sub ? '<span class="today-sub">' + esc(st.sub) + "</span>" : "");
          el.hidden = false;
        });
      }
      paintToday();
      setInterval(paintToday, 60000);

      calEls.forEach(function (box) {
        var base = CD.parse(now.date), offset = 0;
        function month(off) {
          var first = new Date(base.getFullYear(), base.getMonth() + off, 1);
          var y = first.getFullYear(), m = first.getMonth(), days = new Date(y, m + 1, 0).getDate();
          var cells = "", notes = [];
          for (var i = 0; i < first.getDay(); i++) cells += '<span class="cal-cell cal-cell--blank"></span>';
          for (var dd = 1; dd <= days; dd++) {
            var id = CD.iso(new Date(y, m, dd)), inf = CD.dayInfo(id, closures, holidays), cls = "cal-cell", tag = "";
            if (inf.closed) { cls += " is-closed"; tag = inf.part === "holiday" ? "祝" : inf.part === "sunday" ? "" : "休"; }
            else if (inf.part === "pm") { cls += " is-half"; tag = "午後休"; }
            else if (inf.part === "am") { cls += " is-half"; tag = "午前休"; }
            if (id === now.date) cls += " is-today";
            if ((inf.part === "pm" || inf.part === "am" || inf.part === "all") && id >= now.date)
              notes.push(CD.jpDate(id) + " " + CD.PART_LABEL[inf.part] + (inf.reason && inf.reason !== CD.PART_LABEL[inf.part] ? "（" + inf.reason + "）" : ""));
            cells += '<span class="' + cls + '" title="' + esc(inf.closed ? "休診" : CD.hoursText(inf)) + '"><b>' + dd + "</b>" +
              (tag ? "<i>" + tag + "</i>" : "") + "</span>";
          }
          return '<div class="cal-head"><button type="button" class="cal-nav" data-go="-1" aria-label="前の月"' + (off <= 0 ? " disabled" : "") + '>‹</button>' +
            "<b>" + y + "年" + (m + 1) + "月</b>" +
            '<button type="button" class="cal-nav" data-go="1" aria-label="次の月"' + (off >= 1 ? " disabled" : "") + ">›</button></div>" +
            '<div class="cal-grid">' + CD.DOW.map(function (w, i) { return '<span class="cal-dow' + (i === 0 ? " is-sun" : i === 6 ? " is-sat" : "") + '">' + w + "</span>"; }).join("") + cells + "</div>" +
            '<p class="cal-legend"><span class="lg lg-closed"></span>休診日（日曜・祝日・臨時休診）<span class="lg lg-half"></span>半日休診</p>' +
            (notes.length ? '<ul class="cal-notes">' + notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" : "");
        }
        function draw() { box.innerHTML = month(offset); }
        box.addEventListener("click", function (e) {
          var b = e.target.closest(".cal-nav"); if (!b || b.disabled) return;
          offset = Math.max(0, Math.min(1, offset + (+b.getAttribute("data-go")))); draw();
        });
        draw();
      });
    });
  }

  /* ---------- 計測（Google アナリティクス。build.py の GA_ID が空なら何もしない） ---------- */
  if (typeof window.gtag === "function") {
    d.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]"); if (!a) return;
      var href = a.getAttribute("href");
      var ev = /^tel:/.test(href) ? "tel_tap"
             : /share\.google|google\.[a-z.]+\/maps|maps\.google|g\.page/.test(href) ? (/review\.html$/.test(location.pathname) ? "review_tap" : "map_tap")
             : null;
      if (ev) window.gtag("event", ev, { link_url: href, page_path: location.pathname });
    });
  }
})();
