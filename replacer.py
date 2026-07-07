import re
import sys

file_path = 'c:/Users/senth/OneDrive/Desktop/Nexus - NewUpdate/NEXUS_-New-Update/index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

start_marker = '<div class="screen show" id="screen-home">'
end_marker = '<!-- ════════════════════════════════════\n     WIZARD'

start_idx = html.find(start_marker)
end_idx = html.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

new_screen_home = """<div class="screen show" id="screen-home">

  <!-- Lando Norris Style Nav Overlay (Only visible on Homepage) -->
  <div class="ln-nav-overlay">
    <div class="ln-nav-brand">
      <div class="ln-brand-top">AAPAAVANI</div>
      <div class="ln-brand-bot">NEXUS</div>
    </div>
    <div class="ln-nav-actions">
      <button class="ln-btn-store" onclick="showWiz()">DESIGN WIZARD</button>
      <button class="ln-btn-menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 8h16M4 16h16"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Preloader -->
  <div class="ln-preloader">
    <div class="ln-preloader-text">LOAD NEXUS</div>
  </div>

  <!-- Main Scroll Container -->
  <div class="ln-scroll-container">
    
    <!-- Hero Section -->
    <section class="ln-hero">
      <canvas id="topo-bg"></canvas>
      <div class="ln-vignette"></div>
      
      <div class="ln-hero-content">
        <!-- Floating Tech UI -->
        <div class="ln-tech-panel">
          <div class="ln-tech-header">NEXT DESIGN</div>
          <svg class="ln-tech-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <div class="ln-tech-title">WWT PLANT V3</div>
          <div class="ln-tech-sub">AAPAAVANI ENG<br>SINCE 2024</div>
        </div>

        <div class="ln-hero-center">
          <img src="img/logo-white-aa.png" alt="Nexus Centerpiece" class="ln-centerpiece" />
        </div>
      </div>
    </section>

    <!-- Massive Typography Section -->
    <section class="ln-typo-section">
      <div class="ln-typo-container">
        <h1 class="ln-massive-text">
          BRINGING IT ALL IN<br>
          ALL WAYS. DEFINING A<br>
          <span class="ln-serif-accent">LEGACY</span> IN ENGINEERING<br>
          ON AND OFF THE<br>
          SITE.
        </h1>
      </div>
    </section>

    <!-- Cards Section (Adapted Unit Processes) -->
    <section class="ln-cards-section">
      <div class="ln-cards-container">
        <h2 class="ln-section-title">CORE<br>PROCESSES.</h2>
        <div class="ln-cards-grid">
          
          <!-- Sample Card 1 -->
          <div class="ln-card" onclick="showModules()">
            <div class="ln-card-inner">
              <div class="ln-card-tag">PRETREATMENT</div>
              <h3 class="ln-card-title">SCREENING & GRIT</h3>
            </div>
            <svg class="ln-card-deco" viewBox="0 0 40 40"><path d="M0 0 L40 0 L40 40 Z" fill="currentColor"/></svg>
          </div>

          <!-- Sample Card 2 -->
          <div class="ln-card" onclick="showModules()">
            <div class="ln-card-inner">
              <div class="ln-card-tag">SECONDARY</div>
              <h3 class="ln-card-title">BIOLOGICAL BNR</h3>
            </div>
            <svg class="ln-card-deco" viewBox="0 0 40 40"><path d="M0 0 L40 0 L40 40 Z" fill="currentColor"/></svg>
          </div>

        </div>
      </div>
    </section>

  </div> <!-- CLOSE ln-scroll-container -->

</div>
"""

new_html = html[:start_idx] + new_screen_home + "\n" + html[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Successfully replaced #screen-home")
