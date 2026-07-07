/* ══════ OTHER MODULES ══════ */
function buildMBR(){return`<div class="mwrap"><div class="cs"><div class="cs-icon">🔵</div><div class="cs-t">MBR System Design</div><div class="cs-d">Membrane Bioreactor with flux equation J=0.73T+7.25, membrane area, MLSS, pre-anoxic zone, scouring air. Use Secondary Bio module for MBR-style calculations.<br><br><button class="btn btn-a btn-sm" onclick="gm('secondary')">Open Secondary Module →</button></div></div></div>`}
function buildSBR(){return`<div class="mwrap"><div class="cs"><div class="cs-icon">🔄</div><div class="cs-t">SBR Design</div><div class="cs-d">Cycle sequencing: fill → react → settle → decant. BOD+Nitrification, Pre-Anoxic, Post-Anoxic configurations. Basin volume, O₂ demand, decanter sizing.<br><br><button class="btn btn-a btn-sm" onclick="gm('secondary')">Open in Secondary Module →</button></div></div></div>`}
function buildMBBR(){return`<div class="mwrap"><div class="cs"><div class="cs-icon">🟡</div><div class="cs-t">MBBR System Design</div><div class="cs-desc">SALR/SARR carrier sizing for BOD removal and nitrification. Pre- and Post-Anoxic denitrification stages. Carrier fill 40–50%, specific surface area from supplier.<br><br><button class="btn btn-a btn-sm" onclick="gm('secondary')">Open in Secondary Module →</button></div></div></div>`}
function buildMassBalance(){return`<div class="mwrap"><div class="mhdr"><div class="mh-left"><div class="mt-title">Solids Mass Balance<div class="mt-badge">PLANT-WIDE</div></div><div class="mt-bread">TSS/VSS/BOD tracking across all unit processes · M&E 5th Ed. Fig. 6-2</div></div></div>
  <div class="card"><div class="card-hd"><div class="card-hd-t">⚖️ Plant-Wide Mass Balance Summary</div></div><div class="card-body">
    <div class="alert al-a">💡 Complete each unit process design first. Mass balance auto-populates from your calculated results.</div>
    <table class="rtable"><thead><tr><th>Stream</th><th>Flow (m³/d)</th><th>TSS (mg/L)</th><th>TSS Load (kg/d)</th><th>BOD (mg/L)</th><th>BOD Load (kg/d)</th></tr></thead><tbody>
      <tr><td>Raw Influent</td><td class="mono">${fi(G.Q)}</td><td class="mono">${G.TSS}</td><td class="mono">${f2(G.Q*G.TSS/1000,1)}</td><td class="mono">${G.BOD}</td><td class="mono">${f2(G.Q*G.BOD/1000,1)}</td></tr>
      <tr><td>After Primary Clarifier</td><td class="mono">${fi(G.Q)}</td><td class="mono">${f2(G.TSS*(1-G.primaryTSSrem/100),0)}</td><td class="mono">${f2(G.Q*G.TSS*(1-G.primaryTSSrem/100)/1000,1)}</td><td class="mono">${f2(G.BOD*(1-G.primaryBODrem/100),0)}</td><td class="mono">${f2(G.Q*G.BOD*(1-G.primaryBODrem/100)/1000,1)}</td></tr>
      <tr><td>Final Effluent</td><td class="mono">${fi(G.Q)}</td><td class="mono">${G.TSSe}</td><td class="mono">${f2(G.Q*G.TSSe/1000,1)}</td><td class="mono">${G.BODe}</td><td class="mono">${f2(G.Q*G.BODe/1000,1)}</td></tr>
      <tr><td>Overall Removal</td><td class="mono">—</td><td class="mono">${f2((1-G.TSSe/G.TSS)*100,1)}%</td><td class="mono">${f2((G.Q*G.TSS/1000)-(G.Q*G.TSSe/1000),1)} kg/d</td><td class="mono">${f2((1-G.BODe/G.BOD)*100,1)}%</td><td class="mono">${f2((G.Q*G.BOD/1000)-(G.Q*G.BODe/1000),1)} kg/d</td></tr>
    </tbody></table>
  </div></div>
</div>`}
function buildLagoon(){return`<div class="mwrap"><div class="cs"><div class="cs-icon">🏞️</div><div class="cs-t">Lagoon System Design</div><div class="cs-d">Anaerobic, facultative and maturation pond design with evaporation estimation, Penman equation, and BOD removal rates.<br><br>Module includes: Evaporation calculation, Anaerobic lagoon (OLR basis), Facultative pond (areal BOD loading), Maturation pond (coliform reduction).</div></div></div>`}
function buildTertiary(){return`<div class="mwrap"><div class="cs"><div class="cs-icon">💎</div><div class="cs-t">Tertiary Treatment + Disinfection</div><div class="cs-desc">Rapid Sand Filter, Dual Media, Multi-Media, and Ultrafiltration sizing. Chlorination (Cl₂), UV, and ozone disinfection design.<br><br>Coming in the next update — currently use the Secondary module for final polishing parameters.</div></div></div>`}
function buildMetal(){return`<div class="mwrap"><div class="cs"><div class="cs-icon">⚗</div><div class="cs-t">Metal Hydroxide Precipitation</div><div class="cs-desc">Zn, Ni, Cr, Cu, Cd, Pb, Fe removal by hydroxide precipitation at design pH. Solubility vs pH curves, chemical (lime/caustic) dosing, solids production.<br><br>Based on Bengtson Metal Hydroxide Precipitation spreadsheets — 7-metal calculation with safety factor.</div></div></div>`}

/* ══════ INIT ══════ */
window.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('#ws2,#ws3,#ws4,#ws5').forEach(el=>el.style.display='none');
  updateWizUI(1);
  // Auto-populate tech sidebar
  const sv=document.getElementById('sb-tech-v');if(sv)sv.textContent='Not yet selected';
});
