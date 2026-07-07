// /* ═══════════════════════════════════════
//    WATER-BG.JS — Fluid & Gas Dynamics
//    Premium Waterflow, Aeration Bubbles, and Bio-Gas
//    ═══════════════════════════════════════ */
// (function () {
//   const canvas = document.getElementById('water-bg');
//   if (!canvas) return;
//   const ctx = canvas.getContext('2d', { alpha: false });

//   let W, H;
//   let isVisible = true;
//   let time = 0;

//   // Premium Palette
//   const C = {
//     bgDark: '#081420',            // Header gradient start
//     bgMid: '#071d29',             // Header gradient mid (var(--ink))
//     bgLight: '#0d1f33',           // Header gradient end
//     sky: 'rgba(56, 189, 248, ',   // Header cyan highlight (#38bdf8)
//     cyan: 'rgba(14, 165, 233, ',  // Header deep sky blue (#0ea5e9)
//     gas: 'rgba(14, 165, 233, '    // Glows using header sky blue
//   };

//   let bubbles = [];
//   let gasOrbs = [];
//   let waves = [];
//   let particles = [];

//   function initScene() {
//     // 1. Aeration Bubbles (rising quickly)
//     bubbles = [];
//     for(let i=0; i<56; i++) {
//       bubbles.push({
//         x: Math.random() * W,
//         y: Math.random() * H + H, // Start below screen or across it
//         size: Math.random() * 4 + 1,
//         speedY: Math.random() * 1.2 + 0.3,          // Slightly calmer float
//         wobbleSpeed: Math.random() * 0.001 + 0.0005, // Much slower wobble (since time is in ms)
//         wobbleDist: Math.random() * 15 + 5,         // Gentle horizontal drift
//         phase: Math.random() * Math.PI * 2,
//         alpha: Math.random() * 0.4 + 0.1,
//         glowSpeed: Math.random() * 0.002 + 0.001,
//         glowPhase: Math.random() * Math.PI * 2
//       });
//     }

//     // 2. Gas Orbs (slow floating, glowing)
//     gasOrbs = [];
//     for(let i=0; i<15; i++) {
//       gasOrbs.push({
//         x: Math.random() * W,
//         y: Math.random() * H,
//         size: Math.random() * 60 + 30,
//         speedX: (Math.random() - 0.5) * 0.2,
//         speedY: -Math.random() * 0.3 - 0.1,
//         alpha: Math.random() * 0.05 + 0.02
//       });
//     }

//     // 3. Fluid Waves (flowing horizontally)
//     waves = [];
//     for(let i=0; i<3; i++) {
//       waves.push({
//         yOff: H * (0.6 + i*0.15),
//         amp: 50 + Math.random() * 40,
//         freq: 0.001 + Math.random() * 0.001,
//         speed: 0.0005 + Math.random() * 0.0005,
//         phase: Math.random() * Math.PI * 2,
//         color: i % 2 === 0 ? C.cyan : C.sky,
//         alpha: 0.03 + i * 0.02
//       });
//     }

//     // 4. Floating glowing particles (microscopic specks)
//     particles = [];
//     for(let i=0; i<60; i++) {
//       particles.push({
//         x: Math.random() * W,
//         y: Math.random() * H,
//         size: Math.random() * 1.5 + 0.5,
//         speedX: (Math.random() - 0.5) * 0.2,
//         speedY: (Math.random() - 0.5) * 0.2,
//         alpha: Math.random() * 0.5 + 0.1,
//         blinkSpeed: Math.random() * 0.003 + 0.001,
//         phase: Math.random() * Math.PI * 2
//       });
//     }
//   }

//   function resize() {
//     const rect = canvas.parentElement.getBoundingClientRect();
//     W = canvas.width = rect.width;
//     H = canvas.height = rect.height;
//     initScene();
//   }

//   function draw(timeNow) {
//     if (!isVisible) { requestAnimationFrame(draw); return; }
//     time = timeNow;

//     // --- Background Gradient ---
//     const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
//     bgGrad.addColorStop(0, C.bgDark);
//     bgGrad.addColorStop(0.5, C.bgMid);
//     bgGrad.addColorStop(1, C.bgLight);
//     ctx.fillStyle = bgGrad;
//     ctx.fillRect(0, 0, W, H);

//     // --- Draw Waves (Water Flow) ---
//     waves.forEach(wave => {
//       ctx.fillStyle = wave.color + wave.alpha + ')';
//       ctx.beginPath();
//       ctx.moveTo(0, H);
//       for(let x=0; x<=W; x+=40) {
//         let y = wave.yOff + Math.sin(x * wave.freq + time * wave.speed + wave.phase) * wave.amp;
//         ctx.lineTo(x, y);
//       }
//       ctx.lineTo(W, H);
//       ctx.fill();
      
//       // Top wave highlight line
//       ctx.strokeStyle = wave.color + (wave.alpha * 2) + ')';
//       ctx.lineWidth = 1;
//       ctx.stroke();
//     });

//     // --- Draw Gas Orbs ---
//     gasOrbs.forEach(orb => {
//       orb.x += orb.speedX;
//       orb.y += orb.speedY;

//       // Wrap around
//       if (orb.y + orb.size < 0) orb.y = H + orb.size;
//       if (orb.x > W + orb.size) orb.x = -orb.size;
//       else if (orb.x < -orb.size) orb.x = W + orb.size;

//       const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
//       grad.addColorStop(0, C.gas + orb.alpha + ')');
//       grad.addColorStop(1, C.gas + '0)');

//       ctx.fillStyle = grad;
//       ctx.beginPath();
//       ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI*2);
//       ctx.fill();
//     });

//     // --- Draw Aeration Bubbles (with random glow) ---
//     bubbles.forEach(b => {
//       // Move up
//       b.y -= b.speedY;
      
//       // Wobble left/right
//       const wobbleX = b.x + Math.sin(time * b.wobbleSpeed + b.phase) * b.wobbleDist;

//       // Wrap around to bottom when they reach the top
//       if (b.y + b.size < 0) {
//         b.y = H + b.size;
//         b.x = Math.random() * W;
//       }

//       // Random glowing effect based on sine wave
//       const glowStr = Math.sin(time * b.glowSpeed + b.glowPhase);
//       if (glowStr > 0.8) {
//         ctx.shadowBlur = 10 * glowStr;
//         ctx.shadowColor = C.cyan + (glowStr * 0.8) + ')';
//       } else {
//         ctx.shadowBlur = 0;
//       }

//       ctx.strokeStyle = C.sky + b.alpha + ')';
//       ctx.lineWidth = 1.5;
//       ctx.beginPath();
//       ctx.arc(wobbleX, b.y, b.size, 0, Math.PI*2);
//       ctx.stroke();
      
//       // Little highlight inside bubble
//       ctx.fillStyle = C.sky + (b.alpha * 0.5) + ')';
//       ctx.beginPath();
//       ctx.arc(wobbleX - b.size*0.3, b.y - b.size*0.3, b.size*0.2, 0, Math.PI*2);
//       ctx.fill();

//       // Reset shadow
//       ctx.shadowBlur = 0;
//     });

//     // --- Draw Floating Particles ---
//     particles.forEach(p => {
//       p.x += p.speedX;
//       p.y += p.speedY;

//       // Wrap around
//       if (p.y < 0) p.y = H;
//       if (p.y > H) p.y = 0;
//       if (p.x > W) p.x = 0;
//       if (p.x < 0) p.x = W;

//       // Blinking effect
//       const currentAlpha = p.alpha + Math.sin(time * p.blinkSpeed + p.phase) * 0.5;
//       if (currentAlpha > 0) {
//         ctx.fillStyle = C.sky + currentAlpha + ')';
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
//         ctx.fill();
//       }
//     });

//     // --- Vignette / Shadow Overlay ---
//     const vignette = ctx.createRadialGradient(W/2, H/2, W*0.3, W/2, H/2, W*0.8);
//     vignette.addColorStop(0, 'rgba(7, 29, 41, 0)');
//     vignette.addColorStop(1, 'rgba(7, 29, 41, 0.7)');
//     ctx.fillStyle = vignette;
//     ctx.fillRect(0, 0, W, H);

//     requestAnimationFrame(draw);
//   }

//   // Listeners
//   if ('IntersectionObserver' in window) {
//     new IntersectionObserver(
//       ([e]) => { isVisible = e.isIntersecting; },
//       { threshold: 0.01 }
//     ).observe(canvas);
//   }
//   window.addEventListener('resize', resize);
  
//   // Init
//   resize();
//   requestAnimationFrame(draw);
// })();

/* ═══════════════════════════════════════
   WATER-BG.JS — Quiet Ledger Field
   Same particle system (kept for continuity/performance behavior) but
   recolored from cyan to ink/rust, and every glow (shadowBlur) removed.
   Alpha values pulled down further since this sits behind opaque paper
   sections now and should never dominate a gap or edge.
   ═══════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('water-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  let W, H;
  let isVisible = true;
  let time = 0;

  // Ledger palette — ink base, rust used sparingly, no cyan anywhere
  const C = {
    bgDark: '#14120F',
    bgMid: '#1B1B18',
    bgLight: '#201D18',
    rust: 'rgba(181, 74, 40, ',
    ink: 'rgba(138, 130, 114, '  // muted warm gray, stands in for the old "sky" highlight
  };

  let bubbles = [];
  let gasOrbs = [];
  let waves = [];
  let particles = [];

  function initScene() {
    bubbles = [];
    for (let i = 0; i < 30; i++) { // fewer — this is a quiet field, not a feature
      bubbles.push({
        x: Math.random() * W,
        y: Math.random() * H + H,
        size: Math.random() * 3 + 1,
        speedY: Math.random() * 0.8 + 0.2,
        wobbleSpeed: Math.random() * 0.001 + 0.0005,
        wobbleDist: Math.random() * 12 + 4,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.15 + 0.05
      });
    }

    gasOrbs = [];
    for (let i = 0; i < 8; i++) {
      gasOrbs.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 50 + 30,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: -Math.random() * 0.2 - 0.05,
        alpha: Math.random() * 0.03 + 0.01
      });
    }

    waves = [];
    for (let i = 0; i < 2; i++) {
      waves.push({
        yOff: H * (0.65 + i * 0.15),
        amp: 40 + Math.random() * 30,
        freq: 0.001 + Math.random() * 0.001,
        speed: 0.0004 + Math.random() * 0.0004,
        phase: Math.random() * Math.PI * 2,
        color: C.ink,
        alpha: 0.02 + i * 0.01
      });
    }

    particles = [];
    for (let i = 0; i < 24; i++) { // trimmed — the specks read as dust, not sparkle
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 1.2 + 0.4,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.25 + 0.05,
        blinkSpeed: Math.random() * 0.002 + 0.0008,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // Static gradients — their shape never changes frame to frame, only on
  // resize, so they're built once here instead of being reconstructed
  // ~60 times a second. Rebuilding a gradient object every frame was pure
  // wasted main-thread work and a real contributor to the general lag.
  let bgGrad = null;
  let vignette = null;

  function buildStaticGradients() {
    bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, C.bgDark);
    bgGrad.addColorStop(0.5, C.bgMid);
    bgGrad.addColorStop(1, C.bgLight);

    vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
    vignette.addColorStop(0, 'rgba(20,18,15,0)');
    vignette.addColorStop(1, 'rgba(20,18,15,0.55)');
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
    initScene();
    buildStaticGradients();
  }

  function draw(timeNow) {
    if (!isVisible) { requestAnimationFrame(draw); return; }
    time = timeNow;

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    waves.forEach(wave => {
      ctx.fillStyle = wave.color + wave.alpha + ')';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) {
        let y = wave.yOff + Math.sin(x * wave.freq + time * wave.speed + wave.phase) * wave.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.fill();
      ctx.strokeStyle = wave.color + (wave.alpha * 1.5) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    gasOrbs.forEach(orb => {
      orb.x += orb.speedX;
      orb.y += orb.speedY;
      if (orb.y + orb.size < 0) orb.y = H + orb.size;
      if (orb.x > W + orb.size) orb.x = -orb.size;
      else if (orb.x < -orb.size) orb.x = W + orb.size;

      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
      grad.addColorStop(0, C.rust + orb.alpha + ')');
      grad.addColorStop(1, C.rust + '0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // No shadowBlur anywhere below — glow removed entirely
    bubbles.forEach(b => {
      b.y -= b.speedY;
      const wobbleX = b.x + Math.sin(time * b.wobbleSpeed + b.phase) * b.wobbleDist;
      if (b.y + b.size < 0) { b.y = H + b.size; b.x = Math.random() * W; }

      ctx.strokeStyle = C.ink + b.alpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(wobbleX, b.y, b.size, 0, Math.PI * 2);
      ctx.stroke();
    });

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      if (p.x > W) p.x = 0;
      if (p.x < 0) p.x = W;

      const currentAlpha = Math.max(0, p.alpha + Math.sin(time * p.blinkSpeed + p.phase) * 0.15);
      if (currentAlpha > 0) {
        ctx.fillStyle = C.ink + currentAlpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => { isVisible = e.isIntersecting; },
      { threshold: 0.01 }
    ).observe(canvas);
  }
  window.addEventListener('resize', resize);

  resize();
  requestAnimationFrame(draw);
})();
