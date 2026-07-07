import re

file_path = r'c:\Users\senth\OneDrive\Desktop\Nexus - NewUpdate\NEXUS_-New-Update\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add head tags (CSS and scripts)
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="css/styles.css">\n<link rel="stylesheet" href="css/premium-redesign.css">\n<script src="https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.19/bundled/lenis.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>')

# 2. Update TopNav (remove emojis)
html = html.replace('<div class="nt active" id="nt-home" onclick="goHome()">⬡ Home</div>', '<div class="nt active" id="nt-home" onclick="goHome()">Home</div>')
html = html.replace('<div class="nt" id="nt-wizard" onclick="showWiz()">⚗ Design Wizard</div>', '<div class="nt" id="nt-wizard" onclick="showWiz()">Design Wizard</div>')
html = html.replace('<div class="nt" id="nt-modules" onclick="showModules()">⊞ Unit Processes</div>', '<div class="nt" id="nt-modules" onclick="showModules()">Unit Processes</div>')

# 3. Restructure Hero
old_hero = '''<canvas id="water-bg"></canvas>
  <div class="hh-grid"></div><div class="hh-glow1"></div><div class="hh-glow2"></div>
  <div class="hero-inner">
    <div class="hero-eyebrow"><div class="eyebrow-pulse"></div><span>Aapaavani NEXUS — M&E 5th Ed. · IWA · CPHEEO</span></div>
    <div class="hero-h">From influent data<br>to <span class="hl">complete plant design</span></div>
    <div class="hero-p">Enter feed parameters once. NEXUS applies rigorous kinetic models, generates fully-dimensioned 2D engineering drawings, checks against international standards, and produces design-ready documentation — all in your browser.</div>
    <div class="hero-btns">
      <button class="btn-hero amber" onclick="showWiz()">🚀 Start New Design</button>
      <button class="btn-hero ghost" onclick="showModules()">⊞ All Unit Processes</button>
    </div>
    <div class="stats-strip">
      <div class="ss-item"><div class="ss-v">20</div><div class="ss-l">Design Modules</div></div>
      <div class="ss-item"><div class="ss-v">M&E 5th</div><div class="ss-l">Reference Basis</div></div>
      <div class="ss-item"><div class="ss-v">2D+3D</div><div class="ss-l">Drawing Types</div></div>
      <div class="ss-item"><div class="ss-v">S.I.</div><div class="ss-l">Unit System</div></div>
      <div class="ss-item"><div class="ss-v">IWA</div><div class="ss-l">Standards</div></div>
    </div>
  </div> <!-- CLOSE hero-inner -->'''

new_hero = '''<div class="hero-bg-wrapper">
    <img src="https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=2938&auto=format&fit=crop" alt="Water Treatment Facility" class="hero-bg-img" />
    <div class="hero-bg-overlay"></div>
  </div>
  <div class="hero-inner">
    <div class="hero-eyebrow" style="margin-bottom: 24px;"><span style="letter-spacing: 3px; font-size: 12px; color: rgba(255,255,255,0.7);">AAPAAVANI NEXUS V3.0</span></div>
    <div class="hero-h" data-scroll-anim="fade-up">Intelligent design for<br>modern water <span class="hl">infrastructure</span></div>
    <div class="hero-p" data-scroll-anim="fade-up" style="animation-delay: 0.1s;">Enter feed parameters once. NEXUS applies rigorous kinetic models, generates fully-dimensioned engineering drawings, and produces design-ready documentation to international standards.</div>
    <div class="hero-btns" data-scroll-anim="fade-up" style="animation-delay: 0.2s;">
      <button class="btn-hero amber" onclick="showWiz()">Start New Design</button>
      <button class="btn-hero ghost" onclick="showModules()">View All Processes</button>
    </div>
    <div class="stats-strip" data-scroll-anim="fade-up" style="animation-delay: 0.3s;">
      <div class="ss-item"><div class="ss-v">20+</div><div class="ss-l">UNIT PROCESSES</div></div>
      <div class="ss-item"><div class="ss-v">M&E 5th</div><div class="ss-l">REFERENCE BASIS</div></div>
      <div class="ss-item"><div class="ss-v">IWA</div><div class="ss-l">STANDARDS</div></div>
      <div class="ss-item"><div class="ss-v">S.I.</div><div class="ss-l">METRIC SYSTEM</div></div>
    </div>
  </div> <!-- CLOSE hero-inner -->'''

html = html.replace(old_hero, new_hero)

# 4. Remove Isometric image and change 'Unit Processes' to 'Core Technologies'
old_iso = '''<div class="mgh-text">
        <div class="mgh-title">Unit Processes</div>
        <div class="mgh-sub">Select a treatment module to begin engineering design</div>
      </div>
      
      <!-- Isometric 3D Graphic -->
      <img src="img/hero-iso.png" alt="Isometric Water Treatment Plant" class="hero-iso-img">'''

new_iso = '''<div class="mgh-text">
        <div class="mgh-title">Core Technologies</div>
        <div class="mgh-sub">Select a treatment module to begin engineering design</div>
      </div>'''

html = html.replace(old_iso, new_iso)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html)

print('Updated index.html safely')
