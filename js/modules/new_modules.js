/* ══════════════════════════════════════════════════════════════════════════════
   NEW MODULES — Aapaavani NEXUS v3.1
   Covers: Selection screens, Oxidation Ditch, Tertiary Denitrif,
           MBBR BOD+Nitrif, MBBR Nitrif+Denitrif, SBR, Aeration/Blower
   References: M&E 5th Ed. | WEF | CPHEEO
   ══════════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   HELPER: Sub-module selection card builder
   ═══════════════════════════════════════════════════════════ */
function _selCard(icon, title, desc, action, status='live') {
  const statusCls = status === 'live' ? 'ok' : 'warn';
  const statusLbl = status === 'live' ? 'Live' : 'Coming Soon';
  return `<div class="sel-card" onclick="${status==='live'?action:''}">
    <div class="sel-icon">${icon}</div>
    <div class="sel-body">
      <div class="sel-title">${title}</div>
      <div class="sel-desc">${desc}</div>
    </div>
    <div class="sel-action">
      <span class="sel-badge ${statusCls}">${statusLbl}</span>
      ${status==='live' ? `<button class="btn btn-a btn-sm">Open Design →</button>` : ''}
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   SELECTION SCREEN — Screening + Grit
   ═══════════════════════════════════════════════════════════ */
function buildScreenSelect() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">Screening &amp; Grit Removal<div class="mt-badge">PRETREATMENT</div></div>
    <div class="mt-bread">Select a grit chamber configuration to design</div>
  </div></div>
  <div class="sel-grid">
    ${_selCard('🔲','Horizontal Flow Grit Chamber',
      'Velocity-controlled rectangular channel with Stokes settling. Bar screen headloss by Kirschmer equation. Standard design for most municipal plants.',
      'buildAndShow("screen")', 'live')}
    ${_selCard('💨','Aerated Grit Chamber',
      'Air-induced vortex grit removal. Compressed air maintains spiral flow; grit settles at controlled horizontal velocity. Higher energy — better organics removal.',
      'buildAndShow("aerated-grit")', 'live')}
  </div></div>`;
}

/* ═══════════════════════════════════════════════════════════
   SELECTION SCREEN — Secondary Biological
   ═══════════════════════════════════════════════════════════ */
function buildSecondarySelect() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">Secondary Biological Treatment<div class="mt-badge">BIOLOGICAL</div></div>
    <div class="mt-bread">Select a suspended-growth biological process configuration</div>
  </div></div>
  <div class="sel-grid">
    ${_selCard('🧬','CMAS — Nitrification, Denitrification &amp; EBPR',
      'Complete mixed activated sludge with full BNR. Monod kinetics, SRT design, O₂ demand, pre-anoxic denitrification, and enhanced biological phosphorus removal.',
      'buildAndShow("secondary-cmas")', 'live')}
    ${_selCard('🌿','Tertiary Denitrification Stage',
      'Dedicated post-secondary anoxic reactor for final NO₃ polishing. Carbon source dosing (methanol/ethanol), SRT check, and effluent NO₃-N target verification.',
      'buildAndShow("tertiary-denitrif")', 'live')}
    ${_selCard('🔄','Oxidation Ditch',
      'Extended aeration system with oval/racetrack channels. SRT 15–30 d, MLSS 3000–5000 mg/L. Rotor sizing, ditch volume, O₂ demand, and channel geometry.',
      'buildAndShow("oxditch")', 'live')}
  </div></div>`;
}

/* ═══════════════════════════════════════════════════════════
   SELECTION SCREEN — MBBR System
   ═══════════════════════════════════════════════════════════ */
function buildMBBRSelect() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">MBBR System Design<div class="mt-badge">BIOFILM</div></div>
    <div class="mt-bread">Select an MBBR process configuration</div>
  </div></div>
  <div class="sel-grid">
    ${_selCard('🟡','BOD Removal + Nitrification',
      'Single or two-stage MBBR for carbonaceous BOD removal followed by nitrification. SALR and SARR carrier sizing with temperature correction.',
      'buildAndShow("mbbr-bod")', 'live')}
    ${_selCard('♻️','Nitrification–Denitrification (BNR)',
      'Full biological nitrogen removal with pre-anoxic zone. SALR/SARR for nitrification, SDNR for denitrification, internal recycle ratio sizing.',
      'buildAndShow("mbbr-bnr")', 'live')}
  </div></div>`;
}

/* Helper: render a module then show it */
function buildAndShow(id) {
  const mc = document.getElementById('mod-content');
  if (!mc) return;
  mc.innerHTML = buildMod(id);
  const firstInp = mc.querySelector('input');
  if (firstInp) firstInp.focus();
}


/* Old Aerated Grit Chamber code removed — now in aerated_grit.js */


/* ═══════════════════════════════════════════════════════════
   MODULE: TERTIARY DENITRIFICATION STAGE
   Ref: M&E 5th Ed. Section 9-5 · Table 9-26
   ═══════════════════════════════════════════════════════════ */
function buildTertiaryDenitrif() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">Tertiary Denitrification Stage<div class="mt-badge">BIOLOGICAL</div></div>
    <div class="mt-bread">Post-secondary anoxic reactor for NO₃ polishing · M&E 5th Ed. Section 9-5</div>
  </div><button class="btn btn-o btn-sm" onclick="buildAndShow('secondary-select')">← Back to Selection</button></div>
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'tdn-inp')">📋 Inputs</div>
    <div class="tab" onclick="stab(this,'tdn-bas')">📐 Design Basis</div>
    <div class="tab" onclick="stab(this,'tdn-res')">📊 Results</div>
    <div class="tab" onclick="stab(this,'tdn-chk')">✅ Checks</div>
  </div>

  <div class="tp active" id="tdn-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">🌿 Tertiary Denitrification Parameters</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Avg Design Flow Q</label><div class="fuw"><input type="number" id="tdn_Q" value="${G.Q}"><div class="fu">m³/d</div></div></div>
        <div class="f"><label>Influent NO₃-N</label><div class="fuw"><input type="number" id="tdn_NO3i" value="15" step="1"><div class="fu">mg/L</div></div><div class="h">From secondary effluent</div></div>
        <div class="f"><label>Target Effluent NO₃-N</label><div class="fuw"><input type="number" id="tdn_NO3e" value="5" step="1"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Design Temperature</label><div class="fuw"><input type="number" id="tdn_T" value="${G.T}" step="1"><div class="fu">°C</div></div></div>
        <div class="f"><label>Design SRT</label><div class="fuw"><input type="number" id="tdn_SRT" value="5" step="1"><div class="fu">days</div></div><div class="h">Typical 3–8 days</div></div>
        <div class="f"><label>MLSS</label><div class="fuw"><input type="number" id="tdn_MLSS" value="3000" step="500"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Carbon Source</label><select id="tdn_carbon">
          <option value="methanol">Methanol (COD/NO₃ = 3.5)</option>
          <option value="ethanol">Ethanol (COD/NO₃ = 4.0)</option>
          <option value="acetate">Sodium Acetate (COD/NO₃ = 5.0)</option>
          <option value="glycerol">Glycerol (COD/NO₃ = 4.5)</option>
        </select></div>
        <div class="f"><label>No. of Tanks</label><input type="number" id="tdn_n" value="2" min="1" max="6"><div class="h">Min 2 recommended</div></div>
        <div class="f"><label>Liquid Depth</label><div class="fuw"><input type="number" id="tdn_D" value="4" step="0.5"><div class="fu">m</div></div></div>
        <div class="f"><label>L:W Ratio</label><input type="number" id="tdn_LW" value="2" step="0.5"></div>
      </div>
    </div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcTertiaryDenitrif()">⚙️ Calculate Tertiary Denitrification</button></div>
  </div>

  <div class="tp" id="tdn-bas">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Equations</div></div><div class="card-body">
      <div class="eq-blk"><div class="eq-t">NO₃ Removal Rate</div>
        <span class="eq-l">ΔNO₃</span> = <span class="eq-r">Q × (NO₃,in − NO₃,e) / 1000 &nbsp; [kg NO₃-N/d]</span></div>
      <div class="eq-blk"><div class="eq-t">Tank Volume — SRT Basis</div>
        <span class="eq-l">V</span> = <span class="eq-r">SRT × Px,bio × 1000 / MLSS</span>
        <div class="eq-where">Px,bio estimated from Y = 0.40 kg VSS/kg NO₃ denitrified</div></div>
      <div class="eq-blk"><div class="eq-t">Carbon Dosing Rate</div>
        <span class="eq-l">Q_carbon</span> = <span class="eq-r">ΔNO₃ × COD/NO₃ ratio × 1000 / Concentration</span>
        <div class="eq-where">Methanol ≈ 3.5 · Ethanol ≈ 4.0 · Acetate ≈ 5.0 · Glycerol ≈ 4.5 (g COD/g NO₃)</div></div>
      <div class="eq-blk"><div class="eq-t">Temperature Correction</div>
        <span class="eq-l">SDNR_T</span> = <span class="eq-r">SDNR_20 × θ^(T−20) &nbsp; [θ = 1.026]</span></div>
    </div></div>
  </div>

  <div class="tp" id="tdn-res"><div id="tdn-res-area"><div class="alert al-i">Click Calculate to see results.</div></div></div>
  <div class="tp" id="tdn-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body" id="tdn-chk-body"><div class="alert al-i">Calculate first.</div></div></div></div>
</div>`;
}

function calcTertiaryDenitrif() {
  const Q = vv('tdn_Q'), NO3i = vv('tdn_NO3i'), NO3e = vv('tdn_NO3e'), T = vv('tdn_T');
  const SRT = vv('tdn_SRT'), MLSS = vv('tdn_MLSS'), n = vv('tdn_n');
  const D = vv('tdn_D'), LW = vv('tdn_LW');
  const carbonSel = document.getElementById('tdn_carbon')?.value || 'methanol';
  const ratioMap = { methanol: 3.5, ethanol: 4.0, acetate: 5.0, glycerol: 4.5 };
  const concMap = { methanol: 791, ethanol: 789, acetate: 1200, glycerol: 1261 }; // kg/m³
  const cod_no3 = ratioMap[carbonSel];
  const carbon_conc = concMap[carbonSel]; // density kg/m³
  // Calculations
  const dNO3 = Q * (NO3i - NO3e) / 1000; // kg/d
  const Y_dn = 0.40, kd = 0.04;
  const Px_bio = Q * Y_dn * (NO3i - NO3e) / 1000 / (1 + kd * SRT); // kg VSS/d
  const V = Math.max(SRT * Px_bio * 1000 / MLSS, Q * 0.5 / 24); // m³ total
  const Vn = V / n; // per tank
  const W = Math.sqrt(Vn / (D * LW));
  const L = W * LW;
  const HRT = V / (Q / 24);
  const carbon_kgd = dNO3 * cod_no3; // kg COD/d (from carbon)
  const carbon_Ld = carbon_kgd / carbon_conc * 1000; // L/d
  const SDNR_20 = 0.10; // typical post-secondary anoxic
  const SDNR_T = SDNR_20 * Math.pow(1.026, T - 20);
  const VLR_NO3 = dNO3 / V;
  document.getElementById('tdn-res-area').innerHTML =
    rs('⚡ NO₃ Removal', rg([
      rc(f2(dNO3, 1), 'NO₃-N Removal Load', 'kg/d', 'amb'),
      rc(f2(NO3i - NO3e, 1), 'Removal Required', 'mg/L', 'amb'),
      rc(f2(Px_bio, 1), 'Biomass Production', 'kg VSS/d'),
    ])) +
    rs(`🏗️ Tank Sizing (${n} units)`, rg([
      rc(f2(V, 1), 'Total Volume', 'm³', 'amb'),
      rc(f2(Vn, 1), 'Volume per Tank', 'm³'),
      rc(f2(L, 2), 'Tank Length L', 'm'),
      rc(f2(W, 2), 'Tank Width W', 'm'),
      rc(f2(D, 1), 'Liquid Depth D', 'm'),
      rc(f2(HRT, 2), 'HRT', 'hr', HRT >= 0.5 && HRT <= 4 ? 'ok' : 'warn'),
    ])) +
    rs('🧪 Carbon Dosing', rg([
      rc(f2(cod_no3, 1), 'COD/NO₃ Ratio', 'g COD/g NO₃'),
      rc(f2(carbon_kgd, 1), 'Carbon Dose (as COD)', 'kg/d', 'amb'),
      rc(f2(carbon_Ld, 1), `${carbonSel.charAt(0).toUpperCase()+carbonSel.slice(1)} Dose`, 'L/d', 'amb'),
      rc(f2(SDNR_T, 4), 'SDNR at Design Temp', 'kg NO₃/kg VSS/d'),
    ]));
  document.getElementById('tdn-chk-body').innerHTML = `<div class="ck-list">${[
    ck(HRT >= 0.5 && HRT <= 4, 'HRT 0.5–4 hr', f2(HRT, 2) + ' hr', 'M&E Table 9-26'),
    ck(SRT >= 3 && SRT <= 8, 'SRT 3–8 days', SRT + ' d', 'M&E Table 9-26'),
    ck(MLSS >= 2000 && MLSS <= 5000, 'MLSS 2000–5000 mg/L', MLSS + ' mg/L'),
    ck(NO3e <= 10, 'Effluent NO₃ ≤10 mg/L', f2(NO3e, 1) + ' mg/L'),
    ck(n >= 2, 'Min 2 tanks', n + ' tanks'),
  ].join('')}</div>`;
}


/* ═══════════════════════════════════════════════════════════
   MODULE: OXIDATION DITCH
   Ref: M&E 5th Ed. Section 7-11 · Table 7-28
   ═══════════════════════════════════════════════════════════ */
function buildOxDitch() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">Oxidation Ditch Design<div class="mt-badge">BIOLOGICAL</div></div>
    <div class="mt-bread">Extended aeration — SRT 15–30 d · M&E 5th Ed. Section 7-11</div>
  </div><button class="btn btn-o btn-sm" onclick="buildAndShow('secondary-select')">← Back to Selection</button></div>
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'oxd-inp')">📋 Inputs</div>
    <div class="tab" onclick="stab(this,'oxd-bas')">📐 Design Basis</div>
    <div class="tab" onclick="stab(this,'oxd-res')">📊 Results</div>
    <div class="tab" onclick="stab(this,'oxd-chk')">✅ Checks</div>
  </div>

  <div class="tp active" id="oxd-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">🔄 Oxidation Ditch Design Parameters</div><div class="card-hd-s">M&E 5th Ed. Table 7-28</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Design Flow Q</label><div class="fuw"><input type="number" id="oxd_Q" value="${G.Q}"><div class="fu">m³/d</div></div></div>
        <div class="f"><label>Peaking Factor PF</label><input type="number" id="oxd_PF" value="${G.PF}" step="0.1"></div>
        <div class="f"><label>Influent BOD₅</label><div class="fuw"><input type="number" id="oxd_BOD" value="${G.BOD}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Influent TKN</label><div class="fuw"><input type="number" id="oxd_TKN" value="${G.TKN}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Influent TSS</label><div class="fuw"><input type="number" id="oxd_TSS" value="${G.TSS}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Design Temperature</label><div class="fuw"><input type="number" id="oxd_T" value="${G.T}" step="1"><div class="fu">°C</div></div></div>
        <div class="f"><label>Design SRT</label><div class="fuw"><input type="number" id="oxd_SRT" value="20" step="5"><div class="fu">days</div></div><div class="h">Range: 15–30 d</div></div>
        <div class="f"><label>MLSS</label><div class="fuw"><input type="number" id="oxd_MLSS" value="3500" step="500"><div class="fu">mg/L</div></div><div class="h">Range: 3000–5000</div></div>
        <div class="f"><label>VSS/TSS Ratio</label><input type="number" id="oxd_vssr" value="0.75" step="0.05"><div class="h">Typical 0.70–0.80</div></div>
        <div class="f"><label>Channel Depth</label><div class="fuw"><input type="number" id="oxd_d" value="3.5" step="0.25"><div class="fu">m</div></div><div class="h">Typical 2.5–4.5 m</div></div>
        <div class="f"><label>Channel Width</label><div class="fuw"><input type="number" id="oxd_w" value="6" step="0.5"><div class="fu">m</div></div><div class="h">Typical 4–8 m</div></div>
        <div class="f"><label>Rotor O₂ Efficiency</label><div class="fuw"><input type="number" id="oxd_OE" value="1.5" step="0.1"><div class="fu">kg O₂/kWh</div></div><div class="h">Brush rotors: 1.2–2.0</div></div>
        <div class="f"><label>No. of Ditches</label><input type="number" id="oxd_n" value="2" min="1" max="6"></div>
        <div class="f"><label>Target Effluent BOD</label><div class="fuw"><input type="number" id="oxd_BODe" value="${G.BODe}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Target NH₄-N Effluent</label><div class="fuw"><input type="number" id="oxd_NH4e" value="${G.NH4e}" step="0.5"><div class="fu">mg/L</div></div></div>
      </div>
    </div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcOxDitch()">⚙️ Calculate Oxidation Ditch</button></div>
  </div>

  <div class="tp" id="oxd-bas">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Equations</div></div><div class="card-body">
      <div class="eq-blk"><div class="eq-t">VSS/TSS Sludge Production</div>
        <span class="eq-l">Px,bio</span> = <span class="eq-r">Q·Y·(BOD−BODe) / [1000·(1+kd·SRT)]</span>
        <div class="eq-where">Y = 0.45 kg VSS/kg BOD · kd = 0.04–0.10 d⁻¹ (temp corrected)</div></div>
      <div class="eq-blk"><div class="eq-t">Aeration Basin Volume</div>
        <span class="eq-l">V</span> = <span class="eq-r">SRT × Px,TSS × 1000 / MLSS</span></div>
      <div class="eq-blk"><div class="eq-t">O₂ Demand</div>
        <span class="eq-l">AOR</span> = <span class="eq-r">Q·(BOD−BODe)·(1/0.68) − 1.42·Px,VSS + 4.57·Q·NOx/1000</span>
        <div class="eq-where">NOx = TKN − NH4e − 0.12·Px,bio·1000/Q · extended aeration has minimal NOx</div></div>
      <div class="eq-blk"><div class="eq-t">Ditch Length (oval plan)</div>
        <span class="eq-l">L_total</span> = <span class="eq-r">V / (n × w × d)</span>
        <div class="eq-where">Each ditch channel: two parallel lanes + semicircular ends · Channel velocity 0.3–0.9 m/s</div></div>
    </div></div>
  </div>

  <div class="tp" id="oxd-res"><div id="oxd-res-area"><div class="alert al-i">Click Calculate to see results.</div></div></div>
  <div class="tp" id="oxd-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body" id="oxd-chk-body"><div class="alert al-i">Calculate first.</div></div></div></div>
</div>`;
}

function calcOxDitch() {
  const Q = vv('oxd_Q'), PF = vv('oxd_PF'), BOD = vv('oxd_BOD'), TKN = vv('oxd_TKN'), TSS = vv('oxd_TSS');
  const T = vv('oxd_T'), SRT = vv('oxd_SRT'), MLSS = vv('oxd_MLSS'), vssr = vv('oxd_vssr');
  const d = vv('oxd_d'), w = vv('oxd_w'), OE = vv('oxd_OE'), n = vv('oxd_n');
  const BODe = vv('oxd_BODe'), NH4e = vv('oxd_NH4e');
  // Kinetics (temp corrected, extended aeration)
  const Y = 0.45, kd = 0.05 * Math.pow(1.04, T - 20), fd = 0.15;
  // Sludge production
  const Px_VSS = Q * Y * (BOD - BODe) / 1000 / (1 + kd * SRT);
  const endoPx = fd * kd * Q * Y * (BOD - BODe) / 1000 * SRT / (1 + kd * SRT);
  const inertVSS = Q * TSS * (1 - vssr) * vssr / 1000; // conservative approx
  const Px_TSS = (Px_VSS + endoPx) / vssr;
  const V = SRT * Px_TSS * 1000 / MLSS; // m³ total
  const Vn = V / n; // per ditch
  const L_ch = Vn / (w * d); // channel length per ditch
  const HRT = V / (Q / 24);
  const NOx = Math.max(TKN - NH4e - 0.12 * Px_VSS * 1000 / Q, 0);
  const AOR = (Q * (BOD - BODe) / 1000 / 0.68) - (1.42 * Px_VSS) + (4.57 * Q * NOx / 1000); // kg O2/d
  const Rotor_kW = AOR / OE / 24; // kW
  const Sp_air = AOR / V; // kg O2/m3/d volume loading
  const SLR = Px_TSS / V; // kg/m3/d sludge loading
  const FM = (Q * BOD / 1000) / (MLSS * vssr * V / 1000);
  document.getElementById('oxd-res-area').innerHTML =
    rs('📊 Sludge Production', rg([
      rc(f2(Px_VSS, 1), 'Px,bio (VSS)', 'kg/d', 'amb'),
      rc(f2(Px_TSS, 1), 'Px,TSS', 'kg/d', 'amb'),
      rc(f2(NOx, 1), 'NOx (oxidized)', 'mg/L'),
    ])) +
    rs(`🏗️ Oxidation Ditch Sizing (${n} ditches)`, rg([
      rc(f2(V, 0), 'Total Aeration Volume', 'm³', 'amb'),
      rc(f2(Vn, 0), 'Volume per Ditch', 'm³'),
      rc(f2(L_ch, 1), 'Channel Length per Ditch', 'm', 'amb'),
      rc(f2(w, 1), 'Channel Width', 'm'),
      rc(f2(d, 1), 'Liquid Depth', 'm'),
      rc(f2(HRT, 1), 'HRT', 'hr', HRT >= 18 && HRT <= 30 ? 'ok' : 'warn'),
      rc(f2(FM, 4), 'F:M Ratio', 'kg BOD/kg MLVSS/d', FM <= 0.1 ? 'ok' : 'warn'),
    ])) +
    rs('⚡ O₂ Demand & Rotor Sizing', rg([
      rc(f2(AOR, 0), 'AOR (O₂ demand)', 'kg/d', 'amb'),
      rc(f2(AOR / 24, 1), 'AOR', 'kg/hr'),
      rc(f2(Rotor_kW, 1), 'Rotor Power Required', 'kW', 'amb'),
      rc(f2(OE, 2), 'Rotor O₂ Efficiency', 'kg O₂/kWh'),
    ]));
  document.getElementById('oxd-chk-body').innerHTML = `<div class="ck-list">${[
    ck(SRT >= 15 && SRT <= 30, 'SRT 15–30 days (extended aeration)', SRT + ' d', 'M&E Table 7-28'),
    ck(MLSS >= 3000 && MLSS <= 5000, 'MLSS 3000–5000 mg/L', MLSS + ' mg/L'),
    ck(HRT >= 18 && HRT <= 30, 'HRT 18–30 hr', f2(HRT, 1) + ' hr', 'M&E Table 7-28'),
    ck(FM <= 0.1, 'F:M ≤0.10 kg BOD/kg MLVSS/d', f2(FM, 4)),
    ck(d >= 2.5 && d <= 4.5, 'Channel depth 2.5–4.5 m', d + ' m'),
    ck(n >= 2, 'Min 2 ditches', n + ' ditches'),
  ].join('')}</div>`;
}


/* ═══════════════════════════════════════════════════════════
   MODULE: MBBR — BOD REMOVAL + NITRIFICATION
   Ref: M&E 5th Ed. Section 9-7 · Table 9-31
   ═══════════════════════════════════════════════════════════ */
function buildMBBRBOD() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">MBBR — BOD Removal + Nitrification<div class="mt-badge">BIOFILM</div></div>
    <div class="mt-bread">Carrier-based biofilm: SALR for BOD · SARR for Nitrification · M&E 5th Ed. Sec. 9-7</div>
  </div><button class="btn btn-o btn-sm" onclick="buildAndShow('mbbr-select')">← Back to Selection</button></div>
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'mb1-inp')">📋 Inputs</div>
    <div class="tab" onclick="stab(this,'mb1-bas')">📐 Design Basis</div>
    <div class="tab" onclick="stab(this,'mb1-res')">📊 Results</div>
    <div class="tab" onclick="stab(this,'mb1-chk')">✅ Checks</div>
  </div>

  <div class="tp active" id="mb1-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">🟡 MBBR BOD + Nitrification Parameters</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Design Flow Q</label><div class="fuw"><input type="number" id="mb1_Q" value="${G.Q}"><div class="fu">m³/d</div></div></div>
        <div class="f"><label>Influent BOD (to MBBR)</label><div class="fuw"><input type="number" id="mb1_BOD" value="${Math.round(G.BOD*(1-G.primaryBODrem/100))}"><div class="fu">mg/L</div></div><div class="h">After primary treatment</div></div>
        <div class="f"><label>Target Effluent BOD</label><div class="fuw"><input type="number" id="mb1_BODe" value="${G.BODe}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Influent TKN</label><div class="fuw"><input type="number" id="mb1_TKN" value="${G.TKN}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Target NH₄-N Effluent</label><div class="fuw"><input type="number" id="mb1_NH4e" value="${G.NH4e}" step="0.5"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Design Temperature</label><div class="fuw"><input type="number" id="mb1_T" value="${G.T}" step="1"><div class="fu">°C</div></div></div>
        <div class="f"><label>Carrier Specific Surface Area (SSA)</label><div class="fuw"><input type="number" id="mb1_SSA" value="500" step="50"><div class="fu">m²/m³</div></div><div class="h">Supplier value; typical 400–800 m²/m³</div></div>
        <div class="f"><label>Carrier Fill Fraction</label><div class="fuw"><input type="number" id="mb1_fill" value="0.45" step="0.05"><div class="fu">—</div></div><div class="h">Typically 40–50%</div></div>
        <div class="f"><label>SALR — BOD Stage</label><div class="fuw"><input type="number" id="mb1_SALR" value="3.5" step="0.5"><div class="fu">g BOD/m²/d</div></div><div class="h">Range: 2–6 g/m²/d</div></div>
        <div class="f"><label>SARR — Nitrification Stage</label><div class="fuw"><input type="number" id="mb1_SARR" value="1.0" step="0.1"><div class="fu">g NH₄/m²/d</div></div><div class="h">Range: 0.6–1.5 g/m²/d at 20°C</div></div>
        <div class="f"><label>Liquid Depth</label><div class="fuw"><input type="number" id="mb1_D" value="4" step="0.5"><div class="fu">m</div></div></div>
        <div class="f"><label>No. of Trains</label><input type="number" id="mb1_n" value="2" min="1" max="6"></div>
      </div>
    </div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcMBBRBOD()">⚙️ Calculate MBBR BOD + Nitrification</button></div>
  </div>

  <div class="tp" id="mb1-bas">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Equations</div></div><div class="card-body">
      <div class="eq-blk"><div class="eq-t">BOD Stage — Carrier Area Required</div>
        <span class="eq-l">A_BOD</span> = <span class="eq-r">Q × (BOD_in − BOD_out) / (SALR × 1000)</span>
        <div class="eq-where">SALR = Surface Area Loading Rate, g BOD/m²/d</div></div>
      <div class="eq-blk"><div class="eq-t">Nitrification Stage — Carrier Area Required</div>
        <span class="eq-l">A_nitrif</span> = <span class="eq-r">Q × (TKN − NH₄,e) / (SARR × 1000)</span>
        <div class="eq-where">SARR = Surface Area Removal Rate, g NH₄-N/m²/d (temp corrected by θ = 1.06)</div></div>
      <div class="eq-blk"><div class="eq-t">Tank Volume from Carrier Area</div>
        <span class="eq-l">V</span> = <span class="eq-r">A_required / (SSA × fill)</span>
        <div class="eq-where">SSA = Specific Surface Area of carrier (m²/m³) · fill = fractional fill (%)</div></div>
    </div></div>
  </div>

  <div class="tp" id="mb1-res"><div id="mb1-res-area"><div class="alert al-i">Click Calculate to see results.</div></div></div>
  <div class="tp" id="mb1-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body" id="mb1-chk-body"><div class="alert al-i">Calculate first.</div></div></div></div>
</div>`;
}

function calcMBBRBOD() {
  const Q = vv('mb1_Q'), BOD = vv('mb1_BOD'), BODe = vv('mb1_BODe');
  const TKN = vv('mb1_TKN'), NH4e = vv('mb1_NH4e'), T = vv('mb1_T');
  const SSA = vv('mb1_SSA'), fill = vv('mb1_fill');
  const SALR = vv('mb1_SALR'), SARR_20 = vv('mb1_SARR');
  const D = vv('mb1_D'), n = vv('mb1_n');
  // Temperature correction for nitrification (θ = 1.058)
  const SARR_T = SARR_20 * Math.pow(1.058, T - 20);
  // BOD stage
  const A_BOD = Q * (BOD - BODe) / (SALR * 1000); // m²
  const V_BOD = A_BOD / (SSA * fill); // m³
  // Nitrification stage
  const A_nitrif = Q * (TKN - NH4e) / (SARR_T * 1000); // m²
  const V_nitrif = A_nitrif / (SSA * fill); // m³
  // Per train
  const V_BOD_n = V_BOD / n, V_nitrif_n = V_nitrif / n;
  const W_BOD = Math.sqrt(V_BOD_n / (D * 2)), L_BOD = W_BOD * 2;
  const W_nitrif = Math.sqrt(V_nitrif_n / (D * 2)), L_nitrif = W_nitrif * 2;
  const HRT_BOD = V_BOD / (Q / 24), HRT_nitrif = V_nitrif / (Q / 24);
  const carrier_BOD = V_BOD * fill; // m³ of carrier
  const carrier_nitrif = V_nitrif * fill;
  document.getElementById('mb1-res-area').innerHTML =
    rs('🟡 BOD Removal Stage', rg([
      rc(f2(A_BOD, 0), 'Carrier Area Required', 'm²', 'amb'),
      rc(f2(V_BOD, 1), 'Tank Volume (total)', 'm³', 'amb'),
      rc(f2(V_BOD_n, 1), 'Volume per Train', 'm³'),
      rc(f2(carrier_BOD, 1), 'Carrier Volume', 'm³'),
      rc(f2(HRT_BOD, 2), 'HRT', 'hr', HRT_BOD >= 0.5 ? 'ok' : 'warn'),
      rc(f2(SALR, 2), 'SALR Applied', 'g BOD/m²/d', SALR >= 2 && SALR <= 6 ? 'ok' : 'warn'),
    ])) +
    rs('🔵 Nitrification Stage', rg([
      rc(f2(SARR_T, 3), 'SARR at Design Temp', 'g NH₄/m²/d', 'amb'),
      rc(f2(A_nitrif, 0), 'Carrier Area Required', 'm²', 'amb'),
      rc(f2(V_nitrif, 1), 'Tank Volume (total)', 'm³', 'amb'),
      rc(f2(V_nitrif_n, 1), 'Volume per Train', 'm³'),
      rc(f2(carrier_nitrif, 1), 'Carrier Volume', 'm³'),
      rc(f2(HRT_nitrif, 2), 'HRT', 'hr'),
    ])) +
    rs('⚙️ Carrier Specification', rg([
      rc(f2(SSA, 0), 'Carrier SSA', 'm²/m³'),
      rc(f2(fill * 100, 0), 'Fill Fraction', '%', fill >= 0.40 && fill <= 0.50 ? 'ok' : 'warn'),
      rc(n, 'No. of Trains', '—'),
    ]));
  document.getElementById('mb1-chk-body').innerHTML = `<div class="ck-list">${[
    ck(fill >= 0.40 && fill <= 0.50, 'Carrier fill 40–50%', f2(fill * 100, 0) + '%', 'M&E Sec. 9-7'),
    ck(SALR >= 2 && SALR <= 6, 'SALR 2–6 g BOD/m²/d', f2(SALR, 2), 'M&E Table 9-31'),
    ck(SARR_20 >= 0.6 && SARR_20 <= 1.5, 'SARR 0.6–1.5 g NH₄/m²/d @ 20°C', f2(SARR_20, 2), 'M&E Table 9-31'),
    ck(n >= 2, 'Min 2 trains', n + ' trains'),
    ck(HRT_BOD >= 0.5, 'BOD stage HRT ≥0.5 hr', f2(HRT_BOD, 2) + ' hr'),
  ].join('')}</div>`;
}


/* ═══════════════════════════════════════════════════════════
   MODULE: MBBR — NITRIFICATION-DENITRIFICATION (BNR)
   Ref: M&E 5th Ed. Section 9-7
   ═══════════════════════════════════════════════════════════ */
function buildMBBRBNR() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">MBBR — Nitrification–Denitrification<div class="mt-badge">BIOFILM</div></div>
    <div class="mt-bread">Full BNR: Pre-anoxic denitrification + MBBR nitrification · M&E 5th Ed. Sec. 9-7</div>
  </div><button class="btn btn-o btn-sm" onclick="buildAndShow('mbbr-select')">← Back to Selection</button></div>
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'mb2-inp')">📋 Inputs</div>
    <div class="tab" onclick="stab(this,'mb2-res')">📊 Results</div>
    <div class="tab" onclick="stab(this,'mb2-chk')">✅ Checks</div>
  </div>

  <div class="tp active" id="mb2-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">♻️ MBBR BNR Design Parameters</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Design Flow Q</label><div class="fuw"><input type="number" id="mb2_Q" value="${G.Q}"><div class="fu">m³/d</div></div></div>
        <div class="f"><label>Influent BOD (post-primary)</label><div class="fuw"><input type="number" id="mb2_BOD" value="${Math.round(G.BOD*(1-G.primaryBODrem/100))}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Influent TKN</label><div class="fuw"><input type="number" id="mb2_TKN" value="${G.TKN}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Target NO₃-N Effluent</label><div class="fuw"><input type="number" id="mb2_NO3e" value="10" step="1"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Target NH₄-N Effluent</label><div class="fuw"><input type="number" id="mb2_NH4e" value="${G.NH4e}" step="0.5"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Temperature</label><div class="fuw"><input type="number" id="mb2_T" value="${G.T}" step="1"><div class="fu">°C</div></div></div>
        <div class="f"><label>SARR @ 20°C (Nitrification)</label><div class="fuw"><input type="number" id="mb2_SARR" value="1.0" step="0.1"><div class="fu">g NH₄/m²/d</div></div></div>
        <div class="f"><label>SDNR (Denitrification)</label><div class="fuw"><input type="number" id="mb2_SDNR" value="0.08" step="0.01"><div class="fu">g NO₃/m²/d</div></div><div class="h">Suspended carrier; typical 0.05–0.12</div></div>
        <div class="f"><label>Carrier SSA</label><div class="fuw"><input type="number" id="mb2_SSA" value="500" step="50"><div class="fu">m²/m³</div></div></div>
        <div class="f"><label>Carrier Fill Fraction</label><div class="fuw"><input type="number" id="mb2_fill" value="0.45" step="0.05"><div class="fu">—</div></div></div>
        <div class="f"><label>Internal Recycle Ratio (IR)</label><div class="fuw"><input type="number" id="mb2_IR" value="3" step="0.5"><div class="fu">× Q</div></div><div class="h">Typical 2–5×</div></div>
        <div class="f"><label>Liquid Depth</label><div class="fuw"><input type="number" id="mb2_D" value="4" step="0.5"><div class="fu">m</div></div></div>
        <div class="f"><label>No. of Trains</label><input type="number" id="mb2_n" value="2" min="1" max="6"></div>
      </div>
    </div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcMBBRBNR()">⚙️ Calculate MBBR BNR</button></div>
  </div>

  <div class="tp" id="mb2-res"><div id="mb2-res-area"><div class="alert al-i">Click Calculate to see results.</div></div></div>
  <div class="tp" id="mb2-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body" id="mb2-chk-body"><div class="alert al-i">Calculate first.</div></div></div></div>
</div>`;
}

function calcMBBRBNR() {
  const Q = vv('mb2_Q'), BOD = vv('mb2_BOD'), TKN = vv('mb2_TKN');
  const NO3e = vv('mb2_NO3e'), NH4e = vv('mb2_NH4e'), T = vv('mb2_T');
  const SARR_20 = vv('mb2_SARR'), SDNR = vv('mb2_SDNR');
  const SSA = vv('mb2_SSA'), fill = vv('mb2_fill'), IR = vv('mb2_IR');
  const D = vv('mb2_D'), n = vv('mb2_n');
  const SARR_T = SARR_20 * Math.pow(1.058, T - 20);
  // NOx to be removed by denitrification
  const NOx = Math.max(TKN - NH4e - NO3e, 0);
  // Nitrification carrier
  const A_nitrif = Q * (TKN - NH4e) / (SARR_T * 1000);
  const V_nitrif = A_nitrif / (SSA * fill);
  // Denitrification carrier (pre-anoxic)
  const Q_recirc = Q * IR; // internal recycle flow
  const A_denitrif = Q * NOx / (SDNR * 1000);
  const V_denitrif = A_denitrif / (SSA * fill);
  const HRT_nitrif = V_nitrif / (Q / 24);
  const HRT_denitrif = V_denitrif / (Q / 24);
  const recycle_pump = Q_recirc / 24; // m³/hr
  document.getElementById('mb2-res-area').innerHTML =
    rs('↩️ Pre-Anoxic Denitrification Zone', rg([
      rc(f2(NOx, 1), 'NO₃ to Remove', 'mg/L', 'amb'),
      rc(f2(A_denitrif, 0), 'Carrier Area Required', 'm²', 'amb'),
      rc(f2(V_denitrif, 1), 'Total Anoxic Volume', 'm³', 'amb'),
      rc(f2(V_denitrif / n, 1), 'Volume per Train', 'm³'),
      rc(f2(HRT_denitrif, 2), 'HRT', 'hr'),
      rc(f2(IR, 1), 'Internal Recycle Ratio', '× Q', IR >= 2 && IR <= 5 ? 'ok' : 'warn'),
    ])) +
    rs('🔵 Nitrification Zone', rg([
      rc(f2(SARR_T, 3), 'SARR at Design Temp', 'g NH₄/m²/d', 'amb'),
      rc(f2(A_nitrif, 0), 'Carrier Area Required', 'm²', 'amb'),
      rc(f2(V_nitrif, 1), 'Total Aerobic Volume', 'm³', 'amb'),
      rc(f2(V_nitrif / n, 1), 'Volume per Train', 'm³'),
      rc(f2(HRT_nitrif, 2), 'HRT', 'hr'),
    ])) +
    rs('⚙️ System Summary', rg([
      rc(f2((V_nitrif + V_denitrif), 1), 'Total Reactor Volume', 'm³', 'amb'),
      rc(f2(recycle_pump, 1), 'Recycle Pump Rate', 'm³/hr'),
      rc(f2(fill * 100, 0), 'Carrier Fill', '%', fill >= 0.40 && fill <= 0.50 ? 'ok' : 'warn'),
      rc(n, 'No. of Trains', '—'),
    ]));
  document.getElementById('mb2-chk-body').innerHTML = `<div class="ck-list">${[
    ck(SARR_20 >= 0.6 && SARR_20 <= 1.5, 'SARR 0.6–1.5 g NH₄/m²/d @ 20°C', f2(SARR_20, 2)),
    ck(IR >= 2 && IR <= 5, 'Internal recycle ratio 2–5×', f2(IR, 1) + '× Q'),
    ck(fill >= 0.40 && fill <= 0.50, 'Carrier fill 40–50%', f2(fill * 100, 0) + '%'),
    ck(n >= 2, 'Min 2 trains', n + ' trains'),
    ck(HRT_nitrif >= 0.5, 'Nitrif. HRT ≥0.5 hr', f2(HRT_nitrif, 2) + ' hr'),
  ].join('')}</div>`;
}


/* ═══════════════════════════════════════════════════════════
   MODULE: SBR DESIGN — BOD + NITRIFICATION + DENITRIFICATION
   Ref: M&E 5th Ed. Section 7-9 · Table 7-23
   ═══════════════════════════════════════════════════════════ */
function buildSBR() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">SBR Design<div class="mt-badge">BATCH</div></div>
    <div class="mt-bread">Sequencing Batch Reactor — BOD, Nitrification &amp; Denitrification · M&E 5th Ed. Sec. 7-9</div>
  </div></div>
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'sbr-inp')">📋 Inputs</div>
    <div class="tab" onclick="stab(this,'sbr-bas')">📐 Design Basis</div>
    <div class="tab" onclick="stab(this,'sbr-res')">📊 Results</div>
    <div class="tab" onclick="stab(this,'sbr-chk')">✅ Checks</div>
  </div>

  <div class="tp active" id="sbr-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">🔄 SBR Design Parameters</div><div class="card-hd-s">M&E 5th Ed. Table 7-23</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Design Flow Q</label><div class="fuw"><input type="number" id="sbr_Q" value="${G.Q}"><div class="fu">m³/d</div></div></div>
        <div class="f"><label>Influent BOD₅</label><div class="fuw"><input type="number" id="sbr_BOD" value="${G.BOD}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Influent TKN</label><div class="fuw"><input type="number" id="sbr_TKN" value="${G.TKN}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Influent TSS</label><div class="fuw"><input type="number" id="sbr_TSS" value="${G.TSS}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Target Effluent BOD</label><div class="fuw"><input type="number" id="sbr_BODe" value="${G.BODe}"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Target NH₄-N Effluent</label><div class="fuw"><input type="number" id="sbr_NH4e" value="${G.NH4e}" step="0.5"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>Design SRT</label><div class="fuw"><input type="number" id="sbr_SRT" value="15" step="5"><div class="fu">days</div></div><div class="h">Typical: 10–25 d</div></div>
        <div class="f"><label>MLSS</label><div class="fuw"><input type="number" id="sbr_MLSS" value="3500" step="500"><div class="fu">mg/L</div></div><div class="h">Typical: 2500–4500</div></div>
        <div class="f"><label>No. of Basins</label><input type="number" id="sbr_n" value="2" min="2" max="6"><div class="h">Min 2</div></div>
        <div class="f"><label>Cycle Time</label><div class="fuw"><input type="number" id="sbr_tc" value="6" step="1"><div class="fu">hr</div></div><div class="h">Typical: 4–8 hr</div></div>
        <div class="f"><label>Fill Time (fraction)</label><input type="number" id="sbr_tfill" value="0.25" step="0.05"><div class="h">Fraction of cycle; 0.20–0.35</div></div>
        <div class="f"><label>Settle Time</label><div class="fuw"><input type="number" id="sbr_tset" value="1" step="0.25"><div class="fu">hr</div></div><div class="h">Typical: 0.5–1.5 hr</div></div>
        <div class="f"><label>Decant Time</label><div class="fuw"><input type="number" id="sbr_tdec" value="0.5" step="0.25"><div class="fu">hr</div></div><div class="h">Typical: 0.5–1.0 hr</div></div>
        <div class="f"><label>Liquid Depth</label><div class="fuw"><input type="number" id="sbr_D" value="5" step="0.5"><div class="fu">m</div></div></div>
        <div class="f"><label>Temperature</label><div class="fuw"><input type="number" id="sbr_T" value="${G.T}" step="1"><div class="fu">°C</div></div></div>
      </div>
    </div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcSBR()">⚙️ Calculate SBR Design</button></div>
  </div>

  <div class="tp" id="sbr-bas">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Equations — SBR Sequencing</div></div><div class="card-body">
      <div class="eq-blk"><div class="eq-t">Fill Volume per Cycle per Basin</div>
        <span class="eq-l">V_fill</span> = <span class="eq-r">Q × tc / (n × 24)</span>
        <div class="eq-where">tc = cycle time (hr) · n = no. of basins</div></div>
      <div class="eq-blk"><div class="eq-t">Total Basin Volume (SRT basis)</div>
        <span class="eq-l">V_total</span> = <span class="eq-r">SRT × Px,TSS × 1000 / MLSS / n</span></div>
      <div class="eq-blk"><div class="eq-t">Decant Flow Rate</div>
        <span class="eq-l">Q_dec</span> = <span class="eq-r">V_fill / t_decant</span>
        <div class="eq-where">Used to size the floating decanter pump</div></div>
      <div class="eq-blk"><div class="eq-t">Cycle Sequence (Nitrif+Denitrif)</div>
        <span class="eq-r">Fill (anoxic) → React/Aerate → Anoxic Decant → Settle → Decant</span>
        <div class="eq-where">t_react = tc − t_fill − t_settle − t_decant</div></div>
    </div></div>
  </div>

  <div class="tp" id="sbr-res"><div id="sbr-res-area"><div class="alert al-i">Click Calculate to see results.</div></div></div>
  <div class="tp" id="sbr-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body" id="sbr-chk-body"><div class="alert al-i">Calculate first.</div></div></div></div>
</div>`;
}

function calcSBR() {
  const Q = vv('sbr_Q'), BOD = vv('sbr_BOD'), TKN = vv('sbr_TKN'), TSS = vv('sbr_TSS');
  const BODe = vv('sbr_BODe'), NH4e = vv('sbr_NH4e'), SRT = vv('sbr_SRT'), MLSS = vv('sbr_MLSS');
  const n = vv('sbr_n'), tc = vv('sbr_tc'), tfill_f = vv('sbr_tfill');
  const tset = vv('sbr_tset'), tdec = vv('sbr_tdec'), D = vv('sbr_D'), T = vv('sbr_T');
  // Kinetics (temp corrected)
  const Y = 0.45, kd = 0.05 * Math.pow(1.04, T - 20), vssr = 0.75;
  const Px_VSS = Q * Y * (BOD - BODe) / 1000 / (1 + kd * SRT);
  const Px_TSS = Px_VSS / vssr;
  // Volume
  const V_SRT = SRT * Px_TSS * 1000 / MLSS; // total m³
  const tfill_hr = tc * tfill_f;
  const V_fill = Q * tc / (n * 24); // m³ fill per cycle per basin
  // Volume per basin = max(SRT basis, fill volume + 30% operating volume)
  const V_basin = Math.max(V_SRT / n, V_fill * 3.0);
  const V_total = V_basin * n;
  const HRT = V_total / (Q / 24);
  // Cycle breakdown
  const t_react = tc - tfill_hr - tset - tdec;
  const FM = (Q * BOD / 1000) / (MLSS * vssr * V_total / 1000);
  // O2 demand
  const NOx = Math.max(TKN - NH4e - 0.12 * Px_VSS * 1000 / Q, 0);
  const AOR = (Q * (BOD - BODe) / 1000 / 0.68) - (1.42 * Px_VSS) + (4.57 * Q * NOx / 1000);
  // Decanter sizing
  const Q_dec = V_fill / tdec; // m³/hr per basin
  const A_basin = V_basin / D;
  const W_basin = Math.sqrt(A_basin / 2), L_basin = W_basin * 2;
  document.getElementById('sbr-res-area').innerHTML =
    rs('📊 Sludge Production', rg([
      rc(f2(Px_VSS, 1), 'Px,VSS', 'kg/d', 'amb'),
      rc(f2(Px_TSS, 1), 'Px,TSS', 'kg/d'),
      rc(f2(NOx, 1), 'NOx (nitrification)', 'mg/L'),
    ])) +
    rs(`🏗️ SBR Basin Sizing (${n} basins)`, rg([
      rc(f2(V_basin, 0), 'Volume per Basin', 'm³', 'amb'),
      rc(f2(V_total, 0), 'Total Volume', 'm³', 'amb'),
      rc(f2(L_basin, 1), 'Basin Length L', 'm'),
      rc(f2(W_basin, 1), 'Basin Width W', 'm'),
      rc(f2(D, 1), 'Liquid Depth', 'm'),
      rc(f2(HRT, 1), 'Avg HRT', 'hr', HRT >= 12 && HRT <= 30 ? 'ok' : 'warn'),
      rc(f2(FM, 4), 'F:M Ratio', 'kg BOD/kg MLVSS/d', FM <= 0.15 ? 'ok' : 'warn'),
    ])) +
    rs('⏱️ Cycle Analysis', rg([
      rc(f2(tc, 1), 'Total Cycle Time', 'hr'),
      rc(f2(tfill_hr, 2), 'Fill Time', 'hr'),
      rc(f2(t_react, 2), 'React Time', 'hr', t_react > 0 ? 'ok' : 'warn'),
      rc(f2(tset, 2), 'Settle Time', 'hr'),
      rc(f2(tdec, 2), 'Decant Time', 'hr'),
      rc(Math.round(24 / tc), 'Cycles per Day', 'cycles/d'),
    ])) +
    rs('⚡ O₂ & Decanter', rg([
      rc(f2(AOR, 0), 'AOR (O₂ demand)', 'kg/d', 'amb'),
      rc(f2(AOR / 24, 1), 'Peak AOR', 'kg/hr'),
      rc(f2(Q_dec, 1), 'Decanter Flow Rate', 'm³/hr', 'amb'),
      rc(f2(V_fill, 1), 'Fill Volume/Basin/Cycle', 'm³'),
    ]));
  document.getElementById('sbr-chk-body').innerHTML = `<div class="ck-list">${[
    ck(SRT >= 10 && SRT <= 25, 'SRT 10–25 days', SRT + ' d', 'M&E Table 7-23'),
    ck(MLSS >= 2500 && MLSS <= 4500, 'MLSS 2500–4500 mg/L', MLSS + ' mg/L'),
    ck(tc >= 4 && tc <= 8, 'Cycle time 4–8 hr', tc + ' hr', 'M&E Table 7-23'),
    ck(t_react > 0, 'Positive react time', f2(t_react, 2) + ' hr'),
    ck(tset >= 0.5 && tset <= 1.5, 'Settle time 0.5–1.5 hr', tset + ' hr'),
    ck(FM <= 0.15, 'F:M ≤0.15', f2(FM, 4)),
    ck(n >= 2, 'Min 2 basins', n + ' basins'),
    ck(HRT >= 12 && HRT <= 30, 'HRT 12–30 hr', f2(HRT, 1) + ' hr'),
  ].join('')}</div>`;
}


/* ═══════════════════════════════════════════════════════════
   MODULE: AERATION SYSTEM & BLOWER SIZING
   Ref: M&E 5th Ed. Section 5-12 · Tables 5-38, 5-39
   ═══════════════════════════════════════════════════════════ */
function buildAeration() {
  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">Aeration System &amp; Blower Sizing<div class="mt-badge">UTILITIES</div></div>
    <div class="mt-bread">SOTR→AOTE conversion · Blower HP · Diffuser layout · M&E 5th Ed. Sec. 5-12</div>
  </div></div>
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'aer-inp')">📋 Inputs</div>
    <div class="tab" onclick="stab(this,'aer-bas')">📐 Design Basis</div>
    <div class="tab" onclick="stab(this,'aer-res')">📊 Results</div>
    <div class="tab" onclick="stab(this,'aer-chk')">✅ Checks</div>
  </div>

  <div class="tp active" id="aer-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">🌬️ Aeration System Parameters</div><div class="card-hd-s">Enter process and site conditions</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Process AOR Required</label><div class="fuw"><input type="number" id="aer_AOR" value="500" step="50"><div class="fu">kg O₂/d</div></div><div class="h">From biological process design</div></div>
        <div class="f"><label>Design Temperature</label><div class="fuw"><input type="number" id="aer_T" value="${G.T}" step="1"><div class="fu">°C</div></div></div>
        <div class="f"><label>Site Elevation</label><div class="fuw"><input type="number" id="aer_elev" value="100" step="50"><div class="fu">m asl</div></div></div>
        <div class="f"><label>Ambient Air Temp.</label><div class="fuw"><input type="number" id="aer_Tamb" value="30" step="1"><div class="fu">°C</div></div></div>
        <div class="f"><label>DO in Basin (C_L)</label><div class="fuw"><input type="number" id="aer_DO" value="2" step="0.5"><div class="fu">mg/L</div></div></div>
        <div class="f"><label>O₂ Transfer Ratio α</label><input type="number" id="aer_alpha" value="0.6" step="0.05"><div class="h">Fine bubble: 0.4–0.7</div></div>
        <div class="f"><label>DO Sat. Ratio β</label><input type="number" id="aer_beta" value="1.0" step="0.05"><div class="h">Freshwater ≈ 1.0</div></div>
        <div class="f"><label>Diffuser Fouling Factor F</label><input type="number" id="aer_F" value="0.8" step="0.05"></div>
        <div class="f"><label>SOTE (Process Water)</label><div class="fuw"><input type="number" id="aer_SOTE" value="25" step="1"><div class="fu">%</div></div><div class="h">Fine bubble: 20–35%</div></div>
        <div class="f"><label>Diffuser Depth</label><div class="fuw"><input type="number" id="aer_ddiff" value="4.5" step="0.25"><div class="fu">m</div></div></div>
        <div class="f"><label>Pressure Drop (Diffuser)</label><div class="fuw"><input type="number" id="aer_DPdiff" value="0.025" step="0.005"><div class="fu">bar</div></div></div>
        <div class="f"><label>Blower Efficiency η</label><div class="fuw"><input type="number" id="aer_eta" value="0.70" step="0.05"><div class="fu">—</div></div><div class="h">Typical: 0.65–0.80</div></div>
        <div class="f"><label>Safety Factor</label><input type="number" id="aer_SF" value="1.25" step="0.05"><div class="h">Apply to AOR for design</div></div>
      </div>
    </div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcAeration()">⚙️ Calculate Aeration System</button></div>
  </div>

  <div class="tp" id="aer-bas">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Equations</div></div><div class="card-body">
      <div class="eq-blk"><div class="eq-t">DO Saturation — Polynomial (M&E Sheet 7)</div>
        <span class="eq-l">Cs</span> = <span class="eq-r">−7.044×10⁻⁵·T³ + 7.65×10⁻³·T² − 0.4006·T + 14.6</span></div>
      <div class="eq-blk"><div class="eq-t">AOTE — Actual O₂ Transfer Efficiency</div>
        <span class="eq-l">AOTE</span> = <span class="eq-r">SOTE × α × F × [(β·Cs·Pd/Patm − C_L) / Cs,std] × θ^(T−20)</span>
        <div class="eq-where">θ = 1.024 · Cs,std = 9.17 mg/L at 20°C · Pd = pressure at diffuser mid-depth</div></div>
      <div class="eq-blk"><div class="eq-t">Air Flow Rate Required</div>
        <span class="eq-l">Q_air</span> = <span class="eq-r">AOR × SF / (AOTE × ρ_O2_air × 24)</span>
        <div class="eq-where">ρ_O2_air ≈ 0.2758 kg O₂/m³ air (STP)</div></div>
      <div class="eq-blk"><div class="eq-t">Blower Power</div>
        <span class="eq-l">P</span> = <span class="eq-r">Q_air × ρ_air × R·T_amb/(η·MW_air) × [(P_out/P_in)^0.283 − 1]</span>
        <div class="eq-where">Isentropic compression formula · R = 8314 J/kmol·K · MW_air = 28.97</div></div>
    </div></div>
  </div>

  <div class="tp" id="aer-res"><div id="aer-res-area"><div class="alert al-i">Click Calculate to see results.</div></div></div>
  <div class="tp" id="aer-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body" id="aer-chk-body"><div class="alert al-i">Calculate first.</div></div></div></div>
</div>`;
}

function calcAeration() {
  const AOR = vv('aer_AOR'), T = vv('aer_T'), elev = vv('aer_elev'), Tamb = vv('aer_Tamb');
  const DO = vv('aer_DO'), alpha = vv('aer_alpha'), beta = vv('aer_beta'), F = vv('aer_F');
  const SOTE = vv('aer_SOTE') / 100, ddiff = vv('aer_ddiff'), DPdiff = vv('aer_DPdiff');
  const eta = vv('aer_eta'), SF = vv('aer_SF');
  const MW_air = 28.97, R = 8314, gamma = 9.79, Css20 = 9.17, theta = 1.024, Pstd = 1.013;
  // Atmospheric pressure at elevation
  const Tamb_K = Tamb + 273.15;
  const Patm = 1.013 * Math.exp(-9.81 * MW_air * elev / (R * Tamb_K));
  // DO saturation polynomial
  const Cs = -0.00007044 * Math.pow(T, 3) + 0.00765 * Math.pow(T, 2) - 0.4006 * T + 14.6;
  // Pressure at mid-diffuser depth
  const Pd = Patm + (gamma * ddiff / 2) / 100;
  // AOTE
  const AOTE = SOTE * alpha * F * ((beta * Cs * (Pd / Patm) - DO) / Css20) * Math.pow(theta, T - 20);
  // Air density
  const rho_air = MW_air * Pstd * 100 / (8.314 * (0 + 273.15)); // kg/m³ at STP
  // O2 in standard air = 0.209 fraction by volume
  const rho_O2 = rho_air * 0.209 * (32 / MW_air); // kg O2/m3 air
  const AOR_design = AOR * SF; // kg/d
  const Q_air_Nm3hr = AOR_design / (AOTE * rho_O2 * 24); // Nm³/hr
  // Blower outlet pressure
  const P_outlet = Patm + DPdiff + gamma * ddiff / 100;
  const Q_air_m3hr = Q_air_Nm3hr * (Pstd / P_outlet) * ((Tamb + 273.15) / 273.15);
  // Blower shaft power (isentropic)
  const Q_m3s = Q_air_m3hr / 3600;
  const rho_act = MW_air * Patm * 100 / (R * Tamb_K); // kg/m3 actual
  const P_shaft = Q_m3s * rho_act * R * Tamb_K / (eta * MW_air * 1000) * (Math.pow(P_outlet / Patm, 0.283) - 1); // kW
  const P_installed = P_shaft * 1.25; // 25% installed margin
  document.getElementById('aer-res-area').innerHTML =
    rs('🌡️ Site Conditions', rg([
      rc(f2(Patm, 3), 'Atmospheric Pressure', 'bar', 'amb'),
      rc(f2(Cs, 2), 'Sat. DO at Design Temp', 'mg/L', 'amb'),
      rc(f2(Pd, 3), 'Pressure at Diffuser Mid-Depth', 'bar'),
      rc(f2(rho_air, 3), 'Standard Air Density', 'kg/m³'),
    ])) +
    rs('💨 Air Flow', rg([
      rc(f2(AOTE * 100, 2), 'AOTE', '%', AOTE > 0.05 ? 'ok' : 'warn'),
      rc(f2(AOR_design, 0), 'Design AOR (with SF)', 'kg/d', 'amb'),
      rc(f2(Q_air_Nm3hr, 0), 'Air Flow Rate (Std)', 'Nm³/hr', 'amb'),
      rc(f2(Q_air_m3hr, 0), 'Air Flow Rate (Delivery)', 'm³/hr'),
      rc(f2(P_outlet, 3), 'Blower Outlet Pressure', 'bar', 'amb'),
    ])) +
    rs('⚡ Blower Power', rg([
      rc(f2(P_shaft, 1), 'Shaft Power (calc)', 'kW', 'amb'),
      rc(f2(P_installed, 1), 'Installed Power (+25%)', 'kW', 'amb'),
      rc(f2(eta * 100, 0), 'Blower Efficiency', '%'),
      rc(f2(SF, 2), 'AOR Safety Factor', '×'),
    ]));
  document.getElementById('aer-chk-body').innerHTML = `<div class="ck-list">${[
    ck(AOTE > 0.05, 'AOTE > 5%', f2(AOTE * 100, 2) + '%'),
    ck(SOTE >= 0.15 && SOTE <= 0.40, 'SOTE 15–40% (fine bubble)', f2(SOTE * 100, 0) + '%', 'M&E Table 5-38'),
    ck(alpha >= 0.4 && alpha <= 0.8, 'α factor 0.4–0.8 (fine bubble)', f2(alpha, 2), 'M&E Table 5-39'),
    ck(eta >= 0.60 && eta <= 0.85, 'Blower efficiency 60–85%', f2(eta * 100, 0) + '%'),
    ck(ddiff >= 3 && ddiff <= 6, 'Diffuser depth 3–6 m', ddiff + ' m'),
    ck(P_shaft > 0, 'Blower power positive', f2(P_shaft, 1) + ' kW'),
  ].join('')}</div>`;
}
