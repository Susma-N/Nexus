/* ══════ CALCULATION: AERATION TANK BLOWER DESIGN ══════ */
/* Exact replication of Aeration Tank-Blower Design workbook */
/* Refactored to match MBR Design module UI aesthetic */

const ABEngine = {
  read() {
    const v = id => { const e = document.getElementById(id); return e ? parseFloat(e.value) || 0 : 0; };
    let vol = v('ab_Vol');
    if (vol > 1) vol = vol / 100; // If user enters 80 instead of 0.8
    return {
      Qo: v('ab_Qo'), So: v('ab_So'), X: v('ab_X'), Vol: vol, Xo: v('ab_Xo'), Xw: v('ab_Xw'), Xe: v('ab_Xe'),
      sz_A_VL: v('ab_sz_A_VL'), sz_B_HRT: v('ab_sz_B_HRT'), sz_C_FM: v('ab_sz_C_FM'),
      op_V: v('ab_op_V'), op_SRT: v('ab_op_SRT'),
      TKNo: v('ab_ox_TKNo'), Ne: v('ab_ox_Ne'), Se: v('ab_ox_Se'),
      O2_BOD: v('ab_ox_O2_BOD'), O2_NH3: v('ab_ox_O2_NH3'), SOTE_depth: v('ab_ox_SOTE_depth'),
      AOTE_SOTE: v('ab_ox_AOTE_SOTE'), DPdiff: v('ab_ox_DPdiff'), ddiff: v('ab_ox_ddiff'),
      T_norm: v('ab_ox_T_norm'), P_norm: v('ab_ox_P_norm'), P_atm: v('ab_ox_P_atm'),
      rho_air: v('ab_ox_rho_air'), O2_air: v('ab_ox_O2_air'),
      B_SOTE: v('ab_ox_B_SOTE'), B_f: v('ab_ox_B_f'), B_Tww: v('ab_ox_B_Tww'), B_CL: v('ab_ox_B_CL'),
      B_h: v('ab_ox_B_h'), B_a: v('ab_ox_B_a'), B_RHa: v('ab_ox_B_RHa'), B_B: v('ab_ox_B_B'),
      B_Ta: v('ab_ox_B_Ta'), B_F: v('ab_ox_B_F'), B_DPin: v('ab_ox_B_DPin'), B_Y: v('ab_ox_B_Y'),
      B_Fp: v('ab_ox_B_Fp'), B_kd20: v('ab_ox_B_kd20'), B_SRT: v('ab_ox_B_SRT'), B_RHs: v('ab_ox_B_RHs'), B_Cs: v('ab_ox_B_Cs')
    };
  },
  
  runSizing() {
    try {
      const I = this.read();
      
      // Tank Sizing A
      const sz_A_V = I.sz_A_VL > 0 ? (I.So * I.Qo / 1000) / I.sz_A_VL : 0;
      const sz_A_HRT = I.Qo > 0 ? 24 * sz_A_V / I.Qo : 0;
      const sz_A_FM = (I.Vol * I.X * sz_A_V) > 0 ? (I.So * I.Qo) / (I.Vol * I.X * sz_A_V) : 0;
      
      // Tank Sizing B
      const sz_B_V = I.Qo * I.sz_B_HRT / 24;
      const sz_B_VL = sz_B_V > 0 ? (I.So * I.Qo) / (1000 * sz_B_V) : 0;
      const sz_B_FM = (I.Vol * I.X * sz_B_V) > 0 ? (I.So * I.Qo) / (I.Vol * I.X * sz_B_V) : 0;
      
      // Tank Sizing C
      const sz_C_V = (I.Vol * I.X * I.sz_C_FM) > 0 ? (I.So * I.Qo) / (I.Vol * I.X * I.sz_C_FM) : 0;
      const sz_C_HRT = I.Qo > 0 ? 24 * sz_C_V / I.Qo : 0;
      const sz_C_VL = sz_C_V > 0 ? (I.So * I.Qo) / (1000 * sz_C_V) : 0;
      
      // Operations
      const op_FM = (I.Vol * I.op_V * I.X) > 0 ? (I.Qo * I.So) / (I.Vol * I.op_V * I.X) : 0;
      const op_Qw = I.Xw > 0 ? (1 / I.Xw) * ((I.op_V * I.X / I.op_SRT) - (I.Qo * I.Xe)) : 0;
      const op_Qr = (I.Xw - I.X) !== 0 ? I.Qo * (I.X - I.Xo) / (I.Xw - I.X) : 0;
      
      // Oxygen A
      const ox_A_BOD_load = (I.Qo * (I.So - I.Se) / 1000) / 24;
      const ox_A_O2_req = I.O2_BOD * ox_A_BOD_load;
      const ox_A_SOTE = I.SOTE_depth * I.ddiff;
      const ox_A_AOTE = ox_A_SOTE * I.AOTE_SOTE;
      const ox_A_Air_req = ox_A_AOTE > 0 ? (ox_A_O2_req / ox_A_AOTE) / I.O2_air : 0;
      const ox_A_P_out = I.P_atm + I.DPdiff + (1000 * 9.81 * I.ddiff / 100000);
      
      const ox_A_NH3_load = (I.Qo * (I.TKNo - I.Ne) / 1000) / 24;
      const ox_A_N_O2_req = (ox_A_NH3_load * I.O2_NH3) + ox_A_O2_req;
      const ox_A_N_Air_req = ox_A_AOTE > 0 ? (ox_A_N_O2_req / ox_A_AOTE) / I.O2_air : 0;
      
      // Oxygen B
      const ox_B_kdT = I.B_kd20 * Math.pow(1.024, (I.B_Tww - 20));
      const ox_B_Yobs = I.B_Y / (1 + ox_B_kdT * I.B_SRT);
      const ox_B_PD = I.P_atm + (9.81 * (I.ddiff / 2) / 100);
      const ox_B_AOTE = I.B_SOTE * I.B_a * I.B_F * (((I.B_B * (ox_B_PD / I.P_norm) * I.B_Cs) - I.B_CL) / 9.17) * Math.pow(1.024, (I.B_Tww - 20));
      const PVa_exp = 8.07131 - (1730.63 / (233.426 + I.B_Ta));
      const ox_B_PVa = (1.014 / 760) * Math.pow(10, PVa_exp);
      const PVN_exp = 8.07131 - (1730.63 / (233.426 + I.T_norm));
      const ox_B_PVN = (1.014 / 760) * Math.pow(10, PVN_exp);
      const ox_B_rair = 28.97 * I.P_atm * 100 / (8.3145 * (I.B_Tww + 273.15));
      
      const ox_B_O2_req = (1 / 24) * (I.Qo / 1000) * (I.So - I.Se) * ((1 / I.B_f) - (1.42 * ox_B_Yobs));
      const ox_B_Air_req = ox_B_AOTE > 0 ? (ox_B_O2_req / ox_B_AOTE) * 28.97 / (0.209 * 32 * ox_B_rair) : 0;
      const ox_B_Act_Air_req = ox_B_Air_req * I.B_Fp;
      const ox_B_Norm_Air_req = ox_B_Act_Air_req * ((I.P_atm - I.B_DPin) / I.P_atm) * ((I.T_norm + 273.15) / (I.B_Ta + 273.15)) * ((I.P_atm - (I.B_RHa * ox_B_PVa)) / (I.P_norm - (I.B_RHs * ox_B_PVN)));
      const ox_B_PB2 = I.P_atm + I.DPdiff + (9.807 * I.ddiff / 100);
      
      const ox_B_N_O2_req = ox_B_O2_req + ((I.Qo / 1000) * 4.57 * (I.TKNo - I.Ne) / 24);
      const ox_B_N_Air_req = ox_B_AOTE > 0 ? (ox_B_N_O2_req / ox_B_AOTE) * 28.97 / (0.209 * 32 * ox_B_rair) : 0;
      const ox_B_N_Act_Air_req = ox_B_N_Air_req * I.B_Fp;
      const ox_B_N_Norm_Air_req = ox_B_N_Act_Air_req * ((I.P_atm - I.B_DPin) / I.P_atm) * ((I.T_norm + 273.15) / (I.B_Ta + 273.15)) * ((I.P_atm - (I.B_RHa * ox_B_PVa)) / (I.P_norm - (I.B_RHs * ox_B_PVN)));
      
      this.render({
        sz_A_V, sz_A_HRT, sz_A_FM, sz_B_V, sz_B_VL, sz_B_FM, sz_C_V, sz_C_HRT, sz_C_VL,
        op_FM, op_Qw, op_Qr,
        ox_A_SOTE, ox_A_AOTE, ox_A_P_out, ox_A_BOD_load, ox_A_O2_req, ox_A_Air_req, ox_A_NH3_load, ox_A_N_O2_req, ox_A_N_Air_req,
        ox_B_kdT, ox_B_Yobs, ox_B_PD, ox_B_AOTE, ox_B_PVa, ox_B_PVN, ox_B_rair, ox_B_PB2,
        ox_B_O2_req, ox_B_Air_req, ox_B_Act_Air_req, ox_B_Norm_Air_req,
        ox_B_N_O2_req, ox_B_N_Air_req, ox_B_N_Act_Air_req, ox_B_N_Norm_Air_req
      });
    } catch(err) { console.error("ABEngine Error", err); }
  },
  
  render(R) {
    const sv = (id, val) => {
      const e = document.getElementById(id);
      if(e && e.textContent !== String(val)) {
        const isKpi = e.closest('.mbr-kpi-val');
        const cleanVal = String(val).replace(/,/g, '').replace(/%/g, '');
        const numVal = parseFloat(cleanVal);
        if (isKpi && !isNaN(numVal) && window.animateValue && e.textContent !== '—') {
          const cur = parseFloat(e.textContent.replace(/,/g, '').replace(/%/g, '')) || 0;
          const decimals = String(cleanVal).includes('.') ? String(cleanVal).split('.')[1].length : 0;
          if(String(val).includes('%')) e.setAttribute('data-suffix', '%');
          else e.removeAttribute('data-suffix');
          window.animateValue(e, cur, numVal, 800, decimals);
        } else {
          e.textContent = val;
        }
        const cell = e.closest('.mbr-res-cell') || e.closest('.mbr-kpi');
        if (cell) {
          cell.classList.remove('mbr-flash');
          void cell.offsetWidth;
          cell.classList.add('mbr-flash');
        }
      }
    };
    const n = (v, d) => (typeof v === 'number' && isFinite(v)) ? (d !== undefined ? v.toFixed(d) : fi(Math.round(v))) : '—';
    
    // KPIs
    sv('kpi_V', n(R.sz_A_V)); sv('kpi_HRT', n(R.sz_A_HRT, 1)); sv('kpi_FM', n(R.sz_A_FM, 2));
    sv('kpi_Qw', n(R.op_Qw, 1)); sv('kpi_Qr', n(R.op_Qr, 1)); sv('kpi_Air', n(R.ox_B_N_Norm_Air_req, 1));
    sv('kpi_O2', n(R.ox_B_N_O2_req, 1)); sv('kpi_AOTE', n(R.ox_B_AOTE * 100, 1) + '%');
    
    // Tank Sizing
    sv('r_A_V', n(R.sz_A_V, 1)); sv('r_A_HRT', n(R.sz_A_HRT, 1)); sv('r_A_FM', n(R.sz_A_FM, 2));
    sv('r_B_V', n(R.sz_B_V, 1)); sv('r_B_VL', n(R.sz_B_VL, 4)); sv('r_B_FM', n(R.sz_B_FM, 2));
    sv('r_C_V', n(R.sz_C_V, 1)); sv('r_C_HRT', n(R.sz_C_HRT, 1)); sv('r_C_VL', n(R.sz_C_VL, 4));
    
    // Operations
    sv('r_op_FM', n(R.op_FM, 3)); sv('r_op_Qw', n(R.op_Qw, 1)); sv('r_op_Qr', n(R.op_Qr, 1));
    
    // Oxy A
    sv('r_oxA_SOTE', n(R.ox_A_SOTE * 100, 2) + '%'); sv('r_oxA_AOTE', n(R.ox_A_AOTE * 100, 2) + '%'); sv('r_oxA_Pout', n(R.ox_A_P_out, 3));
    sv('r_oxA_Bload', n(R.ox_A_BOD_load, 1)); sv('r_oxA_Breq', n(R.ox_A_O2_req, 1)); sv('r_oxA_Bair', n(R.ox_A_Air_req, 1));
    sv('r_oxA_Nload', n(R.ox_A_NH3_load, 2)); sv('r_oxA_Nreq', n(R.ox_A_N_O2_req, 1)); sv('r_oxA_Nair', n(R.ox_A_N_Air_req, 1));
    
    // Oxy B
    sv('r_oxB_kdT', n(R.ox_B_kdT, 4)); sv('r_oxB_Yobs', n(R.ox_B_Yobs, 4)); sv('r_oxB_PD', n(R.ox_B_PD, 4)); sv('r_oxB_AOTE', n(R.ox_B_AOTE * 100, 2) + '%');
    sv('r_oxB_PVa', n(R.ox_B_PVa, 5)); sv('r_oxB_PVN', n(R.ox_B_PVN, 5)); sv('r_oxB_rair', n(R.ox_B_rair, 4)); sv('r_oxB_PB2', n(R.ox_B_PB2, 3));
    
    sv('r_oxB_Breq', n(R.ox_B_O2_req, 1)); sv('r_oxB_Bair', n(R.ox_B_Air_req, 1)); sv('r_oxB_Bact', n(R.ox_B_Act_Air_req, 1)); sv('r_oxB_Bnorm', n(R.ox_B_Norm_Air_req, 1));
    sv('r_oxB_Nreq', n(R.ox_B_N_O2_req, 1)); sv('r_oxB_Nair', n(R.ox_B_N_Air_req, 1)); sv('r_oxB_Nact', n(R.ox_B_N_Act_Air_req, 1)); sv('r_oxB_Nnorm', n(R.ox_B_N_Norm_Air_req, 1));
  },
  
  init() {
    setTimeout(() => {
      this.runSizing();
      const mod = document.getElementById('ab-module');
      if (mod) {
        mod.addEventListener('input', () => this.runSizing());
        mod.addEventListener('change', () => this.runSizing());
      }
    }, 100);
  }
};

function _ab_kpi(icon, label, id, unit, sub) {
  return `<div class="mbr-kpi"><div class="mbr-kpi-icon">${icon}</div><div class="mbr-kpi-val" id="${id}">—</div><div class="mbr-kpi-unit">${unit}</div><div class="mbr-kpi-label">${label}</div>${sub ? `<div class="mbr-kpi-sub">${sub}</div>` : ''}</div>`;
}

function _ab_inp(id, label, val, unit, step) {
  return `<div class="f mbr-in"><label>${label}</label><div class="fuw"><input type="number" id="${id}" value="${val}"${step ? ' step="' + step + '"' : ''}>${unit ? '<div class="fu">' + unit + '</div>' : ''}</div></div>`;
}

function _ab_out(id, label, unit, highlight) {
  return `<div class="mbr-res-cell${highlight ? ' mbr-res-hl' : ''}"><div class="mbr-res-label">${label}</div><div class="mbr-res-val"><span id="${id}">—</span>${unit ? ' <small>' + unit + '</small>' : ''}</div></div>`;
}

function buildAerationBlower() {
  const diagSvg = `
  <div class="alert al-i" style="margin-bottom:10px;">Activated Sludge Flow Diagram</div>
  <svg viewBox="0 0 600 300" style="width:100%; max-width:450px; height:auto; display:block; margin: 0 auto; background:rgba(255,255,255,0.5); border:1px solid rgba(0,0,0,0.05); border-radius:8px; padding:15px;">
    <defs>
      <marker id="arr1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
      </marker>
    </defs>
    <line x1="10" y1="70" x2="110" y2="70" stroke="#0284c7" stroke-width="2" marker-end="url(#arr1)"/>
    <text x="60" y="55" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">Q<tspan dy="5" font-size="10">o</tspan></text>
    <text x="60" y="90" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">S<tspan dy="5" font-size="10">o</tspan>, X<tspan dy="5" font-size="10">o</tspan></text>
    <rect x="120" y="40" width="180" height="60" fill="rgba(2,132,199,0.05)" stroke="#0284c7" stroke-width="2" rx="4"/>
    <text x="210" y="65" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">Aeration Tank</text>
    <text x="210" y="85" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">V, X</text>
    <line x1="300" y1="70" x2="340" y2="70" stroke="#0284c7" stroke-width="2" marker-end="url(#arr1)"/>
    <rect x="350" y="40" width="120" height="60" fill="rgba(2,132,199,0.05)" stroke="#0284c7" stroke-width="2" rx="4"/>
    <polygon points="350,100 470,100 410,160" fill="rgba(2,132,199,0.05)" stroke="#0284c7" stroke-width="2"/>
    <text x="410" y="65" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">Secondary</text>
    <text x="410" y="85" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">Clarifier</text>
    <line x1="470" y1="70" x2="570" y2="70" stroke="#0284c7" stroke-width="2" marker-end="url(#arr1)"/>
    <text x="520" y="55" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">Q<tspan dy="5" font-size="10">e</tspan></text>
    <text x="520" y="90" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">S<tspan dy="5" font-size="10">e</tspan>, X<tspan dy="5" font-size="10">e</tspan></text>
    <line x1="410" y1="160" x2="410" y2="220" stroke="#0284c7" stroke-width="2"/>
    <line x1="410" y1="220" x2="410" y2="280" stroke="#0284c7" stroke-width="2" marker-end="url(#arr1)"/>
    <text x="420" y="240" fill="var(--ink)" font-size="14" text-anchor="start" font-weight="600">Q<tspan dy="5" font-size="10">w</tspan>, S<tspan dy="5" font-size="10">w</tspan>, X<tspan dy="5" font-size="10">w</tspan></text>
    <text x="420" y="260" fill="var(--ink)" font-size="12" text-anchor="start">waste act. sludge</text>
    <line x1="410" y1="220" x2="80" y2="220" stroke="#0284c7" stroke-width="2"/>
    <line x1="80" y1="220" x2="80" y2="80" stroke="#0284c7" stroke-width="2" marker-end="url(#arr1)"/>
    <text x="245" y="210" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">Q<tspan dy="5" font-size="10">r</tspan></text>
    <text x="245" y="240" fill="var(--ink)" font-size="14" text-anchor="middle" font-weight="600">S<tspan dy="5" font-size="10">w</tspan>, X<tspan dy="5" font-size="10">w</tspan></text>
    <text x="140" y="210" fill="var(--ink)" font-size="12" text-anchor="middle">recycle</text>
    <text x="140" y="235" fill="var(--ink)" font-size="12" text-anchor="middle">act. sludge</text>
  </svg>`;
  
  const tblSvg = `
  <div class="alert al-i" style="margin-bottom:10px; margin-top:20px;">Typical Design Parameters</div>
  <div style="background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.05); border-radius:8px; padding:10px;">
    <table style="width:100%; border-collapse:collapse; color:var(--ink); font-size:13px;">
      <thead>
        <tr style="border-bottom:1px solid rgba(0,0,0,0.1);"><th style="text-align:left; padding:8px;">Process / Parameter</th><th style="padding:8px;">Unit</th><th style="padding:8px;">Conventional</th><th style="padding:8px;">Extended Aeration</th></tr>
      </thead>
      <tbody>
        <tr style="background:rgba(0,0,0,0.02);"><td style="padding:8px; font-weight:500;">SRT</td><td style="padding:8px; text-align:center;">days</td><td style="padding:8px; text-align:center;">5-15</td><td style="padding:8px; text-align:center;">20-30</td></tr>
        <tr><td style="padding:8px; font-weight:500;">F/M</td><td style="padding:8px; text-align:center;">kg BOD/kg MLVSS/d</td><td style="padding:8px; text-align:center;">0.2-0.4</td><td style="padding:8px; text-align:center;">0.05-0.15</td></tr>
        <tr style="background:rgba(0,0,0,0.02);"><td style="padding:8px; font-weight:500;">Volumetric Loading</td><td style="padding:8px; text-align:center;">kg BOD/m³/d</td><td style="padding:8px; text-align:center;">0.3-0.6</td><td style="padding:8px; text-align:center;">0.16-0.24</td></tr>
        <tr><td style="padding:8px; font-weight:500;">HRT</td><td style="padding:8px; text-align:center;">hours</td><td style="padding:8px; text-align:center;">4-8</td><td style="padding:8px; text-align:center;">18-36</td></tr>
        <tr style="background:rgba(0,0,0,0.02);"><td style="padding:8px; font-weight:500;">MLSS</td><td style="padding:8px; text-align:center;">mg/L</td><td style="padding:8px; text-align:center;">1500-3000</td><td style="padding:8px; text-align:center;">2000-5000</td></tr>
      </tbody>
    </table>
  </div>`;

  return `
<div class="mwrap" id="ab-module" oninput="if(typeof ABEngine !== 'undefined') ABEngine.runSizing();" onchange="if(typeof ABEngine !== 'undefined') ABEngine.runSizing();">
  <div class="mhdr"><div class="mh-left"><div class="mt-title">Aeration Tank Blower Design<div class="mt-badge" style="background:#0284c7;">AB</div></div>
  <div class="mt-bread">Secondary Biological Treatment Design Calculations — Aeration Tank and Blower Estimation</div></div></div>

  <!-- KPI HIGHLIGHT CARDS -->
  <div class="mbr-kpi-row">
    ${_ab_kpi('🏗️', 'Tank Volume (Opt A)', 'kpi_V', 'm³', 'Volumetric Loading basis')}
    ${_ab_kpi('⏱️', 'HRT (Opt A)', 'kpi_HRT', 'hr', 'Detention Time')}
    ${_ab_kpi('⚖️', 'F:M (Opt A)', 'kpi_FM', 'kg/kg/d', 'Food to Mass')}
    ${_ab_kpi('📉', 'Waste Sludge Qw', 'kpi_Qw', 'm³/d', 'From Operations')}
    ${_ab_kpi('🔄', 'Recycle Sludge Qr', 'kpi_Qr', 'm³/d', 'From Operations')}
    ${_ab_kpi('🌬️', 'Normal Air Req.', 'kpi_Air', 'Nm³/h', 'Detailed (BOD+N)')}
    ${_ab_kpi('🧪', 'O₂ Required', 'kpi_O2', 'kg/h', 'Detailed (BOD+N)')}
    ${_ab_kpi('✨', 'AOTE', 'kpi_AOTE', '%', 'Oxygen Transfer Effic.')}
  </div>

  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'ab-t1')">1. General WW Info Input</div>
    <div class="tab" onclick="stab(this,'ab-t2')">2. Tank Sizing Calcns</div>
    <div class="tab" onclick="stab(this,'ab-t3')">3. Operations Calcns</div>
    <div class="tab" onclick="stab(this,'ab-t4')">4. Oxygen/Blower Calcns</div>
  </div>

  <!-- TAB 1: GENERAL WW INFO -->
  <div class="tp active" id="ab-t1">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">General Parameter Values</div><div class="card-hd-s">Enter values in yellow cells</div></div><div class="card-body">
          <div class="g3">
            ${_ab_inp('ab_Qo', 'Design flow rate, Qo', 5000, 'm³/d')}
            ${_ab_inp('ab_So', 'Inf. substrate, So', 250, 'g/m³')}
            ${_ab_inp('ab_X', 'Aeration tank MLSS, X', 3000, 'g/m³', 100)}
            ${_ab_inp('ab_Vol', '% Volatile of MLSS', 0.8, '', 0.05)}
            ${_ab_inp('ab_Xo', 'Inf. solids conc., Xo', 0, 'g/m³', 1)}
            ${_ab_inp('ab_Xw', 'Waste sludge conc., Xw', 10000, 'g/m³', 100)}
            ${_ab_inp('ab_Xe', 'Effluent TSS conc., Xe', 10, 'g/m³', 1)}
          </div>
        </div></div>
      </div>
      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Reference Diagram</div></div><div class="card-body">
          ${diagSvg}
        </div></div>
      </div>
    </div>
  </div>

  <!-- TAB 2: TANK SIZING -->
  <div class="tp" id="ab-t2">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Tank Sizing Inputs</div></div><div class="card-body">
          <div class="g2">
            ${_ab_inp('ab_sz_A_VL', 'A. Design Vol. Loading, VL', 0.5606, 'kg BOD/d/m³', 0.01)}
            ${_ab_inp('ab_sz_B_HRT', 'B. Design Aer. Tank HRT', 7.0, 'hr', 0.1)}
            ${_ab_inp('ab_sz_C_FM', 'C. Aeration Tank F:M', 0.35, 'kg/kg', 0.01)}
          </div>
        </div></div>
        <div class="card mt"><div class="card-hd"><div class="card-hd-t">Typical Design Guidelines</div></div><div class="card-body">
          ${tblSvg}
        </div></div>
      </div>
      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Option A: Based on Volumetric Loading</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_ab_out('r_A_V', 'Aeration Tank Volume, V', 'm³', true)}
            ${_ab_out('r_A_HRT', 'Aeration Tank HRT', 'hr')}
            ${_ab_out('r_A_FM', 'Aeration Tank F:M', 'kg BOD/d/kg MLVSS')}
          </div>
        </div></div>
        
        <div class="card mt"><div class="card-hd"><div class="card-hd-t">Option B: Based on Hydraulic Loading</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_ab_out('r_B_V', 'Aeration Tank Volume, V', 'm³', true)}
            ${_ab_out('r_B_VL', 'Volumetric Loading, VL', 'kg BOD/d/m³')}
            ${_ab_out('r_B_FM', 'Aeration Tank F:M', 'kg BOD/d/kg MLVSS')}
          </div>
        </div></div>
        
        <div class="card mt"><div class="card-hd"><div class="card-hd-t">Option C: Based on F:M Ratio</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_ab_out('r_C_V', 'Aeration Tank Volume, V', 'm³', true)}
            ${_ab_out('r_C_HRT', 'Aeration Tank HRT', 'hr')}
            ${_ab_out('r_C_VL', 'Volumetric Loading, VL', 'kg BOD/d/m³')}
          </div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- TAB 3: OPERATIONS -->
  <div class="tp" id="ab-t3">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Operations Inputs</div></div><div class="card-body">
          <div class="g2">
            ${_ab_inp('ab_op_V', 'Aer. tank volume, V', 2230, 'm³', 10)}
            ${_ab_inp('ab_op_SRT', 'Sludge age (SRT)', 5, 'days', 0.5)}
          </div>
        </div></div>
      </div>
      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Operations Results</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_ab_out('r_op_FM', 'Aeration Tank F:M ratio', 'kg/kg')}
            ${_ab_out('r_op_Qw', 'Waste Sludge Rate, Qw', 'm³/day', true)}
            ${_ab_out('r_op_Qr', 'Recycle Sludge Rate, Qr', 'm³/day', true)}
          </div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- TAB 4: OXYGEN/BLOWER -->
  <div class="tp" id="ab-t4">
    <div class="card"><div class="card-hd"><div class="card-hd-t">Additional User Inputs</div></div><div class="card-body">
      <div class="g3">
        ${_ab_inp('ab_ox_TKNo', 'Influent TKN, TKNo', 35.0, 'g/m³')}
        ${_ab_inp('ab_ox_Ne', 'Target Effl NH₄-N conc', 0.5, 'g/m³', 0.1)}
        ${_ab_inp('ab_ox_Se', 'Target Effluent BOD, Se', 20.0, 'g/m³')}
      </div>
    </div></div>
    
    <div class="card mt"><div class="card-hd"><div class="card-hd-t">A. Simplified "Rules of Thumb"</div></div><div class="card-body">
      <div class="g3">
        ${_ab_inp('ab_ox_O2_BOD', 'O₂ needed per kg BOD', 1.2, '', 0.1)}
        ${_ab_inp('ab_ox_O2_NH3', 'O₂ needed per kg NH₃-N', 4.57, '', 0.01)}
        ${_ab_inp('ab_ox_SOTE_depth', 'SOTE as Func of Depth', 0.0656, '', 0.001)}
        ${_ab_inp('ab_ox_AOTE_SOTE', 'AOTE/SOTE ratio', 0.33, '', 0.01)}
        ${_ab_inp('ab_ox_DPdiff', 'Press. Drop Diffuser', 0.03, 'bar', 0.01)}
        ${_ab_inp('ab_ox_ddiff', 'Depth of Diffusers', 3.66, 'm', 0.01)}
        ${_ab_inp('ab_ox_T_norm', 'Normal Temperature', 0.0, '°C', 1)}
        ${_ab_inp('ab_ox_P_norm', 'Normal Pressure', 1.0, 'bar', 0.1)}
        ${_ab_inp('ab_ox_P_atm', 'Atmospheric Pressure', 1.014, 'bar', 0.001)}
        ${_ab_inp('ab_ox_rho_air', 'Air Density at STP', 1.275, 'kg/m³', 0.001)}
        ${_ab_inp('ab_ox_O2_air', 'O₂ Content in Air', 0.293, 'kg/m³', 0.001)}
      </div>
    </div></div>

    <div class="card mt"><div class="card-hd"><div class="card-hd-t">A. Simplified Estimates Results</div></div><div class="card-body">
      <div class="mbr-res-grid">
        ${_ab_out('r_oxA_SOTE', 'Calc. SOTE', '')}
        ${_ab_out('r_oxA_AOTE', 'Calc. AOTE', '')}
        ${_ab_out('r_oxA_Pout', 'Blower Outlet Press.', 'bar')}
      </div>
      <div class="fg mt"><div class="fg-t">For BOD Removal Only</div><div class="mbr-res-grid">
        ${_ab_out('r_oxA_Bload', 'BOD Load', 'kg/h')}
        ${_ab_out('r_oxA_Breq', 'O₂ Req\'d', 'kg/h')}
        ${_ab_out('r_oxA_Bair', 'Std Air Req\'d', 'm³/h', true)}
      </div></div>
      <div class="fg mt"><div class="fg-t">For BOD + Nitrification</div><div class="mbr-res-grid">
        ${_ab_out('r_oxA_Nload', 'NH₃ Load', 'kg/h')}
        ${_ab_out('r_oxA_Nreq', 'O₂ Req\'d', 'kg/h')}
        ${_ab_out('r_oxA_Nair', 'Std Air Req\'d', 'm³/h', true)}
      </div></div>
    </div></div>

    <div class="card mt"><div class="card-hd"><div class="card-hd-t">B. More Detailed Estimates</div></div><div class="card-body">
      <div class="g3">
        ${_ab_inp('ab_ox_B_SOTE', 'Std O₂ Transf. Eff.', 0.2, '', 0.01)}
        ${_ab_inp('ab_ox_B_f', 'Ratio of BOD5/BODu, f', 0.67, '', 0.01)}
        ${_ab_inp('ab_ox_B_Tww', 'Design ww Temp.', 10.0, '°C', 1)}
        ${_ab_inp('ab_ox_B_CL', 'D.O. conc maintained', 2.0, 'g/m³', 0.1)}
        ${_ab_inp('ab_ox_B_h', 'Blower efficiency, h', 0.7, '', 0.1)}
        ${_ab_inp('ab_ox_B_a', 'O₂ transf ww vs clean, α', 0.5, '', 0.1)}
        ${_ab_inp('ab_ox_B_RHa', 'Rel. Humidity of Air', 0.5, '', 0.1)}
        ${_ab_inp('ab_ox_B_B', 'DO sat ww vs clean, β', 1.0, '', 0.1)}
        ${_ab_inp('ab_ox_B_Ta', 'Design air Temp.', 10.0, '°C', 1)}
        ${_ab_inp('ab_ox_B_F', 'Diffuser fouling factor', 0.8, '', 0.1)}
        ${_ab_inp('ab_ox_B_DPin', 'Press. drop blower inlet', 0.021, 'bar', 0.001)}
        ${_ab_inp('ab_ox_B_Y', 'Synthesis Yield Coeff, Y', 0.6, '', 0.1)}
        ${_ab_inp('ab_ox_B_Fp', 'Peaking Factor, Fp', 1.2, '', 0.1)}
        ${_ab_inp('ab_ox_B_kd20', 'Endog. Decay Coeff', 0.06, '', 0.01)}
        ${_ab_inp('ab_ox_B_SRT', 'Sludge ret. time, SRT', 12.0, 'days', 1)}
        ${_ab_inp('ab_ox_B_RHs', 'Standard Rel. Humidity', 0.36, '', 0.01)}
        ${_ab_inp('ab_ox_B_Cs', 'D.O. sat clean water', 11.28, 'g/m³', 0.01)}
      </div>
    </div></div>

    <div class="card mt"><div class="card-hd"><div class="card-hd-t">B. Detailed Estimates Results</div></div><div class="card-body">
      <div class="mbr-res-grid">
        ${_ab_out('r_oxB_kdT', 'kdT', '1/day')}
        ${_ab_out('r_oxB_Yobs', 'Yobs', 'g/g')}
        ${_ab_out('r_oxB_PD', 'Press @ mid-depth, PD', 'bar')}
        ${_ab_out('r_oxB_AOTE', 'AOTE', '')}
        ${_ab_out('r_oxB_PVa', 'Vapor Press. Air, PVa', 'bar')}
        ${_ab_out('r_oxB_PVN', 'Vapor Press. Norm, PVN', 'bar')}
        ${_ab_out('r_oxB_rair', 'Density of Air, rair', 'kg/m³')}
        ${_ab_out('r_oxB_PB2', 'Blower Outlet Press, PB2', 'bar')}
      </div>
      <div class="fg mt"><div class="fg-t">For BOD Removal Only</div><div class="mbr-res-grid">
        ${_ab_out('r_oxB_Breq', 'O₂ Req\'d', 'kg/h')}
        ${_ab_out('r_oxB_Bair', 'Std Air Req\'d', 'Nm³/h')}
        ${_ab_out('r_oxB_Bact', 'Actual Air Req\'d', 'm³/h')}
        ${_ab_out('r_oxB_Bnorm', 'Normal Air Req\'d', 'Nm³/h', true)}
      </div></div>
      <div class="fg mt"><div class="fg-t">For BOD + Nitrification</div><div class="mbr-res-grid">
        ${_ab_out('r_oxB_Nreq', 'O₂ Req\'d', 'kg/h')}
        ${_ab_out('r_oxB_Nair', 'Std Air Req\'d', 'Nm³/h')}
        ${_ab_out('r_oxB_Nact', 'Actual Air Req\'d', 'm³/h')}
        ${_ab_out('r_oxB_Nnorm', 'Normal Air Req\'d', 'Nm³/h', true)}
      </div></div>
    </div></div>
  </div>
</div>`;
}
