/* ═══════════════════════════════════════
   CARD-FX.JS — Process-Specific Module Animations
   Replaces static emojis with tiny animated canvases
   ═══════════════════════════════════════ */
(function() {
  function initCardFx() {
    const cards = document.querySelectorAll('.mgc');
    
    cards.forEach(card => {
      const iconContainer = card.querySelector('.mgc-icon');
      if (!iconContainer || iconContainer.dataset.fxInit) return;
      
      const cat = card.dataset.cat;
      const color = window.getComputedStyle(card).getPropertyValue('--cat-color').trim() || '#0ea5e9';
      
      // Clear emoji
      iconContainer.innerHTML = '';
      iconContainer.dataset.fxInit = 'true';
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      iconContainer.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      let frame = 0;
      let isHovered = false;
      
      card.addEventListener('mouseenter', () => isHovered = true);
      card.addEventListener('mouseleave', () => isHovered = false);

      // --- FX renderers based on category ---
      
      // 1. Clarifier / Circular Settling
      function renderClarifier(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speed = isHovered ? 0.05 : 0.01;
        const cx = 24, cy = 24;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.stroke();
        
        ctx.globalAlpha = 1;
        for(let i=0; i<3; i++) {
          const angle = (frame * speed) + (i * Math.PI * 2 / 3);
          const r = 14 + Math.sin(frame * 0.02 + i) * 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); 
          ctx.fillStyle = color; ctx.fill();
        }
      }

      // 2. Aeration / Bubbles (Secondary Bio, Batch, MBBR)
      let bubbles = Array.from({length: 5}, () => ({x: 12 + Math.random()*24, y: 48 + Math.random()*20, s: 1 + Math.random()*1.5}));
      function renderBubbles(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speedMult = isHovered ? 2 : 0.5;
        ctx.fillStyle = color;
        bubbles.forEach(b => {
          b.y -= b.s * speedMult;
          b.x += Math.sin(frame * 0.1 + b.y) * 0.5;
          if(b.y < -5) { b.y = 55; b.x = 12 + Math.random()*24; }
          ctx.globalAlpha = (b.y / 48) * 0.8 + 0.2;
          ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      // 3. MBR / Filtration (Vertical lines)
      function renderFiltration(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const offset = isHovered ? (frame * 0.5) % 10 : 0;
        
        // Membrane lines
        ctx.globalAlpha = 0.4;
        [16, 24, 32].forEach(x => {
          ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, 40); ctx.stroke();
        });
        
        // Flowing particles
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        [16, 24, 32].forEach((x, i) => {
          const y = 8 + ((offset + i*3) % 32);
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
        });
      }

      // 4. Screening / Pretreatment (Grid)
      function renderScreen(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        
        // Diagonal screen
        ctx.beginPath(); ctx.moveTo(14, 38); ctx.lineTo(34, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18, 40); ctx.lineTo(38, 12); ctx.stroke();
        
        // Moving debris
        const speed = isHovered ? 1 : 0.2;
        const p = (frame * speed) % 48;
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        if (p < 24) {
           ctx.beginPath(); ctx.arc(p, 24, 2, 0, Math.PI*2); ctx.fill();
        }
      }

      // 5. Flotation (DAF) - micro-bubbles rising rapidly
      let microBubbles = Array.from({length: 12}, () => ({x: 10 + Math.random()*28, y: 48 + Math.random()*20, s: 2 + Math.random()*2}));
      function renderFlotation(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speedMult = isHovered ? 1.5 : 0.5;
        ctx.fillStyle = color;
        microBubbles.forEach(b => {
          b.y -= b.s * speedMult;
          if(b.y < -5) { b.y = 50; b.x = 10 + Math.random()*28; }
          ctx.beginPath(); ctx.arc(b.x, b.y, 1, 0, Math.PI*2); ctx.fill();
        });
      }

      // 6. Fixed Film (Trickling filter) - water dripping over media
      function renderFixedFilm(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        // Media stones
        [16, 24, 32].forEach(x => {
          [20, 28, 36].forEach(y => {
            ctx.beginPath(); ctx.arc(x + (y%10?4:0), y, 3, 0, Math.PI*2); ctx.stroke();
          });
        });
        // Dripping water
        const dropY = (frame * (isHovered ? 0.8 : 0.2)) % 48;
        ctx.fillStyle = color;
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(24, dropY, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(16, (dropY+15)%48, 1.5, 0, Math.PI*2); ctx.fill();
      }

      // 7. Anaerobic & Solids (Digester / UASB) - large slow gas bubbles from sludge
      let gasBubbles = Array.from({length: 3}, () => ({x: 16 + Math.random()*16, y: 30 + Math.random()*20, s: 0.2 + Math.random()*0.5}));
      function renderSolids(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speed = isHovered ? 1 : 0.2;
        // Sludge bed
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.moveTo(8, 40); ctx.lineTo(40, 40); ctx.lineTo(40, 48); ctx.lineTo(8, 48); ctx.fill();
        // Gas bubbles
        ctx.globalAlpha = 1;
        gasBubbles.forEach(b => {
          b.y -= b.s * speed;
          if(b.y < -5) { b.y = 40; b.x = 16 + Math.random()*16; }
          ctx.beginPath(); ctx.arc(b.x + Math.sin(b.y)*2, b.y, 2.5, 0, Math.PI*2); ctx.fill();
        });
      }

      // 8. Plant-Wide (Mass Balance) - scale / transfer arrows
      function renderPlantwide(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speed = isHovered ? 0.1 : 0.02;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        
        // Circular cycle
        ctx.beginPath(); ctx.arc(24, 24, 12, 0, Math.PI*2); ctx.stroke();
        
        // Moving transfer dot
        const angle = frame * speed;
        const tx = 24 + Math.cos(angle) * 12;
        const ty = 24 + Math.sin(angle) * 12;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI*2); ctx.fill();
      }

      // 9. Industrial (Precipitation) - particles falling down and settling
      let precipitates = Array.from({length: 8}, () => ({x: 12 + Math.random()*24, y: Math.random()*20, s: 0.5 + Math.random()*1}));
      function renderIndustrial(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speed = isHovered ? 1.5 : 0.5;
        ctx.fillStyle = color;
        precipitates.forEach(p => {
          p.y += p.s * speed;
          if(p.y > 40) { p.y = 0; p.x = 12 + Math.random()*24; }
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill();
        });
        // Settled layer
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(38, 40); ctx.lineTo(38, 42); ctx.lineTo(10, 42); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 10. Natural (Lagoons) - slow multi-layer wave
      function renderNatural(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speed = isHovered ? 0.05 : 0.01;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        
        // Wave 1
        ctx.beginPath();
        for(let x=8; x<=40; x++) {
          const y = 24 + Math.sin(x*0.2 + frame*speed) * 4;
          if(x===8) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();

        // Wave 2
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for(let x=8; x<=40; x++) {
          const y = 28 + Math.sin(x*0.15 - frame*speed*1.2) * 5;
          if(x===8) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Default generic fallback
      function renderWave(ctx, frame) {
        ctx.clearRect(0, 0, 48, 48);
        const speed = isHovered ? 0.1 : 0.03;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let x=8; x<=40; x++) {
          const y = 24 + Math.sin(x*0.2 + frame*speed) * 6;
          if(x===8) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }

      // Determine which renderer to use based on category
      let renderer;
      switch(cat) {
        case 'clarifier': case 'primary': renderer = renderClarifier; break;
        case 'secondary': case 'batch': case 'biofilm': renderer = renderBubbles; break;
        case 'membrane': case 'tertiary': renderer = renderFiltration; break;
        case 'pretreat': renderer = renderScreen; break;
        case 'flotation': renderer = renderFlotation; break;
        case 'fixedfilm': renderer = renderFixedFilm; break;
        case 'anaerobic': case 'solids': renderer = renderSolids; break;
        case 'plantwide': renderer = renderPlantwide; break;
        case 'industrial': renderer = renderIndustrial; break;
        case 'natural': renderer = renderNatural; break;
        default: renderer = renderWave;
      }

      function loop() {
        // Only render if card is visible (very basic optimization)
        if (card.getBoundingClientRect().top < window.innerHeight) {
          renderer(ctx, frame);
          frame++;
        }
        requestAnimationFrame(loop);
      }
      
      loop();
    });
  }

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCardFx();
      initUpCardFx();
      initMagneticButtons();
    });
  } else {
    setTimeout(() => {
      initCardFx();
      initUpCardFx();
      initMagneticButtons();
    }, 100);
  }

  // ─── Magnetic Liquid Buttons ───
  function initMagneticButtons() {
    const buttons = document.querySelectorAll('.magnetic-btn');
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px) scale(1.05)`;
        btn.style.transition = 'transform 0.1s ease';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate(0px, 0px) scale(1)`;
        btn.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      });
    });
  }

  // ─── 3D Premium Card Hover for .up-card ───
  function initUpCardFx() {
    const upCards = document.querySelectorAll('.up-card');
    upCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;  
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate 3D tilt (max 8 degrees)
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'transform 0.1s ease';
        card.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        
        // Add dynamic glow that blends with the new matte dark background
        card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(56, 189, 248, 0.25) 0%, rgba(20, 30, 48, 0.9) 70%)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.background = `linear-gradient(145deg, rgba(20, 30, 48, 0.8) 0%, rgba(10, 15, 25, 0.8) 100%)`;
        card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      });
    });
  }
})();
