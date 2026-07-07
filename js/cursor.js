// /* ═══════════════════════════════════════
//    CURSOR.JS — Custom Modern Arrow Cursor
//    ═══════════════════════════════════════ */
// (function() {
//   // Create cursor canvas
//   const canvas = document.createElement('canvas');
//   canvas.id = 'cursor-canvas';
//   canvas.style.position = 'fixed';
//   canvas.style.top = '0';
//   canvas.style.left = '0';
//   canvas.style.width = '100vw';
//   canvas.style.height = '100vh';
//   canvas.style.pointerEvents = 'none';
//   canvas.style.zIndex = '99999';
//   document.body.appendChild(canvas);

//   const ctx = canvas.getContext('2d', { alpha: true });
  
//   let W = window.innerWidth;
//   let H = window.innerHeight;

//   // Mouse state
//   let mouse = { x: -100, y: -100 };
//   let lastMouse = { x: -100, y: -100 };
//   let currentPos = { x: -100, y: -100 };
  
//   // Hover state
//   let isHovering = false;
//   let hoverScale = 1;
//   let targetScale = 1;
//   let hoverColor = null;

//   // Colors
//   const darkBgColor = '#22d3ee'; // Light cyan for dark backgrounds
//   const darkBgGlow = 'rgba(34,211,238,0.5)';
//   const lightBgColor = '#0284c7'; // Dark blue for light backgrounds
//   const lightBgGlow = 'rgba(2,132,199,0.35)';
  
//   let isDarkBackground = true;
//   let isTyping = false;
//   let lastTarget = null;
  
//   // Particles (trails)
//   let particles = [];

//   function resize() {
//     W = canvas.width = window.innerWidth;
//     H = canvas.height = window.innerHeight;
//   }
//   window.addEventListener('resize', resize);
//   resize();

//   // Known dark areas in the app to optimize background detection
//   const darkClasses = ['topnav', 'home-hero', 'sidebar', 'step-hero', 'card-hd', 'steps-nav', 'hero-right-scroll'];

//   function checkDarkBackground(element) {
//     if (!element) return false;
//     let el = element;
//     while (el && el !== document.documentElement) {
//       if (el.classList) {
//         for (let c of darkClasses) {
//           if (el.classList.contains(c)) return true;
//         }
//       }
//       const style = window.getComputedStyle(el);
//       const bg = style.backgroundColor;
//       if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
//         const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
//         if (match) {
//           const r = parseInt(match[1]);
//           const g = parseInt(match[2]);
//           const b = parseInt(match[3]);
//           const lum = (0.299 * r + 0.587 * g + 0.114 * b);
//           return lum < 128; // True if dark
//         }
//       }
//       el = el.parentElement;
//     }
//     return false; // Default light
//   }

//   function spawnTrail(x, y, color) {
//     particles.push({
//       x: x,
//       y: y,
//       vx: (Math.random() - 0.5) * 1.5,
//       vy: (Math.random() - 0.5) * 1.5,
//       life: 1,
//       decay: 0.03 + Math.random() * 0.02,
//       r: Math.random() * 2 + 1,
//       color: color
//     });
//   }

//   window.addEventListener('mousemove', (e) => {
//     lastMouse.x = mouse.x;
//     lastMouse.y = mouse.y;
//     mouse.x = e.clientX;
//     mouse.y = e.clientY;
    
//     // Only recalculate background check if the target element changes
//     if (e.target !== lastTarget) {
//       lastTarget = e.target;
//       isDarkBackground = checkDarkBackground(e.target);
//     }
    
//     // Check if typing (removed to keep custom cursor visible everywhere)
//     isTyping = false;

//     // Spawn trail particle on fast movement
//     if (lastMouse.x !== -100) {
//       const dist = Math.hypot(mouse.x - lastMouse.x, mouse.y - lastMouse.y);
//       if (dist > 5 && Math.random() > 0.3) {
//         let pColor = isDarkBackground ? darkBgGlow : lightBgGlow;
//         if (isHovering && hoverColor) pColor = hoverColor;
//         spawnTrail(mouse.x, mouse.y, pColor);
//       }
//     }
//   });

//   // Detect hover on interactive elements
//   function attachHoverListeners() {
//     const interactives = document.querySelectorAll('button, a, .mgc, .si, .tab, .tc, .sc, .tfn, .nt, .std-p, .sb-cat-head');
    
//     interactives.forEach(el => {
//       if (el.dataset.cursorAttached) return;
//       el.dataset.cursorAttached = 'true';

//       el.addEventListener('mouseenter', () => {
//         isHovering = true;
//         targetScale = 1.15; // Gentle scale effect on hover
        
//         // Extract category color for cards and buttons
//         const style = window.getComputedStyle(el);
//         const catColor = style.getPropertyValue('--cat-color').trim();
        
//         if (catColor) {
//            hoverColor = catColor;
//         } else if (el.tagName === 'BUTTON' && el.classList.contains('amber')) {
//            hoverColor = '#10b981'; // Emerald for main CTA
//         } else {
//            hoverColor = null;
//         }
//       });
      
//       el.addEventListener('mouseleave', () => {
//         isHovering = false;
//         targetScale = 1.0;
//         hoverColor = null;
//       });
//     });
//   }

//   // MutationObserver to attach listeners to dynamically created elements
//   const observer = new MutationObserver(attachHoverListeners);
//   observer.observe(document.body, { childList: true, subtree: true });

//   function render() {
//     requestAnimationFrame(render);
    
//     if (isTyping) {
//         ctx.clearRect(0, 0, W, H);
//         return; // Don't draw custom cursor over text inputs
//     }

//     // Snappy follow to prevent jitter but maintain smoothness
//     currentPos.x += (mouse.x - currentPos.x) * 0.7;
//     currentPos.y += (mouse.y - currentPos.y) * 0.7;
    
//     if (Math.abs(mouse.x - currentPos.x) < 0.1) currentPos.x = mouse.x;
//     if (Math.abs(mouse.y - currentPos.y) < 0.1) currentPos.y = mouse.y;

//     hoverScale += (targetScale - hoverScale) * 0.2;

//     ctx.clearRect(0, 0, W, H);

//     // Render trail particles underneath the arrow
//     for (let i = particles.length - 1; i >= 0; i--) {
//       let p = particles[i];
//       p.x += p.vx;
//       p.y += p.vy;
//       p.life -= p.decay;

//       if (p.life <= 0) {
//         particles.splice(i, 1);
//         continue;
//       }

//       ctx.beginPath();
//       ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      
//       // Extract RGB values to apply alpha fade
//       let colorStr = p.color;
//       if (p.color.startsWith('#')) {
//          // Fake alpha mapping by using globalAlpha
//          ctx.fillStyle = p.color;
//          ctx.globalAlpha = p.life * 0.5;
//       } else {
//          ctx.fillStyle = p.color;
//          ctx.globalAlpha = p.life;
//       }
      
//       ctx.fill();
//       ctx.globalAlpha = 1;
//     }

//     if (currentPos.x < 0 || currentPos.y < 0) return;

//     ctx.save();
//     ctx.translate(currentPos.x, currentPos.y);
//     ctx.scale(hoverScale, hoverScale);

//     // Draw trendy sleek arrow (dart shape)
//     const size = 18;
//     ctx.beginPath();
//     ctx.moveTo(0, 0); // Tip
//     ctx.lineTo(size * 0.25, size * 0.95); // Left wing
//     ctx.lineTo(size * 0.45, size * 0.45); // Inner corner
//     ctx.lineTo(size * 0.95, size * 0.25); // Right wing
//     ctx.closePath();
    
//     ctx.lineJoin = 'round';
//     ctx.lineWidth = 1.2;

//     let fillColor = isDarkBackground ? darkBgColor : lightBgColor;
//     let activeGlowColor = isDarkBackground ? darkBgGlow : lightBgGlow;
    
//     if (isHovering && hoverColor) {
//       fillColor = hoverColor;
//       activeGlowColor = hoverColor; // Use the solid color for the glow as well, CSS handles blur
//     }

//     ctx.shadowColor = activeGlowColor;
//     ctx.shadowBlur = isHovering ? 20 : 12;
    
//     ctx.fillStyle = fillColor;
//     ctx.fill();

//     ctx.restore();
//   }

//   // Initial attachment
//   setTimeout(attachHoverListeners, 100);
//   render();

// })();

/* ═══════════════════════════════════════
   CURSOR.JS — Quiet Ledger Crosshair
   A small ink/rust registration mark, not a glowing dart. No particle
   trail, no shadow blur — reads as a drafting instrument, not a game HUD.
   ═══════════════════════════════════════ */
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });

  let W = window.innerWidth;
  let H = window.innerHeight;

  let mouse = { x: -100, y: -100 };
  let currentPos = { x: -100, y: -100 };

  let isHovering = false;
  let hoverScale = 1;
  let targetScale = 1;
  let hoverColor = null;
  let isDarkBackground = true;
  let isTyping = false;
  let lastTarget = null;

  // Ledger palette — ink on paper, paper on ink, rust on hover. No glow ever.
  const inkColor = '#1B1B18';
  const paperColor = '#F3EEE3';
  const rustColor = '#B54A28';

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const darkClasses = ['topnav', 'home-hero', 'sidebar', 'step-hero', 'card-hd', 'steps-nav', 'hero-right-scroll', 'ed-hero', 'ed-typo-section', 'ed-company-footer'];

  function checkDarkBackground(element) {
    if (!element) return false;
    let el = element;
    while (el && el !== document.documentElement) {
      if (el.classList) {
        for (let c of darkClasses) {
          if (el.classList.contains(c)) return true;
        }
      }
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          const lum = (0.299 * r + 0.587 * g + 0.114 * b);
          return lum < 128;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (e.target !== lastTarget) {
      lastTarget = e.target;
      isDarkBackground = checkDarkBackground(e.target);
    }
    isTyping = false;
  });

  function attachHoverListeners() {
    const interactives = document.querySelectorAll('button, a, .mgc, .si, .tab, .tc, .sc, .tfn, .nt, .std-p, .sb-cat-head');
    interactives.forEach(el => {
      if (el.dataset.cursorAttached) return;
      el.dataset.cursorAttached = 'true';
      el.addEventListener('mouseenter', () => {
        isHovering = true;
        targetScale = 1.08; // a small tick, not a pop
        hoverColor = rustColor;
      });
      el.addEventListener('mouseleave', () => {
        isHovering = false;
        targetScale = 1.0;
        hoverColor = null;
      });
    });
  }

  const observer = new MutationObserver(attachHoverListeners);
  observer.observe(document.body, { childList: true, subtree: true });

  function render() {
    requestAnimationFrame(render);

    if (isTyping) { ctx.clearRect(0, 0, W, H); return; }

    // Direct follow — a drafting instrument doesn't lag or drift
    currentPos.x += (mouse.x - currentPos.x) * 0.85;
    currentPos.y += (mouse.y - currentPos.y) * 0.85;
    hoverScale += (targetScale - hoverScale) * 0.25;

    ctx.clearRect(0, 0, W, H);
    if (currentPos.x < 0 || currentPos.y < 0) return;

    ctx.save();
    ctx.translate(currentPos.x, currentPos.y);
    ctx.scale(hoverScale, hoverScale);
    ctx.shadowBlur = 0; // never glow

    const color = isHovering ? hoverColor : (isDarkBackground ? paperColor : inkColor);
    const armLen = 7;
    const gap = 2.5;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -gap - armLen); ctx.lineTo(0, -gap);
    ctx.moveTo(0, gap); ctx.lineTo(0, gap + armLen);
    ctx.moveTo(-gap - armLen, 0); ctx.lineTo(-gap, 0);
    ctx.moveTo(gap, 0); ctx.lineTo(gap + armLen, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }

  setTimeout(attachHoverListeners, 100);
  render();
})();
