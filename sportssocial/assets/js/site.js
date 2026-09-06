/* Sports Social Marketing — small progressive-enhancement layer. */
(function () {
  "use strict";

  // Mobile navigation
  var toggle = document.querySelector("[data-nav-toggle]");
  var panel = document.querySelector("[data-nav-panel]");
  if (toggle && panel) {
    // The icons are <svg>, and `hidden` is an HTMLElement property, not an
    // SVGElement one — set the attribute rather than the property.
    var iconOpen = toggle.querySelector("[data-icon-open]");
    var iconClose = toggle.querySelector("[data-icon-close]");
    var setState = function (open) {
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      (open ? iconOpen : iconClose).setAttribute("hidden", "");
      (open ? iconClose : iconOpen).removeAttribute("hidden");
    };
    toggle.addEventListener("click", function () {
      setState(!panel.classList.contains("is-open"));
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setState(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        setState(false);
        toggle.focus();
      }
    });
  }

  // Reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if (items.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Count-up on the headline stats
  var nums = document.querySelectorAll("[data-count]");
  if (nums.length && "IntersectionObserver" in window &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        co.unobserve(el);
        var target = parseFloat(el.dataset.count);
        var prefix = el.dataset.prefix || "";
        var suffix = el.dataset.suffix || "";
        var decimals = (String(target).split(".")[1] || "").length;
        var start = performance.now();
        var dur = 1100;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { co.observe(el); });
  }

  // Demo contact form — no backend on the proof of concept
  var form = document.querySelector("[data-demo-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector("[data-form-status]");
      if (status) {
        status.textContent =
          "Demo only — this preview has no mailbox behind it yet. Email hello@sportssocialmarketing.com in the meantime.";
      }
    });
  }

  // Current year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
