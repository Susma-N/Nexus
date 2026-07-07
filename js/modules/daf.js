/* ══════════════════════════════════════════════════════════════════════════════
   DISSOLVED AIR FLOTATION (DAF) DESIGN ENGINE — Aapaavani NEXUS
   Complete Replication of: "Dissolved Air Floatation Design Calculations - S.I. units"
   Workbook Author: Harlan H. Bengtson
   ══════════════════════════════════════════════════════════════════════════════ */

const DAFEngine = {
  chart: null,

  /* ─── READ INPUTS ─── */
  read() {
    const v = id => { const e = document.getElementById(id); return e ? (parseFloat(e.value) || 0) : 0; };
    const s = id => { const e = document.getElementById(id); return e ? e.value : ''; };
    
    return {
      OG:         v('daf_OG'),       // mg/L
      Ch:         v('daf_Ch'),       // mg/L
      Q:          v('daf_Q'),        // m3/d
      R:          v('daf_R'),        // m3/d
      T:          v('daf_T'),        // oC
      Pg:         v('daf_Pg'),       // kPa (gauge)
      Patm:       v('daf_Patm'),     // kPa
      f:          v('daf_f'),        // Efficiency Factor
      TSS:        v('daf_TSS'),      // mg/L
      basis:      s('daf_basis'),    // "Hydraulic Loading" or "Solids Loading"
      loading:    v('daf_loading'),  // L/m2/min or kg/m2/hr
      mode:       s('daf_mode')      // "Only recycle flow is pressurized" or "All of the flow is pressurized"
    };
  },

  /* ─── MASTER CALCULATION ENGINE ─── */
  calc() {
    try {
      const el = document.getElementById('daf-module');
      if (!el) return;
      const I = this.read();

      // Ensure dynamic UI label for loading input matches basis
      const lblEl = document.getElementById('daf_loading_lbl');
      const uEl = document.getElementById('daf_loading_unit');
      if (lblEl && uEl) {
        if (I.basis === "Hydraulic Loading") {
          lblEl.textContent = "Design Hydr. Loading =";
          uEl.textContent = "L/m²/min";
        } else {
          lblEl.textContent = "Design Solids Loading =";
          uEl.textContent = "kg/m²/hr";
        }
      }

      // Air Solubility (sa): -0.0002000T^3 + 0.01750T^2 - 0.7950T + 29.20
      const sa = -0.0002 * Math.pow(I.T, 3) + 0.0175 * Math.pow(I.T, 2) - 0.795 * I.T + 29.2;
      
      // Abs. Recycle Pressure (P, atm)
      const P = (I.Pg + I.Patm) / 101.35;
      
      // % Recycle
      const pctRecycle = (I.Q > 0) ? (I.R / I.Q) * 100 : 0;
      
      // Influent Susp. Solids (Sa)
      const Sa = I.TSS + I.OG + I.Ch;
      
      // Air to Solids Ratio (A/S)
      let AS = 0;
      if (Sa > 0) {
        if (I.mode === "Only recycle flow is pressurized") {
          AS = (I.Q > 0) ? (1.3 * sa * (I.f * P - 1) * I.R) / (Sa * I.Q) : 0;
        } else {
          AS = (1.3 * sa * (I.f * P - 1)) / Sa;
        }
      }
      
      // Solids Rate In (S)
      const S_kghr = (I.Q * Sa / 24) / 1000;
      const S_gmin = S_kghr * 1000 / 60;
      
      // Air Required (m3/hr)
      const AirReq_m3hr = (AS * S_gmin / 1000) * 60;
      
      // Air Density at P & T (rair)
      const rair = 28.97 * (I.Pg + I.Patm) / (8.3145 * (I.T + 273.15));
      
      // Air Requirement (kg/hr) -> Exact Excel Formula: H27 = H24*H26*60
      const AirReq_kghr = AirReq_m3hr * rair * 60;
      
      // Air Required (Nm3/hr)
      const AirReq_Nm3hr = AirReq_m3hr * ((P * 1.01325)/1) * ((20 + 273.15)/(I.T + 273.15));
      
      // Required DAF area
      let DAFArea = 0;
      if (I.loading > 0) {
        if (I.basis === "Hydraulic Loading") {
          DAFArea = ((I.Q + I.R) * 1000 / (24 * 60)) / I.loading;
        } else {
          DAFArea = S_kghr / I.loading;
        }
      }
      
      // Calculated secondary loading (the one not chosen)
      let calcHydrLoading = 0, calcSolidsLoading = 0;
      if (DAFArea > 0) {
        calcSolidsLoading = S_kghr / DAFArea;
        calcHydrLoading = ((I.Q + I.R) * 1000 / (24 * 60)) / DAFArea;
      }

      const R = {
        sa, P, pctRecycle, Sa, AS, S_kghr, S_gmin, AirReq_m3hr, rair, AirReq_kghr, AirReq_Nm3hr, DAFArea, calcHydrLoading, calcSolidsLoading
      };

      this.render(R, I);
      this.drawSVG(R, I);
      this.updateChart(I.T, sa);
    } catch (err) {
      console.error('DAF Calculation Error:', err);
    }
  },

  /* ─── RENDER RESULTS ─── */
  render(R, I) {
    const sv = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    const n = (v, d) => (typeof v === 'number' && isFinite(v)) ? (+v).toFixed(d) : '—';
    const fi = v => (typeof v === 'number' && isFinite(v)) ? Math.round(v).toLocaleString() : '—';

    // Intermediate
    sv('daf_r_sa', n(R.sa, 1));
    sv('daf_r_P', n(R.P, 3));
    sv('daf_r_pctRecycle', n(R.pctRecycle, 1) + '%');
    sv('daf_r_Sa', fi(R.Sa));
    sv('daf_r_AS', n(R.AS, 6));
    sv('daf_r_S_kghr', n(R.S_kghr, 1));
    sv('daf_r_S_gmin', n(R.S_gmin, 1));
    sv('daf_r_AirReq_m3hr', n(R.AirReq_m3hr, 4));
    sv('daf_r_rair', n(R.rair, 4));
    sv('daf_r_AirReq_kghr', n(R.AirReq_kghr, 2));
    sv('daf_r_AirReq_Nm3hr', n(R.AirReq_Nm3hr, 4));

    // Area
    sv('daf_r_DAFArea', n(R.DAFArea, 2));
    
    // KPI
    sv('daf_kpi_Area', n(R.DAFArea, 1));
    sv('daf_kpi_AS', n(R.AS, 4));
    sv('daf_kpi_AirReq', n(R.AirReq_Nm3hr, 2));
    sv('daf_kpi_Sload', n(R.calcSolidsLoading, 2));

    // Dynamic checks tab
    const chksHtml = [
      ck(R.AS >= 0.005 && R.AS <= 0.06,  'A/S Ratio: 0.005 - 0.06 mL/mg typical', n(R.AS, 4) + ' mL/mg', 'M&E 4th Ed.'),
      ck(R.DAFArea > 0,                  'Required DAF Area calculated', n(R.DAFArea, 1) + ' m²', ''),
      ck(R.calcSolidsLoading > 0,        'Applied Solids Loading', n(R.calcSolidsLoading, 2) + ' kg/m²/hr', ''),
      ck(R.calcHydrLoading > 0,          'Applied Hydraulic Loading', n(R.calcHydrLoading, 2) + ' L/m²/min', '')
    ].join('');
    const checksEl = document.getElementById('daf_r_checks');
    if (checksEl) checksEl.innerHTML = `<div class="ck-list">${chksHtml}</div>`;
  },

  /* ─── AIR SOLUBILITY CHART ─── */
  updateChart(currentT, currentSa) {
    if (typeof Chart === 'undefined') return;
    if (!document.getElementById('dafChart')) return;
    const ctx = document.getElementById('dafChart').getContext('2d');
    
    // Generate data points for T = 0 to 30
    const labels = [];
    const dataPoints = [];
    for (let t = 0; t <= 30; t += 2) {
      labels.push(t);
      const val = -0.0002 * Math.pow(t, 3) + 0.0175 * Math.pow(t, 2) - 0.795 * t + 29.2;
      dataPoints.push(val);
    }
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Air Solubility (mL/L)',
          data: dataPoints,
          borderColor: '#3a9bd4',
          backgroundColor: 'rgba(58, 155, 212, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Current T',
          data: labels.map(t => (Math.abs(t - currentT) < 1.1) ? currentSa : null),
          borderColor: '#e74c3c',
          backgroundColor: '#e74c3c',
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { title: { display: true, text: 'Temperature (°C)' } },
          y: { title: { display: true, text: 'Air Solubility (mL/L)' } }
        }
      }
    });
  },

  /* ─── SVG PROCESS DIAGRAM ─── */
  drawSVG(R, I) {
    const svgW = 1000, svgH = 480;
    const col = { flow: '#3a9bd4', recy: '#2980b9', air: '#ecf0f1', sludge: '#8b7355', tank: '#bdc3c7' };

    let s = `<defs>
      ${mkArr('ara', col.flow)}${mkArr('arr', col.recy)}${mkArr('ars', col.sludge)}
    </defs>`;
    s += `<rect width="${svgW}" height="${svgH}" fill="#f6f5f0"/>`;
    s += `<text x="14" y="24" font-size="11.5" font-weight="800" fill="#080808" font-family="Space Grotesk,Inter,sans-serif">DISSOLVED AIR FLOTATION (DAF) — PROCESS SCHEMATIC</text>`;
    s += `<text x="${svgW - 14}" y="24" text-anchor="end" font-size="9.5" fill="#888" font-family="Inter,sans-serif">Q = ${Math.round(I.Q)} m³/d  |  R = ${Math.round(I.R)} m³/d  |  A/S = ${f2(R.AS, 4)} mL/mg</text>`;
    s += `<line x1="14" y1="30" x2="${svgW - 14}" y2="30" stroke="#e9e6dc" stroke-width="1"/>`;

    const bY = 90, bH = 140, bX = 350, bW = 300;

    // ── DAF TANK ──
    s += `<rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="4" fill="#ecf0f1" stroke="${col.tank}" stroke-width="3"/>`;
    s += `<path d="M${bX} ${bY+40} Q ${bX+bW/2} ${bY+50} ${bX+bW} ${bY+40} L ${bX+bW} ${bY+bH} L ${bX} ${bY+bH} Z" fill="#ebf5fb" opacity="0.8"/>`;
    
    // Sludge blanket (top)
    s += `<rect x="${bX}" y="${bY}" width="${bW}" height="45" fill="${col.sludge}" opacity="0.6"/>`;
    s += `<text x="${bX + bW/2}" y="${bY - 10}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#34495e" font-family="Space Grotesk,Inter,sans-serif">DAF TANK</text>`;
    s += `<text x="${bX + bW/2}" y="${bY + 25}" text-anchor="middle" font-size="9.5" fill="#fff" font-weight="700" font-family="Inter,sans-serif">Float (Thickened Sludge)</text>`;
    s += `<text x="${bX + bW/2}" y="${bY + 90}" text-anchor="middle" font-size="10" fill="#2980b9" font-family="Inter,sans-serif">Area = ${f2(R.DAFArea, 1)} m²</text>`;
    
    // Bubbles
    for(let i=0; i<15; i++) {
        const bx = bX + 20 + Math.random() * (bW - 40);
        const by = bY + 60 + Math.random() * (bH - 70);
        const r = 2 + Math.random()*3;
        s += `<circle cx="${bx}" cy="${by}" r="${r}" fill="#fff" opacity="0.8"/>`;
    }

    // ── INFLUENT ──
    const infX = 50, infY = bY + 80;
    s += `<line x1="${infX}" y1="${infY}" x2="${bX}" y2="${infY}" stroke="${col.flow}" stroke-width="3" marker-end="url(#ara)"/>`;
    s += `<rect x="${infX}" y="${infY - 20}" width="70" height="40" rx="3" fill="#dbeafe" stroke="${col.flow}" stroke-width="1.5"/>`;
    s += `<text x="${infX + 35}" y="${infY - 4}" text-anchor="middle" font-size="9" font-weight="800" fill="#1565c0" font-family="Space Grotesk,Inter,sans-serif">INFLUENT</text>`;
    s += `<text x="${infX + 35}" y="${infY + 10}" text-anchor="middle" font-size="8.5" fill="#555" font-family="Inter,sans-serif">Q=${Math.round(I.Q)} m³/d</text>`;
    s += `<text x="${(infX + bX)/2}" y="${infY - 10}" text-anchor="middle" font-size="8.5" fill="#1565c0" font-family="Inter,sans-serif">${I.mode === 'All of the flow is pressurized' ? 'Pressurized' : 'Unpressurized'}</text>`;

    // ── EFFLUENT ──
    const effX = bX + bW, effY = bY + 110;
    s += `<line x1="${effX}" y1="${effY}" x2="${effX + 150}" y2="${effY}" stroke="${col.flow}" stroke-width="3" marker-end="url(#ara)"/>`;
    s += `<rect x="${effX + 150}" y="${effY - 20}" width="70" height="40" rx="3" fill="#e8f5e9" stroke="#27ae60" stroke-width="1.5"/>`;
    s += `<text x="${effX + 185}" y="${effY - 4}" text-anchor="middle" font-size="9" font-weight="800" fill="#27ae60" font-family="Space Grotesk,Inter,sans-serif">EFFLUENT</text>`;
    s += `<text x="${effX + 185}" y="${effY + 10}" text-anchor="middle" font-size="8.5" fill="#555" font-family="Inter,sans-serif">Subnatant</text>`;

    // ── SLUDGE WITHDRAWAL ──
    const sludX = bX + bW - 40, sludY = bY + 20;
    s += `<line x1="${sludX}" y1="${sludY}" x2="${effX + 150}" y2="${sludY}" stroke="${col.sludge}" stroke-width="4" marker-end="url(#ars)"/>`;
    s += `<rect x="${effX + 150}" y="${sludY - 20}" width="70" height="40" rx="3" fill="#f5edd8" stroke="${col.sludge}" stroke-width="1.5"/>`;
    s += `<text x="${effX + 185}" y="${sludY - 4}" text-anchor="middle" font-size="9" font-weight="800" fill="${col.sludge}" font-family="Space Grotesk,Inter,sans-serif">SKIMMER</text>`;
    s += `<text x="${effX + 185}" y="${sludY + 10}" text-anchor="middle" font-size="8.5" fill="#555" font-family="Inter,sans-serif">Waste Float</text>`;

    // ── RECYCLE SYSTEM ──
    const recyY = bY + bH + 60;
    s += `<line x1="${effX + 70}" y1="${effY}" x2="${effX + 70}" y2="${recyY}" stroke="${col.recy}" stroke-width="2"/>`;
    s += `<line x1="${effX + 70}" y1="${recyY}" x2="${bX - 80}" y2="${recyY}" stroke="${col.recy}" stroke-width="2" marker-end="url(#arr)"/>`;
    
    // Pressurization Tank
    const ptX = bX - 80, ptY = recyY - 20;
    s += `<rect x="${ptX - 60}" y="${ptY}" width="60" height="40" rx="3" fill="#ecf0f1" stroke="#7f8c8d" stroke-width="2"/>`;
    s += `<text x="${ptX - 30}" y="${ptY + 15}" text-anchor="middle" font-size="8" font-weight="700" fill="#333" font-family="Inter,sans-serif">PRESSURIZ.</text>`;
    s += `<text x="${ptX - 30}" y="${ptY + 25}" text-anchor="middle" font-size="8" font-weight="700" fill="#333" font-family="Inter,sans-serif">TANK</text>`;
    s += `<text x="${ptX - 30}" y="${ptY + 50}" text-anchor="middle" font-size="8" fill="#555" font-family="Inter,sans-serif">${f2(R.P,1)} atm</text>`;

    // Air compressor
    const compX = ptX - 30, compY = ptY + 70;
    s += `<rect x="${compX - 25}" y="${compY}" width="50" height="30" rx="2" fill="#fff" stroke="#95a5a6" stroke-width="1.5"/>`;
    s += `<text x="${compX}" y="${compY + 14}" text-anchor="middle" font-size="8" font-weight="700" fill="#7f8c8d" font-family="Inter,sans-serif">AIR</text>`;
    s += `<text x="${compX}" y="${compY + 24}" text-anchor="middle" font-size="8" fill="#555" font-family="Inter,sans-serif">${f2(R.AirReq_Nm3hr,1)} Nm³/h</text>`;
    s += `<line x1="${compX}" y1="${compY}" x2="${compX}" y2="${ptY+40}" stroke="#95a5a6" stroke-width="1.5" stroke-dasharray="3 2" marker-end="url(#arr)"/>`;

    // Recycle feed to DAF
    s += `<line x1="${ptX - 30}" y1="${ptY}" x2="${ptX - 30}" y2="${infY + 15}" stroke="${col.recy}" stroke-width="2"/>`;
    s += `<line x1="${ptX - 30}" y1="${infY + 15}" x2="${bX}" y2="${infY + 15}" stroke="${col.recy}" stroke-width="2" marker-end="url(#arr)"/>`;
    s += `<text x="${ptX - 70}" y="${(ptY + infY)/2}" text-anchor="end" font-size="8.5" fill="${col.recy}" font-family="Inter,sans-serif">R = ${Math.round(I.R)} m³/d</text>`;

    s += TB(svgW, svgH, 'Dissolved Air Flotation — Flow Diagram', `A/S = ${f2(R.AS, 4)} mL/mg · Air Req = ${f2(R.AirReq_Nm3hr, 1)} Nm³/hr · Loading = ${I.loading} ${I.basis==='Hydraulic Loading'?'L/m²/min':'kg/m²/hr'}`, 'NTS', '1 of 1');

    const svg = document.getElementById('daf-svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
      svg.innerHTML = s;
    }
  },

  init() {
    setTimeout(() => {
      this.calc();
      const mod = document.getElementById('daf-module');
      if (mod) {
        mod.addEventListener('input', () => this.calc());
        mod.addEventListener('change', () => this.calc());
      }
    }, 100);
  }
};

/* ══════════════════════════════════════════════════════════════════════════════
   HTML BUILDER — buildDAFDesign()
   ══════════════════════════════════════════════════════════════════════════════ */
function buildDAFDesign() {
  const _inp = (id, label, val, unit, step, hint) => `
    <div class="f mbr-in">
      <label>${label}</label>
      <div class="fuw"><input type="number" id="${id}" value="${val}" ${step ? `step="${step}"`:''}><div class="fu">${unit}</div></div>
      ${hint ? `<div class="h">${hint}</div>` : ''}
    </div>`;
    
  const _out = (id, label, unit, bold) => `
    <div class="mbr-res-cell${bold ? ' mbr-res-bold' : ''}">
      <div class="mbr-res-label">${label}</div>
      <div class="mbr-res-val"><span id="${id}">—</span> <span class="mbr-res-unit">${unit}</span></div>
    </div>`;
    
  const _kpi = (icon, title, id, unit, sub) => `
    <div class="mbr-kpi">
      <div class="mbr-kpi-icon">${icon}</div>
      <div class="mbr-kpi-body">
        <div class="mbr-kpi-title">${title}</div>
        <div class="mbr-kpi-val"><span id="${id}">—</span> <small>${unit}</small></div>
        <div class="mbr-kpi-sub">${sub}</div>
      </div>
    </div>`;

  return `<div class="mwrap" id="daf-module">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">Dissolved Air Flotation (DAF) Design<div class="mt-badge">SOLIDS SEPARATION</div></div>
    <div class="mt-bread">Based on S.I. Units Engineering Spreadsheet · Solves Air Solubility and A/S Ratios</div>
  </div></div>

  <!-- ═══ KPI CARDS ═══ -->
  <div class="mbr-kpi-row">
    ${_kpi('🏗️', 'Required DAF Area', 'daf_kpi_Area', 'm²', 'Calculated surface area')}
    ${_kpi('💨', 'Air/Solids (A/S)', 'daf_kpi_AS', 'mL/mg', 'Air to Solids ratio')}
    ${_kpi('⚙️', 'Air Required', 'daf_kpi_AirReq', 'Nm³/hr', 'Standard air requirement')}
    ${_kpi('⚖️', 'Solids Loading', 'daf_kpi_Sload', 'kg/m²/hr', 'Calculated solids loading')}
  </div>

  <!-- ═══ TAB BAR ═══ -->
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'daf-t1')">📋 Inputs &amp; Mode</div>
    <div class="tab" onclick="stab(this,'daf-t2')">💨 Air Calculations</div>
    <div class="tab" onclick="stab(this,'daf-t3')">🏗️ Tank Dimensions</div>
    <div class="tab" onclick="stab(this,'daf-tEq')">📐 Equations</div>
    <div class="tab" onclick="stab(this,'daf-tDrw')">🖼 Process Schematic</div>
    <div class="tab" onclick="stab(this,'daf-tRef')">📚 Ref. Tables</div>
    <div class="tab" onclick="stab(this,'daf-tChk')">✅ Design Checks</div>
  </div>

  <!-- ══════════ TAB 1: INPUTS ══════════ -->
  <div class="tp active" id="daf-t1">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">1. User Inputs — Wastewater</div></div><div class="card-body">
          <div class="g2">
            ${_inp('daf_Q',     'Influent Flow Rate, Q',       380,   'm³/d', 10, 'Raw feed flow')}
            ${_inp('daf_R',     'Recycle Flow Rate, R',        380,   'm³/d', 10, 'Recycled subnatant flow')}
            ${_inp('daf_T',     'Recycle Temperature, T',      20.0,  '°C',   0.5, 'Operating temperature')}
            ${_inp('daf_TSS',   'Influent TSS',                3000,  'mg/L', 10, 'Suspended solids')}
            ${_inp('daf_OG',    'Infl. Oil & Grease',          200.0, 'mg/L', 10, 'O&G concentration')}
            ${_inp('daf_Ch',    'Chemical Addition',           300.0, 'mg/L', 10, 'Coagulant/flocculant')}
          </div>
        </div></div>
      </div>
      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">2. Pressurization &amp; Loading Criteria</div></div><div class="card-body">
          <div class="g2">
            ${_inp('daf_Pg',    'Recycle Pressure, Pg',        276.0, 'kPa(g)', 1, 'Gauge pressure')}
            ${_inp('daf_Patm',  'Atmos. Pressure, Patm',       101.35,'kPa',  0.01, 'Local barometric')}
            ${_inp('daf_f',     'Efficiency Factor, f',        0.5,   '—',    0.05, 'Usually ~0.5')}
            <div class="f mbr-in"><label>Pressurization Mode</label><select id="daf_mode">
              <option value="Only recycle flow is pressurized" selected>Only recycle flow is pressurized</option>
              <option value="All of the flow is pressurized">All of the flow is pressurized</option>
            </select></div>
            <div class="f mbr-in"><label>Design Loading Basis</label><select id="daf_basis">
              <option value="Hydraulic Loading" selected>Hydraulic Loading</option>
              <option value="Solids Loading">Solids Loading</option>
            </select></div>
            ${_inp('daf_loading', '<span id="daf_loading_lbl">Design Hydr. Loading =</span>', 8.0, '<span id="daf_loading_unit">L/m²/min</span>', 0.1, 'See Ref. Tables tab')}
          </div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ══════════ TAB 2: AIR CALCULATIONS ══════════ -->
  <div class="tp" id="daf-t2">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Calculations — Air Properties &amp; Solubilities</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('daf_r_sa', 'Air Solubility, sa', 'mL/L', true)}
            ${_out('daf_r_P', 'Abs. Recycle Pressure, P', 'atm')}
            ${_out('daf_r_pctRecycle', '% Recycle (R/Q)', '%')}
            ${_out('daf_r_Sa', 'Influent Susp. Solids, Sa', 'mg/L')}
            ${_out('daf_r_AS', 'Air to Solids Ratio, A/S', 'mL/mg', true)}
            ${_out('daf_r_rair', 'Air Density at P & T, rair', 'kg/m³')}
          </div>
        </div></div>
        
        <div class="card"><div class="card-hd"><div class="card-hd-t">Air Requirement Sizing</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('daf_r_S_kghr', 'Solids Rate In, S', 'kg/hr')}
            ${_out('daf_r_S_gmin', 'Solids Rate In, S', 'g/min')}
            ${_out('daf_r_AirReq_m3hr', 'Air Required', 'm³/hr', true)}
            ${_out('daf_r_AirReq_kghr', 'Air Requirement', 'kg/hr')}
            ${_out('daf_r_AirReq_Nm3hr', 'Air Required', 'Nm³/hr', true)}
          </div>
        </div></div>
      </div>
      
      <div class="mbr-right">
        <div class="card" style="height:100%"><div class="card-hd"><div class="card-hd-t">📈 Air Solubility Equation (sa vs T)</div><div class="card-hd-s">sa = -0.0002T³ + 0.0175T² - 0.795T + 29.2</div></div>
        <div class="card-body" style="position:relative; min-height: 350px;">
          <canvas id="dafChart"></canvas>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ══════════ TAB 3: TANK DIMENSIONS ══════════ -->
  <div class="tp" id="daf-t3">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Required DAF Tank Area</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('daf_r_DAFArea', 'Required DAF Area', 'm²', true)}
          </div>
          <div class="alert al-i mt">NOTE: Hydraulic loading area calculation is based on the influent plus recycle flow rate. Solids loading calculation is based on influent mass only.</div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ══════════ TAB EQ: EQUATIONS ══════════ -->
  <div class="tp" id="daf-tEq">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Equations Used in DAF Sizing</div><div class="card-hd-s">Per M&amp;E Wastewater Engineering 4th Ed, Table 14-20</div></div><div class="card-body mbr-ref">
      <div class="eq-blk"><span class="eq-l">Air Solubility, sa</span><span class="eq-r">= -0.0002000·T³ + 0.01750·T² - 0.7950·T + 29.20 <small>mL/L</small></span></div>
      <div class="eq-blk"><span class="eq-l">Abs. Pressure, P</span><span class="eq-r">= (P<sub>gauge</sub> + P<sub>atm</sub>) / 101.35 <small>atm</small></span></div>
      <div class="eq-blk"><span class="eq-l">Influent Solids, Sa</span><span class="eq-r">= TSS + Oil&amp;Grease + Chemicals <small>mg/L</small></span></div>
      <div class="eq-blk">
        <div class="eq-t">Air to Solids Ratio (A/S):</div>
        <span class="eq-l">If recycle only: A/S</span><span class="eq-r">= 1.3·sa·(f·P - 1)·R / (Sa·Q) <small>mL/mg</small></span><br>
        <span class="eq-l">If all flow: A/S</span><span class="eq-r">= 1.3·sa·(f·P - 1) / Sa <small>mL/mg</small></span>
      </div>
      <div class="eq-blk"><span class="eq-l">Air Required</span><span class="eq-r">= (A/S) × [S (g/min) × 60] / 1000 <small>m³/hr</small></span></div>
      <div class="eq-blk"><span class="eq-l">Air Density, r<sub>air</sub></span><span class="eq-r">= 28.97(P<sub>g</sub> + P<sub>atm</sub>) / [8.3145(T + 273.15)] <small>kg/m³</small></span></div>
      <div class="eq-blk"><span class="eq-l">Air Req. (kg/hr)</span><span class="eq-r">= (m³/hr) × r<sub>air</sub> × 60</span></div>
      <div class="eq-blk"><span class="eq-l">Air Req. (Nm³/hr)</span><span class="eq-r">= (m³/hr) × [P(atm)·1.01325/1] × [(20+273.15)/(T+273.15)]</span></div>
      <div class="eq-blk">
        <div class="eq-t">DAF Surface Area:</div>
        <span class="eq-l">Hydraulic Basis</span><span class="eq-r">= [(Q + R)·1000 / (24·60)] / L<sub>H</sub></span><br>
        <span class="eq-l">Solids Basis</span><span class="eq-r">= S(kg/hr) / L<sub>S</sub></span>
      </div>
    </div></div>
  </div>

  <!-- ══════════ TAB DRW: PROCESS SCHEMATIC ══════════ -->
  <div class="tp" id="daf-tDrw">
    <div class="dwg-toolbar">
      <span>DISSOLVED AIR FLOTATION — PROCESS DIAGRAM</span>
      <button class="btn btn-xs btn-dk" onclick="dlSVG('daf-svg','daf-process')">⬇ Export SVG</button>
    </div>
    <div class="dwg-wrap">
      <svg id="daf-svg" viewBox="0 0 1000 480" xmlns="http://www.w3.org/2000/svg"></svg>
    </div>
  </div>

  <!-- ══════════ TAB REF: REFERENCE TABLES ══════════ -->
  <div class="tp" id="daf-tRef">
    <div class="card"><div class="card-hd"><div class="card-hd-t">Typical Solids Loadings for Dissolved Air Flotation Units</div><div class="card-hd-s">Reference Data from Workbook</div></div><div class="card-body">
      <table class="rtable">
        <thead>
          <tr>
            <th rowspan="2">Application</th>
            <th colspan="2">Loading, kg/m²/hr</th>
            <th colspan="2">Loading, lb/ft²/hr</th>
          </tr>
          <tr>
            <th>without chemicals</th>
            <th>with chemicals</th>
            <th>without chemicals</th>
            <th>with chemicals</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Air Activated Sludge Mixed Liquor</td><td>1.2 - 3.0</td><td>Up to 10</td><td>0.24 - 0.61</td><td>Up to 2</td></tr>
          <tr><td>Air Activated Sludge - Settled</td><td>2.4 - 4.0</td><td>Up to 10</td><td>0.49 - 0.82</td><td>Up to 2</td></tr>
          <tr><td>High Purity Oxygen-Activated Sludge</td><td>3.0 - 4.0</td><td>Up to 10</td><td>0.61 - 0.82</td><td>Up to 2</td></tr>
          <tr><td>Trickling Filter Humus Sludge</td><td>3.0 - 4.0</td><td>Up to 10</td><td>0.61 - 0.82</td><td>Up to 2</td></tr>
          <tr><td>Primary + Air Activated Sludge</td><td>3.0 - 6.0</td><td>Up to 10</td><td>0.61 - 1.2</td><td>Up to 2</td></tr>
          <tr><td>Primary + Trickling Filter Humus Sludge</td><td>4.0 - 6.0</td><td>Up to 10</td><td>0.82 - 1.2</td><td>Up to 2</td></tr>
          <tr><td>Primary Sludge only</td><td>4.0 - 6.0</td><td>Up to 12.5</td><td>0.82 - 1.2</td><td>Up to 2.6</td></tr>
        </tbody>
      </table>
    </div></div>
  </div>

  <!-- ══════════ TAB CHK: DESIGN CHECKS ══════════ -->
  <div class="tp" id="daf-tChk">
    <div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body"><div id="daf_r_checks"></div></div></div>
  </div>

</div>`;
}
