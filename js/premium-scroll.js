// // Premium Cinematic Scroll Engine (GSAP + Lenis)

// document.addEventListener("DOMContentLoaded", () => {
//   const screenHome = document.getElementById('screen-home');
//   if (!screenHome) return;

//   // 1. Initialize Lenis (Ultra-smooth)
//   window.lenis = new Lenis({
//     lerp: 0.05, // Ultra-smooth
//     smoothWheel: true,
//   });
//   const lenis = window.lenis;

//   // Sync GSAP ScrollTrigger with Lenis
//   if (typeof ScrollTrigger !== 'undefined') {
//     gsap.registerPlugin(ScrollTrigger);
    
//     lenis.on('scroll', ScrollTrigger.update);
//     gsap.ticker.add((time) => {
//       lenis.raf(time * 1000);
//     });
//     gsap.ticker.lagSmoothing(0, 0);
//   } else {
//     function raf(time) {
//       lenis.raf(time);
//       requestAnimationFrame(raf);
//     }
//     requestAnimationFrame(raf);
//   }

//   // 2. Preloader Animation
//   const preloader = document.querySelector('.ln-preloader');
//   if (preloader) {
//     gsap.to(preloader, {
//       opacity: 0,
//       duration: 1,
//       delay: 0.5,
//       ease: 'power2.inOut',
//       onComplete: () => {
//         preloader.style.display = 'none';
//         initCinematicScroll();
//       }
//     });
//   } else {
//     initCinematicScroll();
//   }

//   // 3. Cinematic Section Transitions (The Core Storytelling Engine)
//   function initCinematicScroll() {
//     const sections = gsap.utils.toArray('.cinematic-section');
    
//     // Add basic container scroll trigger (without aggressive snap)
//     ScrollTrigger.create({
//       trigger: '.ln-scroll-container',
//       start: 'top top',
//       end: 'bottom bottom'
//     });

//     sections.forEach((section, i) => {
//       // Create an independent timeline for each section to prevent overlap
//       const tl = gsap.timeline({
//         scrollTrigger: {
//           trigger: section,
//           start: 'top 85%', 
//           end: 'bottom 15%',
//           toggleActions: 'play none none none', // play once and stay visible
//           fastScrollEnd: true,
//           preventOverlaps: true,
//         }
//       });

//       // Blur-to-Sharp & Scale up (Section Background/Container)
//       tl.to(section, {
//         opacity: 1,
//         scale: 1,
//         y: 0,
//         filter: 'blur(0px)',
//         duration: 1.2,
//         ease: 'power3.out',
//         overwrite: 'auto'
//       }, 0);

//       // Mask Reveals within section
//       const masks = section.querySelectorAll('.mask-reveal');
//       if (masks.length) {
//         tl.fromTo(masks, 
//           { clipPath: 'inset(100% 0 0 0)' },
//           {
//             clipPath: 'inset(0% 0 0 0)',
//             duration: 1.2,
//             ease: 'power4.out',
//             overwrite: 'auto'
//           }, 0.2
//         );
//       }

//       // Text & Button Reveals (Staggered smoothly)
//       const texts = section.querySelectorAll('.ed-hero-label, .ed-hero-title, .ed-hero-sub, .ed-cta, .ed-section-title, .ed-section-desc, .ed-text-btn, .ed-massive-text, .up-card');
//       if (texts.length) {
//         tl.fromTo(texts, 
//           { y: 30, opacity: 0 },
//           { 
//             y: 0, 
//             opacity: 1, 
//             duration: 1, 
//             stagger: 0.15, 
//             ease: 'power3.out',
//             overwrite: 'auto'
//           }, 0.4
//         );
//       }
      
//       // Gentle Parallax for background imagery
//       const bgImg = section.querySelector('.ed-parallax-img');
//       if (bgImg) {
//         gsap.to(bgImg, {
//           yPercent: 15,
//           ease: 'none',
//           scrollTrigger: {
//             trigger: section,
//             start: 'top bottom',
//             end: 'bottom top',
//             scrub: true
//           }
//         });
//       }
//     });

//     initMagneticButtons();
//     init3DCards(); // Initialize new 3D hover effects
//   }

//   // Stunning 3D Card Hover Interaction
//   function init3DCards() {
//     const cards = document.querySelectorAll('.up-card');
//     cards.forEach(card => {
//       // Create a wrapper for perspective if it doesn't exist, but we can also just apply perspective to the parent via CSS or apply directly.
//       // We will apply transform directly to the card.
      
//       card.addEventListener('mousemove', (e) => {
//         const rect = card.getBoundingClientRect();
//         const x = e.clientX - rect.left; // x position within the element
//         const y = e.clientY - rect.top;  // y position within the element
        
//         const centerX = rect.width / 2;
//         const centerY = rect.height / 2;
        
//         // Calculate rotation based on mouse position relative to center
//         // Max rotation is 8 degrees
//         const rotateX = ((y - centerY) / centerY) * -8;
//         const rotateY = ((x - centerX) / centerX) * 8;
        
//         gsap.to(card, {
//           rotateX: rotateX,
//           rotateY: rotateY,
//           transformPerspective: 1000,
//           ease: 'power2.out',
//           duration: 0.4
//         });
//       });
      
//       card.addEventListener('mouseleave', () => {
//         gsap.to(card, {
//           rotateX: 0,
//           rotateY: 0,
//           ease: 'elastic.out(1, 0.3)',
//           duration: 1.2
//         });
//       });
//     });
//   }

//   // 4. Magnetic Buttons (Micro-interactions)
//   function initMagneticButtons() {
//     const magneticBtns = document.querySelectorAll('.magnetic-btn');
//     magneticBtns.forEach(btn => {
//       btn.addEventListener('mousemove', (e) => {
//         const rect = btn.getBoundingClientRect();
//         const x = e.clientX - rect.left - rect.width / 2;
//         const y = e.clientY - rect.top - rect.height / 2;
        
//         gsap.to(btn, {
//           x: x * 0.4,
//           y: y * 0.4,
//           duration: 0.6,
//           ease: 'power3.out',
//           overwrite: 'auto'
//         });
//       });
      
//       btn.addEventListener('mouseleave', () => {
//         gsap.to(btn, {
//           x: 0,
//           y: 0,
//           duration: 0.6,
//           ease: 'elastic.out(1, 0.3)',
//           overwrite: 'auto'
//         });
//       });
//     });
//   }
// });

// Premium Cinematic Scroll Engine (GSAP + Lenis)

// Premium Cinematic Scroll Engine (GSAP + Lenis)

document.addEventListener("DOMContentLoaded", () => {
  const screenHome = document.getElementById('screen-home');
  if (!screenHome) return;

  const preloader = document.querySelector('.ln-preloader');

  // ── HARD FALLBACK ──────────────────────────────────────────────────
  // The preloader was only ever hidden inside a GSAP animation callback.
  // If the Lenis/GSAP/ScrollTrigger CDN scripts fail to load for any
  // reason (network hiccup, ad-blocker, corporate proxy, offline demo),
  // that callback never runs and the paper-colored overlay sits on top
  // of the entire page — permanently, at ~94% opacity, z-index 10000.
  // That is almost certainly the "white background covering everything"
  // issue. This timeout guarantees the preloader is gone no matter what
  // else on the page succeeds or fails.
  let preloaderHidden = false;
  function hidePreloaderOnce() {
    if (preloaderHidden || !preloader) return;
    preloaderHidden = true;
    preloader.style.transition = 'opacity 0.4s ease';
    preloader.style.opacity = '0';
    setTimeout(() => { preloader.style.display = 'none'; }, 450);
  }
  setTimeout(hidePreloaderOnce, 3000); // absolute worst-case safety net

  const hasScrollLibs = (typeof Lenis !== 'undefined') && (typeof gsap !== 'undefined');

  if (!hasScrollLibs) {
    // Lenis/GSAP didn't load — don't leave the page half-broken. Make sure
    // every scroll-reveal element is simply visible (no animation) instead
    // of stuck at opacity:0 waiting for a timeline that will never run,
    // and fall through to plain native scrolling.
    document.querySelectorAll(
      '.cinematic-section, .mask-reveal, .ed-hero-label, .ed-hero-title, .ed-hero-sub, ' +
      '.ed-cta, .ed-section-title, .ed-section-desc, .ed-text-btn, .ed-massive-text, .up-card'
    ).forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
      el.style.clipPath = 'none';
    });
    hidePreloaderOnce();
    initMagneticButtons();
    return; // skip everything below — it all depends on Lenis/GSAP
  }

  // 1. Initialize Lenis (Ultra-smooth)
  window.lenis = new Lenis({
    lerp: 0.12, // was 0.05 — that's heavy enough to feel like input lag on every scroll
    smoothWheel: true,
  });
  const lenis = window.lenis;

  // Sync GSAP ScrollTrigger with Lenis
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // 2. Preloader Animation
  if (preloader) {
    gsap.to(preloader, {
      opacity: 0,
      duration: 1,
      delay: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        preloaderHidden = true;
        preloader.style.display = 'none';
        initCinematicScroll();
      }
    });
  } else {
    initCinematicScroll();
  }

  // 3. Cinematic Section Transitions (The Core Storytelling Engine)
  function initCinematicScroll() {
    const sections = gsap.utils.toArray('.cinematic-section');
    
    // Add basic container scroll trigger (without aggressive snap)
    ScrollTrigger.create({
      trigger: '.ln-scroll-container',
      start: 'top top',
      end: 'bottom bottom'
    });

    sections.forEach((section, i) => {
      // Create an independent timeline for each section to prevent overlap
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 85%', 
          end: 'bottom 15%',
          toggleActions: 'play none none none', // play once and stay visible
          fastScrollEnd: true,
          preventOverlaps: true,
        }
      });

      // Blur-to-Sharp & Scale up (Section Background/Container)
      tl.to(section, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power3.out',
        overwrite: 'auto'
      }, 0);

      // Mask Reveals within section
      const masks = section.querySelectorAll('.mask-reveal');
      if (masks.length) {
        tl.fromTo(masks, 
          { clipPath: 'inset(100% 0 0 0)' },
          {
            clipPath: 'inset(0% 0 0 0)',
            duration: 1.2,
            ease: 'power4.out',
            overwrite: 'auto'
          }, 0.2
        );
      }

      // Text & Button Reveals (Staggered smoothly)
      const texts = section.querySelectorAll('.ed-hero-label, .ed-hero-title, .ed-hero-sub, .ed-cta, .ed-section-title, .ed-section-desc, .ed-text-btn, .ed-massive-text, .up-card');
      if (texts.length) {
        tl.fromTo(texts, 
          { y: 30, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 1, 
            stagger: 0.15, 
            ease: 'power3.out',
            overwrite: 'auto'
          }, 0.4
        );
      }
      
      // Gentle Parallax for background imagery
      const bgImg = section.querySelector('.ed-parallax-img');
      if (bgImg) {
        gsap.to(bgImg, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      }
    });

    initMagneticButtons();
    // 3D card tilt removed — it fought the flat, index-card look of the
    // new .up-card styling (atelier-transform.css). Cards now rely on the
    // background swap in CSS (:hover) for feedback instead of a glossy tilt.
  }

  // 4. Magnetic Buttons (Micro-interactions)
  function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
          x: x * 0.4,
          y: y * 0.4,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      });
      
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.4,
          ease: 'power3.out', // settles once, crisply — no spring-back
          overwrite: 'auto'
        });
      });
    });
  }
});
