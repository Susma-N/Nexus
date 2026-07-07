/* ═══════════════════════════════════════════════════════════════════════
   NEXUS DRAFTING MOTION (COMPLETE)
   Real, state-driven and scroll-driven motion — nothing loops ambiently.
   Requires: GSAP + ScrollTrigger (already loaded in index.html <head>)
   Pairs with: nexus-drafting-system.css
   ═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────────────────────────────────────────────────────
     HOME SCREEN
     ─────────────────────────────────────────────────────── */
  const scrollContainer = document.querySelector('.ln-scroll-container');

  if (scrollContainer) {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.ed-hero-label', { opacity: 0, y: 12, duration: 0.6 })
      .from('.ed-hero-title', { opacity: 0, y: 20, duration: 0.8 }, '-=0.3')
      .from('.ed-hero-sub', { opacity: 0, y: 16, duration: 0.6 }, '-=0.5')
      .from('.ed-cta', { opacity: 0, y: 12, duration: 0.5 }, '-=0.3');

    document.querySelectorAll('.ed-section').forEach((section) => {
      gsap.from(section.querySelectorAll('.up-card, .ed-intro-block, .ed-text-wrap > *'), {
        scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none none' },
        opacity: 0, y: 28, duration: 0.7, stagger: 0.06, ease: 'power2.out',
      });
    });

    if (!reduceMotion) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'nx-profile-svg');
      svg.setAttribute('viewBox', '0 0 100 2000');
      svg.setAttribute('preserveAspectRatio', 'none');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M 2 20 L 2 180 L 98 220 L 98 480 L 2 520 L 2 900 L 98 940 L 98 1300 L 2 1340 L 2 1700 L 98 1740 L 98 1960');
      path.setAttribute('class', 'nx-profile-line');
      svg.appendChild(path);
      scrollContainer.style.position = scrollContainer.style.position || 'relative';
      scrollContainer.prepend(svg);
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      gsap.to(path, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: scrollContainer, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
    }
  }

  if (!reduceMotion) {
    document.querySelectorAll('.magnetic-btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.25, y: y * 0.4, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ───────────────────────────────────────────────────────
     WIZARD + MODULE SCREENS — step/content transitions
     ─────────────────────────────────────────────────────── */
  function revealOnce(container) {
    if (!container || reduceMotion) return;
    const targets = container.querySelectorAll(
      '.card, .step-hero, .alert, .tech-grid > *, .sys-g > *, .train-box, .params-bar, .mhdr, .tab-bar'
    );
    if (!targets.length) return;
    gsap.fromTo(targets,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.04, ease: 'power2.out', overwrite: true }
    );
  }

  const wizardSteps = ['ws1', 'ws2', 'ws3', 'ws4', 'ws5']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  wizardSteps.forEach((stepEl) => {
    const obs = new MutationObserver(() => {
      if (stepEl.style.display !== 'none') revealOnce(stepEl);
    });
    obs.observe(stepEl, { attributes: true, attributeFilter: ['style'] });
  });

  const modContent = document.getElementById('mod-content');
  if (modContent) {
    const modObs = new MutationObserver(() => revealOnce(modContent));
    modObs.observe(modContent, { childList: true });
  }

  document.querySelectorAll('.sb-cat-head').forEach((head) => {
    head.addEventListener('click', () => {
      const cat = head.closest('.sb-cat');
      const items = cat && cat.querySelector('.sb-cat-items');
      if (!items || reduceMotion) return;
      if (cat.classList.contains('expanded')) {
        gsap.fromTo(items.children, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: 'power2.out' });
      }
    });
  });
});