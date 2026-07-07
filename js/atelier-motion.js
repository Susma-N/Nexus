/* Field Ledger motion layer — additive only. Doesn't touch state.js, wizard.js,
   modules.js, cursor.js, or premium-scroll.js. Safe to remove independently. */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var home = document.getElementById("screen-home");
    if (!home) return;

    /* 1) Reveal-on-scroll safety net.
       If an existing script already toggles .in-view on .cinematic-section,
       this simply agrees with it. If nothing does, this makes sure content
       still appears (never leaves sections stuck at opacity:0). */
    var sections = document.querySelectorAll(".cinematic-section");
    if ("IntersectionObserver" in window && sections.length) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              entry.target.style.opacity = "1";
              entry.target.style.transform = "none";
              entry.target.style.filter = "none";
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      sections.forEach(function (s) { io.observe(s); });
    }

    /* 2) A running ledger index — "§ 01 / 06" — pinned in the hero margin,
       counting the editorial slides as you pass them. Small, quiet detail
       that reads as deliberate rather than templated. */
    var slides = document.querySelectorAll(".ed-section.ed-left, .ed-section.ed-right");
    if (slides.length) {
      var tracker = document.createElement("div");
      tracker.setAttribute("aria-hidden", "true");
      tracker.style.cssText = [
        "position:fixed", "right:28px", "top:50%", "transform:translateY(-50%)",
        "font-family:'JetBrains Mono',monospace", "font-size:11px",
        "letter-spacing:1px", "color:rgba(243,238,227,0.55)", "z-index:40",
        "writing-mode:vertical-rl", "text-orientation:mixed",
        "pointer-events:none", "transition:opacity .3s ease", "opacity:0"
      ].join(";");
      home.appendChild(tracker);

      var total = slides.length;
      function pad(n) { return n < 10 ? "0" + n : "" + n; }

      var trackObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var idx = Array.prototype.indexOf.call(slides, entry.target) + 1;
              tracker.textContent = "\u00A7 " + pad(idx) + " / " + pad(total);
              tracker.style.opacity = "1";
            }
          });
        },
        { threshold: 0.5 }
      );
      slides.forEach(function (s) { trackObserver.observe(s); });

      var hero = document.querySelector(".ed-hero");
      if (hero) {
        var heroObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) tracker.style.opacity = "0";
            });
          },
          { threshold: 0.3 }
        );
        heroObserver.observe(hero);
      }
    }

    /* 3) A real magnetic button — nudges toward the pointer, snaps back on
       leave. This is the one place "magnetic" should actually mean magnetic. */
    document.querySelectorAll(".magnetic-btn").forEach(function (btn) {
      var strength = 14;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform =
          "translate(" + (x / r.width) * strength + "px," + (y / r.height) * strength + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "translate(0,0)";
      });
    });

    /* 4) Hero title: split into lines and reveal each with a clip-path wipe,
       staggered slightly — the "ink hitting paper" motion instead of a
       fade-and-float. Only runs once per element. */
    var heroTitle = document.querySelector(".ed-hero-title");
    if (heroTitle && !heroTitle.dataset.wiped) {
      heroTitle.dataset.wiped = "1";
      var lines = heroTitle.querySelectorAll(":scope > *, br + *");
      heroTitle.style.opacity = "1";
      var nodes = Array.prototype.slice.call(heroTitle.children);
      nodes.forEach(function (node, i) {
        node.style.display = "inline-block";
        node.style.clipPath = "inset(0 0 100% 0)";
        node.style.transition = "clip-path .7s cubic-bezier(.65,0,.35,1)";
        node.style.transitionDelay = i * 0.12 + "s";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            node.style.clipPath = "inset(0 0 0% 0)";
          });
        });
      });
    }
  });
})();