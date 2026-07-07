/* ═══════════════════════════════════════════════════════════════════════
   PROCESS ARCHIVE — scroll-driven intro sequence (controller)
   Drives #pa-panel / #pa-wrap / #pa-grid / #pa-caption / #pa-spec / #pa-cta /
   #pa-footer / #pa-outro-overlay / .pa-reg against raw scrollY, independent
   of the Lenis-smoothed scroll used further down the page (see
   css/process-archive.css header comment for why).

   PERFORMANCE NOTES (fixes applied here):
   - Every rAF tick does exactly ONE layout read (window.scrollY / cached
     viewport height) and then only ever WRITES transform/opacity. No
     getBoundingClientRect() is called per-card, per-frame — card stagger
     timing is precomputed once as plain numbers at init/resize, not
     measured live. That's what was causing the frame-by-frame layout
     thrashing.
   - The rAF loop only runs while scrollY is within (or near) the sequence's
     scroll range. Outside that range it's fully cancelled, not just
     no-op'ing — so it isn't competing for frame budget with the rest of
     the page's scroll.

   CONTRAST FIX:
   - The exclusion-blended caption/spec/footer/reg-marks now fully fade out
     BEFORE the paper-colored outro overlay ramps up, instead of overlapping
     with it. `mix-blend-mode: exclusion` reads great on pure black/white but
     turns to low-contrast gray against a mid-fade overlay — so we simply
     never let that overlap happen for more than a few frames.
   - Once the sequence completes, the entire fixed-position stack is set to
     visibility:hidden (not just faded), so there's no possibility of any
     panel/overlay layer lingering on top of the rest of the site while the
     user keeps scrolling.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  var spacer = document.getElementById('pa-spacer');
  if (!spacer) return;

  var panel = document.getElementById('pa-panel');
  var wrap = document.getElementById('pa-wrap');
  var grid = document.getElementById('pa-grid');
  var caption = document.getElementById('pa-caption');
  var spec = document.getElementById('pa-spec');
  var specVal = document.getElementById('pa-spec-val');
  var specSymbol = document.getElementById('pa-spec-symbol');
  var cta = document.getElementById('pa-cta');
  var footer = document.getElementById('pa-footer');
  var outro = document.getElementById('pa-outro-overlay');
  var regTl = document.querySelector('.pa-reg.tl');
  var regBr = document.querySelector('.pa-reg.br');
  var heroVideo = document.querySelector('#pa-hero-video video');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 10 unit-process categories, matching the same set used by the
     card-fx module icons elsewhere on the page ── */
  var PROCESSES = [
    { tag: 'Preliminary · Screening',      img: 'img/image1.jpg',               symbol: 'Q' },
    { tag: 'Primary · Clarifier',          img: 'img/hero_clarifier.png',       symbol: 'C' },
    { tag: 'Secondary · Aeration/Biofilm', img: 'img/editorial_aeration.png',   symbol: 'A' },
    { tag: 'Membrane · MBR/Tertiary',      img: 'img/image2.png',               symbol: 'M' },
    { tag: 'Flotation · DAF',              img: 'img/image3.png',               symbol: 'F' },
    { tag: 'Fixed Film · Trickling',       img: 'img/image4.png',               symbol: 'T' },
    { tag: 'Anaerobic · Digester',         img: 'img/image5.png',               symbol: 'D' },
    { tag: 'Plant-Wide · Mass Balance',    img: 'img/isometric_bg.png',         symbol: 'B' },
    { tag: 'Industrial · Precipitation',   img: 'img/image6.png',               symbol: 'I' },
    { tag: 'Natural · Lagoons',            img: 'img/editorial_pipelines.png',  symbol: 'N' }
  ];

  /* ── build the grid once (it ships empty in the markup) ── */
  if (grid && !grid.children.length) {
    var frag = document.createDocumentFragment();
    PROCESSES.forEach(function (p, i) {
      var cell = document.createElement('div');
      cell.className = 'pa-cell';
      var side = i % 2 === 0 ? 'left' : 'right';
      cell.innerHTML =
        '<div class="pa-card ' + side + '" data-i="' + i + '">' +
          '<img src="' + p.img + '" alt="' + p.tag + '" loading="lazy">' +
          '<div class="pa-card-tag">' + p.tag + '</div>' +
        '</div>';
      frag.appendChild(cell);
    });
    grid.appendChild(frag);
  }
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.pa-card')) : [];

  /* NOTE: no custom cursor is created here. js/cursor.js already runs a
     full-page custom crosshair cursor site-wide (that's what the CSS
     `cursor: none` on #pa-spacer is for) — an earlier version of this file
     mistakenly added a second, competing cursor on top of it. Removed. */

  /* ── layout metrics: computed once at init + on (debounced) resize.
     NEVER recomputed inside the per-frame loop. ── */
  var vh = 0, spacerHeight = 0, scrollRange = 0;
  var SEQUENCE_VH_MULT = 4.25; // how many viewport-heights of scroll the sequence occupies

  function measure() {
    vh = window.innerHeight;
    spacerHeight = reduceMotion ? vh : Math.round(vh * SEQUENCE_VH_MULT);
    spacer.style.height = spacerHeight + 'px';
    scrollRange = Math.max(1, spacerHeight - vh);
  }
  measure();

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 150);
  }, { passive: true });

  /* ── easing ── */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function mapRange(v, a, b) { return clamp01((v - a) / (b - a)); }

  /* ── phase boundaries, as fractions of total sequence progress ── */
  var PH = {
    regInStart: 0.0, regInEnd: 0.06,
    capInStart: 0.02, capInEnd: 0.09,
    specInStart: 0.06, specInEnd: 0.14,
    panelStart: 0.12, panelEnd: 0.58,
    cardsStart: 0.22, cardsEnd: 0.62,
    ctaStart: 0.60, ctaEnd: 0.72,
    footerStart: 0.64, footerEnd: 0.74,
    overlayTextOutStart: 0.80, overlayTextOutEnd: 0.90, // fully gone before overlay covers
    outroStart: 0.86, outroEnd: 1.0
  };

  /* precomputed per-card stagger window (plain arithmetic, no DOM reads) */
  var cardWindows = cards.map(function (_, i) {
    var span = PH.cardsEnd - PH.cardsStart;
    var perCard = span * 0.65; // overlap between neighboring cards
    var step = (span - perCard) / Math.max(1, cards.length - 1);
    var start = PH.cardsStart + step * i;
    return { start: start, end: start + perCard };
  });

  var progress = 0;
  var rafId = null;
  var running = false;

  function setStaticFinalState() {
    /* reduced-motion / instant settle: everything visible, no animation */
    if (panel) panel.style.transform = 'translateY(0)';
    if (caption) { caption.style.opacity = '1'; caption.style.transform = 'translateY(0)'; }
    if (spec) { spec.style.opacity = '1'; spec.style.transform = 'translateY(0)'; spec.classList.add('on'); }
    if (footer) footer.style.opacity = '1';
    if (cta) cta.style.transform = 'scale(1)';
    cards.forEach(function (c) { c.style.transform = 'scale(1) rotate(0deg)'; });
  }

  function render() {
    var sTop = spacer.getBoundingClientRect().top; // single read for the whole frame
    progress = clamp01(-sTop / scrollRange);

    /* registration marks + caption */
    var regP = easeOutCubic(mapRange(progress, PH.regInStart, PH.regInEnd));
    if (regTl) regTl.style.opacity = regP;
    if (regBr) regBr.style.opacity = regP;

    var capP = easeOutCubic(mapRange(progress, PH.capInStart, PH.capInEnd));
    var textOutP = mapRange(progress, PH.overlayTextOutStart, PH.overlayTextOutEnd);
    var capVis = capP * (1 - textOutP);
    if (caption) {
      caption.style.opacity = capVis;
      caption.style.transform = 'translateY(' + (12 * (1 - capP)) + 'px)';
    }

    var specP = easeOutCubic(mapRange(progress, PH.specInStart, PH.specInEnd));
    var specVis = specP * (1 - textOutP);
    if (spec) {
      spec.style.opacity = specVis;
      spec.style.transform = 'translateY(' + (12 * (1 - specP)) + 'px)';
    }

    /* the ink panel sliding up */
    var panelP = easeOutCubic(mapRange(progress, PH.panelStart, PH.panelEnd));
    if (panel) panel.style.transform = 'translateY(' + (100 * (1 - panelP)) + 'vh)';
    if (wrap) wrap.style.transform = 'translateY(' + (-24 * panelP) + 'px)'; // gentle parallax settle
    if (heroVideo) heroVideo.style.transform = 'scale(' + (1 + 0.06 * progress) + ')'; // slow push-in

    /* card grid — precomputed windows, transform-only writes */
    for (var i = 0; i < cards.length; i++) {
      var w = cardWindows[i];
      var cp = easeOutCubic(mapRange(progress, w.start, w.end));
      var rot = (i % 2 === 0 ? -1 : 1) * 4 * (1 - cp);
      cards[i].style.transform = 'scale(' + cp + ') rotate(' + rot + 'deg)';
    }

    /* CTA + footer */
    var ctaP = easeOutCubic(mapRange(progress, PH.ctaStart, PH.ctaEnd));
    var ctaVis = ctaP * (1 - mapRange(progress, PH.overlayTextOutStart, PH.overlayTextOutEnd));
    if (cta) cta.style.transform = 'scale(' + ctaVis + ')';

    var footerP = easeInOutQuad(mapRange(progress, PH.footerStart, PH.footerEnd));
    var footerVis = footerP * (1 - textOutP);
    if (footer) footer.style.opacity = footerVis;

    /* outro overlay — only begins once text has already cleared, so we
       never render exclusion-blended text mid-fade over the paper tone */
    var outroP = easeInOutQuad(mapRange(progress, PH.outroStart, PH.outroEnd));
    if (outro) outro.style.opacity = outroP;

    /* once fully past the sequence, remove the whole fixed stack from the
       render/hit-test path so nothing can linger over the page below */
    if (progress >= 0.995) {
      spacer.style.visibility = 'hidden';
      spacer.style.pointerEvents = 'none';
    } else {
      spacer.style.visibility = 'visible';
      spacer.style.pointerEvents = '';
    }

    /* auto-pause: stop the loop once comfortably outside the sequence
       range in either direction, resume via the scroll listener below */
    if (progress <= 0 || progress >= 1) {
      running = false;
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(render);
  }

  function ensureRunning() {
    if (running) return;
    var sTop = spacer.getBoundingClientRect().top;
    var p = clamp01(-sTop / scrollRange);
    // small buffer so we start a frame early/late rather than exactly at 0/1
    if (p > -0.02 && p < 1.02) {
      running = true;
      rafId = requestAnimationFrame(render);
    }
  }

  if (reduceMotion) {
    setStaticFinalState();
    if (spec) spec.classList.add('on');
  } else {
    ensureRunning();
    window.addEventListener('scroll', ensureRunning, { passive: true });
  }

  /* CTA — skip straight past the intro sequence */
  if (cta) {
    cta.addEventListener('click', function () {
      var target = spacerHeight;
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(target, { duration: 1.4 });
      } else {
        window.scrollTo({ top: target, behavior: 'smooth' });
      }
    });
  }

  /* small injected style for a subtle accent sweep on card hover, kept
     here so no CSS file edit was required for this fix */
  var style = document.createElement('style');
  style.textContent =
    '.pa-card{position:relative;}' +
    '.pa-card::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,var(--pa-rust) 0%,var(--pa-verdigris) 100%);' +
    'opacity:0;transition:opacity .35s ease;mix-blend-mode:color;pointer-events:none;}' +
    '.pa-card:hover::after{opacity:0.35;}';
  document.head.appendChild(style);
})();
