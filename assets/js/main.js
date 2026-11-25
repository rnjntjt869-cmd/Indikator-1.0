/*
  David Papa – Website-Skripte.
  Keine Abhängigkeiten, kein Build-Schritt. Jede Funktion startet nur,
  wenn das passende Element auf der Seite vorhanden ist.
*/
(function () {
  "use strict";

  var CFG = window.SITE || {};
  var PREIS = Number(CFG.preisProKilo) || 50;
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var NBSP = " ";
  var nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtMonthYear = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  var fmtMonthShort = new Intl.DateTimeFormat("de-DE", { month: "short", year: "numeric" });
  var fmtDayLong = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  var fmtDay = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" });

  function eur(n) { return nf0.format(n) + NBSP + "€"; }
  function eurCent(n) { return nf2.format(n) + NBSP + "€"; }
  function kg(n) { return nf1.format(n) + NBSP + "kg"; }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fromIso(s) { var p = s.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function parseKg(v) { return Number(String(v).replace(",", ".").trim()); }

  /* ---------- Werte aus config.js in die Seite schreiben ---------- */

  $$("[data-preis]").forEach(function (el) { el.textContent = nf0.format(PREIS); });
  $$("[data-preis-mal]").forEach(function (el) {
    el.textContent = eur(Number(el.getAttribute("data-preis-mal")) * PREIS);
  });
  if (CFG.neueKlientenProWoche) {
    $$("[data-kapazitaet]").forEach(function (el) { el.textContent = CFG.neueKlientenProWoche; });
  }

  /* ---------- Navigation auf dem Handy ---------- */

  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  if (header && toggle) {
    var toggleLabel = $(".nav-toggle__label", toggle);
    var setOpen = function (open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (toggleLabel) toggleLabel.textContent = open ? "Schließen" : "Menü";
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    $$(".site-nav a", header).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  /* ---------- Feste Button-Leiste auf dem Handy ---------- */

  var mobileCta = $(".mobile-cta");
  var ctaTrigger = $("[data-cta-trigger]");
  if (mobileCta && ctaTrigger && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      mobileCta.classList.toggle("is-visible", !e.isIntersecting && e.boundingClientRect.top < 0);
    }).observe(ctaTrigger);
  }

  /* ---------- Schieberegler: gefüllte Spur ---------- */

  function setFill(range) {
    var min = Number(range.min) || 0;
    var max = Number(range.max) || 100;
    range.style.setProperty("--fill", ((Number(range.value) - min) / (max - min)) * 100 + "%");
  }

  /* ---------- Quittung im Hero ---------- */

  $$("[data-receipt]").forEach(function (root) {
    var range = $("input[type=range]", root);
    var kgOut = $("[data-receipt-kg]", root);
    var totalOut = $("[data-receipt-total]", root);
    if (!range || !kgOut || !totalOut) return;

    var target = Number(range.value);
    var userMoved = false;

    function render() {
      var n = Number(range.value);
      kgOut.textContent = n;
      totalOut.textContent = eurCent(n * PREIS);
      range.setAttribute("aria-valuetext", n + " Kilo verloren, " + eurCent(n * PREIS) + " zu zahlen");
      setFill(range);
    }

    range.addEventListener("input", function () { userMoved = true; render(); });

    if (reduceMotion) { render(); return; }

    // Einmaliger Moment beim Laden: Die Quittung druckt, die Kilos zählen hoch.
    var t0 = null;
    var delay = 450;
    var duration = 1100;
    range.value = 0;
    render();
    requestAnimationFrame(function step(ts) {
      if (userMoved) return;
      if (t0 === null) t0 = ts;
      var p = Math.min(1, Math.max(0, (ts - t0 - delay) / duration));
      range.value = Math.round(target * (1 - Math.pow(1 - p, 3)));
      render();
      if (p < 1) requestAnimationFrame(step);
    });
  });

  /* ---------- Ziel-Rechner ---------- */

  $$("[data-rechner]").forEach(initRechner);

  function initRechner(root) {
    var form = $("form", root);
    var inStart = $("input[name=start]", root);
    var inZiel = $("input[name=ziel]", root);
    var errBox = $("[data-error]", root);
    var msgBox = $("[data-msg]", root);
    var outKg = $("[data-out=kg]", root);
    var outPreis = $("[data-out=preis]", root);
    var outDauer = $("[data-out=dauer]", root);
    var svg = $("svg", root);
    var tip = $("[data-tip]", root);
    var tbody = $("[data-milestones]", root);
    var cta = $("[data-cta]", root);
    if (!form || !inStart || !inZiel || !svg) return;

    var W = 640, H = 300;
    var M = { t: 30, r: 20, b: 44, l: 44 };
    var model = null;
    var resizeFrame = 0;

    function tempo() {
      var c = $("input[name=tempo]:checked", root);
      return c ? Number(c.value) : 0.75;
    }

    function fail(message, field) {
      model = null;
      root.classList.add("is-invalid");
      errBox.textContent = message;
      errBox.hidden = false;
      field.setAttribute("aria-invalid", "true");
      hideTip();
    }

    function update() {
      var start = parseKg(inStart.value);
      var ziel = parseKg(inZiel.value);
      var rate = tempo();

      errBox.hidden = true;
      inStart.removeAttribute("aria-invalid");
      inZiel.removeAttribute("aria-invalid");

      if (!(start >= 40 && start <= 350)) return fail("Trag bei „Dein Gewicht heute“ einen Wert zwischen 40 und 350 kg ein.", inStart);
      if (!(ziel >= 40 && ziel <= 350)) return fail("Trag bei „Dein Zielgewicht“ einen Wert zwischen 40 und 350 kg ein.", inZiel);
      if (ziel >= start) return fail("Dein Zielgewicht muss unter deinem Gewicht heute liegen.", inZiel);
      root.classList.remove("is-invalid");

      var diff = Math.round((start - ziel) * 10) / 10;
      var weeks = Math.ceil(diff / rate);
      var goalDate = addDays(today(), weeks * 7);
      var ganzeKilos = Math.floor(diff);

      outKg.innerHTML = kg(diff) + "<small>von " + kg(start) + " auf " + kg(ziel) + "</small>";
      outPreis.innerHTML = eur(ganzeKilos * PREIS) + "<small>" + nf0.format(ganzeKilos) + " × " + eur(PREIS) + " pro Kilo</small>";
      outDauer.innerHTML = weeks + NBSP + "Wochen<small>Ziel etwa im " + fmtMonthYear.format(goalDate) + "</small>";

      if (diff < 15) {
        msgBox.textContent = "Für ein paar Kilo brauchst du mich wahrscheinlich nicht. Der Kilo-Pakt ist für alle gedacht, die 20 Kilo und mehr vor sich haben.";
        msgBox.hidden = false;
      } else {
        msgBox.hidden = true;
      }

      var marks = [5, 10, 20, 30, 50, 75, 100, 150].filter(function (m) { return m < diff - 0.5; });
      var rows = marks.map(function (m) { return { label: "−" + m + NBSP + "kg", lost: m }; });
      rows.push({ label: "Ziel: " + kg(ziel), lost: diff, goal: true });
      tbody.innerHTML = rows.map(function (r) {
        var w = Math.ceil(r.lost / rate);
        return "<tr" + (r.goal ? ' class="is-highlight"' : "") + ">" +
          '<th scope="row">' + r.label + "</th>" +
          '<td class="num">' + w + "</td>" +
          "<td>" + fmtMonthShort.format(addDays(today(), w * 7)) + "</td>" +
          '<td class="num">' + eur(Math.floor(r.lost) * PREIS) + "</td></tr>";
      }).join("");

      if (cta) {
        cta.href = (cta.getAttribute("data-base") || "kontakt.html") +
          "?start=" + encodeURIComponent(start) + "&ziel=" + encodeURIComponent(ziel);
      }

      model = { start: start, ziel: ziel, rate: rate, diff: diff, marks: marks };
      drawChart();
    }

    function niceStep(span, maxTicks, steps) {
      for (var i = 0; i < steps.length; i++) if (span / steps[i] <= maxTicks) return steps[i];
      return steps[steps.length - 1];
    }

    function drawChart() {
      var m = model;
      if (!m) return;
      // Zeichenfläche 1:1 zur echten Breite, damit die Beschriftung auf dem Handy lesbar bleibt
      var box = svg.parentNode.clientWidth || 640;
      W = Math.max(280, Math.min(720, Math.round(box)));
      H = W < 480 ? 250 : 300;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var wGoal = m.diff / m.rate;
      var wFast = m.diff / 1;
      var wMax = m.diff / 0.5;

      var step = niceStep(m.start - m.ziel + 4, 6, [5, 10, 20, 25, 50, 100]);
      var yLo = Math.floor((m.ziel - 2) / step) * step;
      var yHi = Math.ceil((m.start + 2) / step) * step;

      var x = function (w) { return M.l + (w / wMax) * (W - M.l - M.r); };
      var y = function (v) { return M.t + (1 - (v - yLo) / (yHi - yLo)) * (H - M.t - M.b); };
      var f = function (n) { return Math.round(n * 10) / 10; };

      var out = [];
      out.push('<g class="grid">');
      for (var v = yLo; v <= yHi; v += step) {
        out.push('<line x1="' + M.l + '" x2="' + (W - M.r) + '" y1="' + f(y(v)) + '" y2="' + f(y(v)) + '"/>');
      }
      out.push('</g><g class="axis">');
      for (v = yLo; v <= yHi; v += step) {
        out.push('<text x="' + (M.l - 10) + '" y="' + f(y(v) + 4) + '" text-anchor="end">' + v + "</text>");
      }
      out.push('<text class="axis-title" x="' + (M.l - 10) + '" y="' + (M.t - 14) + '" text-anchor="end">kg</text>');

      var monthsMax = wMax / 4.345;
      var mStep = niceStep(monthsMax, 6, [1, 2, 3, 6, 12, 24]);
      for (var mo = 0; mo <= monthsMax + 0.01; mo += mStep) {
        var tx = x(mo * 4.345);
        var anchor = mo === 0 ? "start" : "middle";
        out.push('<text x="' + f(tx) + '" y="' + (H - M.b + 22) + '" text-anchor="' + anchor + '">' + (mo === 0 ? "Start" : mo) + "</text>");
      }
      out.push('<text class="axis-title" x="' + (W - M.r) + '" y="' + (H - 4) + '" text-anchor="end">Monate ab Start</text>');
      out.push("</g>");

      out.push('<polygon class="band" points="' +
        f(x(0)) + "," + f(y(m.start)) + " " +
        f(x(wFast)) + "," + f(y(m.ziel)) + " " +
        f(x(wMax)) + "," + f(y(m.ziel)) + '"/>');

      out.push('<line class="line" x1="' + f(x(0)) + '" y1="' + f(y(m.start)) + '" x2="' + f(x(wGoal)) + '" y2="' + f(y(m.ziel)) + '"/>');

      m.marks.forEach(function (lost) {
        out.push('<circle class="dot" cx="' + f(x(lost / m.rate)) + '" cy="' + f(y(m.start - lost)) + '" r="4"/>');
      });
      out.push('<circle class="dot" cx="' + f(x(0)) + '" cy="' + f(y(m.start)) + '" r="5"/>');
      out.push('<circle class="dot" cx="' + f(x(wGoal)) + '" cy="' + f(y(m.ziel)) + '" r="5"/>');

      out.push('<text class="end-label" x="' + f(x(0) + 12) + '" y="' + f(y(m.start) - 12) + '">' + kg(m.start) + " heute</text>");
      // Ziel-Beschriftung unter dem Punkt: Dort liegt nie die Linie
      var gx = x(wGoal);
      var gAnchor = gx > W - M.r - 45 ? "end" : gx < M.l + 45 ? "start" : "middle";
      out.push('<text class="end-label" x="' + f(gx) + '" y="' + f(y(m.ziel) + 22) + '" text-anchor="' + gAnchor + '">Ziel ' + kg(m.ziel) + "</text>");

      out.push('<g class="cross-g" visibility="hidden"><line class="cross" y1="' + M.t + '" y2="' + (H - M.b) + '"/><circle class="cross-dot" r="5"/></g>');
      out.push('<rect x="' + M.l + '" y="' + M.t + '" width="' + (W - M.l - M.r) + '" height="' + (H - M.t - M.b) + '" fill="transparent" pointer-events="all"/>');

      svg.innerHTML = out.join("");
      svg.setAttribute("aria-label", "Verlauf: von " + kg(m.start) + " auf " + kg(m.ziel) +
        " in etwa " + Math.ceil(wGoal) + " Wochen bei " + nf1.format(m.rate) + " kg pro Woche. Die Etappen stehen in der Tabelle darunter.");

      m.x = x;
      m.y = y;
      m.wMax = wMax;
      m.wGoal = wGoal;
    }

    function hideTip() {
      var g = $(".cross-g", svg);
      if (g) g.setAttribute("visibility", "hidden");
      if (tip) tip.hidden = true;
    }

    function onPointer(e) {
      if (!model || !model.x || !tip) return;
      var rect = svg.getBoundingClientRect();
      var sx = ((e.clientX - rect.left) / rect.width) * W;
      var w = ((sx - M.l) / (W - M.l - M.r)) * model.wMax;
      w = Math.max(0, Math.min(model.wGoal, w));
      var weight = model.start - model.rate * w;
      var cx = model.x(w);
      var cy = model.y(weight);

      var g = $(".cross-g", svg);
      g.setAttribute("visibility", "visible");
      var line = $("line", g);
      line.setAttribute("x1", cx);
      line.setAttribute("x2", cx);
      var dot = $("circle", g);
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", cy);

      var week = Math.round(w);
      var bezahlt = Math.floor(model.start - weight + 1e-9) * PREIS;
      tip.innerHTML = "<strong>Woche " + week + ": ca. " + kg(Math.round(weight * 10) / 10) + "</strong>" +
        fmtMonthShort.format(addDays(today(), week * 7)) + ", bis hier " + eur(bezahlt);
      tip.style.left = Math.min(84, Math.max(16, (cx / W) * 100)) + "%";
      tip.style.top = (cy / H) * 100 + "%";
      tip.hidden = false;
    }

    svg.addEventListener("pointermove", onPointer);
    svg.addEventListener("pointerdown", onPointer);
    svg.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hideTip(); });

    window.addEventListener("resize", function () {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(function () { hideTip(); drawChart(); });
    });

    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); update(); });
    update();
  }

  /* ---------- Vorher / Nachher ---------- */

  $$("[data-ba]").forEach(function (ba) {
    var range = $("input[type=range]", ba);
    if (!range) return;
    function set() { ba.style.setProperty("--pos", range.value + "%"); }
    range.addEventListener("input", set);
    set();
  });

  /* ---------- Karussell ---------- */

  $$("[data-carousel]").forEach(function (c) {
    var track = $("[data-track]", c);
    var slides = $$(".slide", c);
    var prev = $("[data-prev]", c);
    var next = $("[data-next]", c);
    var status = $("[data-status]", c);
    if (!track || !slides.length || !prev || !next) return;

    function perView() {
      var w = slides[0].getBoundingClientRect().width;
      return w ? Math.max(1, Math.round((track.clientWidth + 16) / (w + 16))) : 1;
    }

    function current() {
      var best = 0;
      var bestDist = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - track.scrollLeft);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function update() {
      var pv = perView();
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      var i = atEnd ? Math.max(0, slides.length - pv) : current();
      var lastShown = Math.min(slides.length, i + pv);
      status.textContent = (lastShown - i > 1 ? (i + 1) + "–" + lastShown : String(i + 1)) + " von " + slides.length;
      prev.disabled = i <= 0;
      next.disabled = atEnd;
    }

    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    }

    prev.addEventListener("click", function () { go(current() - 1); });
    next.addEventListener("click", function () { go(current() + 1); });

    var raf = 0;
    track.addEventListener("scroll", function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Erstgespräch buchen ---------- */

  var booking = $("[data-booking]");
  if (booking) initBooking(booking);

  function initBooking(form) {
    var steps = $$("[data-step]", form);
    var progress = $$("[data-progress] li", form);
    var daysBox = $("[data-cal-days]", form);
    var monthLabel = $("[data-cal-month]", form);
    var prevMonth = $("[data-cal-prev]", form);
    var nextMonth = $("[data-cal-next]", form);
    var slotsBox = $("[data-slots]", form);
    var err1 = $('[data-error="1"]', form);
    var err2 = $('[data-error="2"]', form);
    var submitBtn = $("button[type=submit]", form);
    var submitLabel = submitBtn ? submitBtn.textContent : "";

    var freieTage = CFG.freieTage || [0];
    var uhrzeiten = CFG.uhrzeiten || ["10:00", "14:00", "18:00"];
    var first = addDays(today(), 1);
    var last = addDays(today(), CFG.tageVoraus || 30);
    var view = new Date(first.getFullYear(), first.getMonth(), 1);
    var state = { date: "", time: "" };

    function renderCalendar() {
      monthLabel.textContent = fmtMonthYear.format(view);
      var html = [];
      var lead = (view.getDay() + 6) % 7;
      var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var i = 0; i < lead; i++) html.push('<span aria-hidden="true"></span>');
      for (var d = 1; d <= daysInMonth; d++) {
        var date = new Date(view.getFullYear(), view.getMonth(), d);
        var id = isoDate(date);
        var off = date < first || date > last || freieTage.indexOf(date.getDay()) !== -1;
        html.push('<span class="cal__day"><input type="radio" name="tag" id="tag-' + id + '" value="' + id + '"' +
          ' aria-label="' + fmtDayLong.format(date) + (off ? ", nicht wählbar" : "") + '"' +
          (off ? " disabled" : "") + (state.date === id ? " checked" : "") +
          '><label for="tag-' + id + '">' + d + "</label></span>");
      }
      daysBox.innerHTML = html.join("");
      prevMonth.disabled = view <= new Date(first.getFullYear(), first.getMonth(), 1);
      nextMonth.disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > last;
    }

    function renderSlots() {
      if (!state.date) {
        slotsBox.innerHTML = '<p class="field__hint">Wähle zuerst einen Tag im Kalender.</p>';
        return;
      }
      slotsBox.innerHTML = '<div class="chips">' + uhrzeiten.map(function (t) {
        var id = "zeit-" + t.replace(":", "");
        return '<span class="chip"><input type="radio" name="uhrzeit" id="' + id + '" value="' + t + '"' +
          (state.time === t ? " checked" : "") + '><label for="' + id + '">' + t + NBSP + "Uhr</label></span>";
      }).join("") + "</div>";
    }

    function showStep(n, moveFocus) {
      steps.forEach(function (s) { s.hidden = s.getAttribute("data-step") !== String(n); });
      progress.forEach(function (li, i) {
        li.classList.toggle("is-done", i + 1 < n);
        if (i + 1 === n) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      });
      if (!moveFocus) return;
      var heading = $('[data-step="' + n + '"] [data-focus]', form);
      if (heading) heading.focus({ preventScroll: true });
      var top = form.getBoundingClientRect().top + window.scrollY - 96;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    }

    function setFieldError(input, message) {
      var box = document.getElementById(input.id + "-error");
      if (message) {
        input.setAttribute("aria-invalid", "true");
        if (box) { box.textContent = message; box.hidden = false; }
        return false;
      }
      input.removeAttribute("aria-invalid");
      if (box) { box.textContent = ""; box.hidden = true; }
      return true;
    }

    function validateDetails() {
      var nameIn = document.getElementById("b-name");
      var telIn = document.getElementById("b-telefon");
      var mailIn = document.getElementById("b-email");
      var consentIn = document.getElementById("b-einwilligung");
      var tel = telIn.value.trim();
      var mail = mailIn.value.trim();

      var checks = [
        [nameIn, nameIn.value.trim() ? "" : "Wie heißt du? Der Vorname reicht."],
        [telIn, !tel && !mail ? "Gib eine Telefonnummer oder eine E-Mail-Adresse an, damit ich dich erreiche."
          : tel && !/^[+()0-9\s\/-]{6,}$/.test(tel) ? "Diese Nummer sieht unvollständig aus. Erlaubt sind Ziffern, Leerzeichen und +." : ""],
        [mailIn, mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) ? "Diese E-Mail-Adresse sieht unvollständig aus, zum Beispiel name@beispiel.de." : ""],
        [consentIn, consentIn.checked ? "" : "Bitte bestätige die Einwilligung, sonst darf ich deine Anfrage nicht bearbeiten."]
      ];

      var firstBad = null;
      checks.forEach(function (c) {
        if (!setFieldError(c[0], c[1]) && !firstBad) firstBad = c[0];
      });
      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    function finish(data, preview) {
      var artText = { "Telefon": "per Telefon", "Video": "per Videocall", "Vor Ort": "vor Ort in Düsseldorf" };
      $("[data-done-name]", form).textContent = String(data.name).trim().split(/\s+/)[0];
      $("[data-done-when]", form).textContent = fmtDay.format(fromIso(data.termin)) + " um " + data.uhrzeit + NBSP + "Uhr";
      $("[data-done-art]", form).textContent = artText[data.art] || data.art;
      $("[data-preview]", form).hidden = !preview;
      showStep(3, true);
    }

    daysBox.addEventListener("change", function (e) {
      if (e.target.name !== "tag") return;
      state.date = e.target.value;
      renderSlots();
      err1.hidden = true;
    });

    slotsBox.addEventListener("change", function (e) {
      if (e.target.name !== "uhrzeit") return;
      state.time = e.target.value;
      err1.hidden = true;
    });

    prevMonth.addEventListener("click", function () {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      renderCalendar();
    });

    nextMonth.addEventListener("click", function () {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      renderCalendar();
    });

    form.addEventListener("click", function (e) {
      if (e.target.closest("[data-next]")) {
        if (!state.date || !state.time) {
          err1.textContent = !state.date ? "Wähle einen Tag für dein Erstgespräch." : "Wähle noch eine Uhrzeit.";
          err1.hidden = false;
          return;
        }
        showStep(2, true);
      }
      if (e.target.closest("[data-back]")) showStep(1, true);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err2.hidden = true;
      if (!validateDetails()) return;

      var fd = new FormData(form);
      var data = {
        termin: state.date,
        uhrzeit: state.time,
        art: fd.get("art") || "",
        name: fd.get("name") || "",
        telefon: fd.get("telefon") || "",
        email: fd.get("email") || "",
        gewicht: fd.get("gewicht") || "",
        ziel: fd.get("ziel") || "",
        probiert: fd.getAll("probiert").join(", "),
        warum: fd.get("warum") || "",
        einwilligung: "ja"
      };

      if (!CFG.formularEndpunkt) {
        finish(data, true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Wird gesendet …";
      fetch(CFG.formularEndpunkt, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        finish(data, false);
      }).catch(function () {
        err2.textContent = "Das hat nicht geklappt. Versuch es bitte noch einmal oder schreib mir direkt per WhatsApp oder E-Mail.";
        err2.hidden = false;
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      });
    });

    // Werte aus dem Ziel-Rechner übernehmen (kontakt.html?start=110&ziel=70)
    var params = new URLSearchParams(window.location.search);
    var looksLikeKg = /^\d{2,3}([.,]\d)?$/;
    var prefilled = false;
    [["start", "b-gewicht"], ["ziel", "b-ziel"]].forEach(function (pair) {
      var v = params.get(pair[0]);
      if (v && looksLikeKg.test(v)) {
        document.getElementById(pair[1]).value = v.replace(",", ".");
        prefilled = true;
      }
    });
    var prefillHint = $("[data-prefill-hint]", form);
    if (prefilled && prefillHint) prefillHint.hidden = false;

    renderCalendar();
    renderSlots();
    showStep(1, false);
  }
})();
