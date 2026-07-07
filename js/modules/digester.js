/* ══════════════════════════════════════════════════════════════════════════════
   ANAEROBIC DIGESTER DESIGN ENGINE — Aapaavani NEXUS
   Complete Replication of: Anaerobic Digester Calculations Workbook (3 Sheets)
   References: Metcalf & Eddy 4th Ed. (Tchobanoglous, Burton, Stensel, 2003)
   Architecture: Namespace-isolated DigesterEngine with reactive event binding
   ══════════════════════════════════════════════════════════════════════════════ */

const DigesterEngine = {

  /* ═══ DESIGN LIMITS — from workbook reference table ═══ */
  LIMITS: {
    SLR_min: 1.6,   SLR_max: 4.8,    // kg VSS/day/m³
    SRT_min: 15,     SRT_max: 20,     // days
    SWD_min: 7.5,    SWD_max: 15,     // m
    DIAM_min: 6,     DIAM_max: 38,    // m
  },

  /* ═══ READ ALL DOM INPUTS ═══ */
  read() {
    const v = id => { const e = document.getElementById(id); return e ? parseFloat(e.value) || 0 : 0; };
    const s = id => { const e = document.getElementById(id); return e ? e.value : 'SRT'; };
    return {
      // Tab 2: Primary Sludge
      Qi: v('dig_Qi'), PF: v('dig_PF'), TSSi: v('dig_TSSi'), TSSp: v('dig_TSSp'),
      PrimConc: v('dig_PrimConc'), PrimSpGr: v('dig_PrimSpGr'), PrimTSSRem: v('dig_PrimTSSRem'),
      // Tab 2: Waste Activated Sludge
      BODi: v('dig_BODi'), PrimBODRem: v('dig_PrimBODRem'), X: v('dig_X'),
      SRT_aer: v('dig_SRT_aer'), VL: v('dig_VL'), TSSw: v('dig_TSSw'), TSSe: v('dig_TSSe'),
      // Tab 2: Thickened WAS
      ThkConc: v('dig_ThkConc'), SolRecov: v('dig_SolRecov'),
      // Tab 3: Digester Design
      VolPrim: v('dig_VolPrim'), VolWAS: v('dig_VolWAS'),
      Criteria: s('dig_Criteria'), CriteriaVal: v('dig_CriteriaVal'),
      NumTanks: v('dig_NumTanks') || 1, SWD: v('dig_SWD'),
    };
  },

  /* ═══ MASTER CALCULATION ENGINE ═══ */
  runSizing() {
    try {
      const el = document.getElementById('dig-module');
      if (!el) return;
      const I = this.read();

      // ── Tab 2: Primary Sludge Calculations ──
      const Qm = I.Qi * I.PF;                                                           // C21 = C13*C11
      const TssPrim = ((I.PrimTSSRem / 100) * Qm * I.TSSp) / 1000;                      // H21 = H15*C21*C17/1000
      const VolFlowPrim = TssPrim / (1000 * I.PrimSpGr * I.PrimConc);                    // H23 = H21/(1000*H13*H11)

      // ── Tab 2: WAS Calculations ──
      const BODAer = (Qm * I.BODi * (1 - (I.PrimBODRem / 100))) / 1000;                 // H29 = C21*C29*(1-C31)/1000
      const VolAer = I.VL > 0 ? BODAer / I.VL : 0;                                       // H31 = H29/C37
      const TssWAS = I.SRT_aer > 0 ? (VolAer * I.X / (1000 * I.SRT_aer)) - (Qm * I.TSSe / 1000) : 0; // H35
      const FlowWAS = I.TSSw > 0 ? (TssWAS * 1000) / I.TSSw : 0;                        // H37 = H35*1000/C39

      // ── Tab 2: Thickened WAS ──
      const TssThknd = (I.SolRecov / 100) * TssWAS;                                      // H47 = C49*H35
      const FlowThknd = I.ThkConc > 0 ? TssThknd / (I.ThkConc * 1000) : 0;              // H49 = H47/(C47*1000)

      // ── Tab 3: Digester Design Calculations ──
      const VssFlow = (TssPrim * (I.VolPrim / 100)) + (TssThknd * (I.VolWAS / 100));     // H17

      let DigVol, ActualSRT, ActualSLR;
      if (I.Criteria === 'SLR') {
        DigVol = I.CriteriaVal > 0 ? VssFlow / I.CriteriaVal : 0;                        // H19 (SLR)
        ActualSLR = I.CriteriaVal;
        ActualSRT = (FlowThknd + VolFlowPrim) > 0 ? DigVol / (FlowThknd + VolFlowPrim) : 0; // H21 (SLR)
      } else {
        DigVol = (FlowWAS + VolFlowPrim) * I.CriteriaVal;                                 // H19 (SRT) — uses WASFlow+PrimFlow
        ActualSRT = I.CriteriaVal;
        ActualSLR = DigVol > 0 ? VssFlow / DigVol : 0;                                    // H21 (SRT)
      }

      const VolPerTank = I.NumTanks > 0 ? DigVol / I.NumTanks : 0;                       // H26
      const Diameter = I.SWD > 0 ? Math.pow((4 * VolPerTank) / (Math.PI * I.SWD), 0.5) : 0; // H28

      // ── Update dynamic label ──
      const lbl = document.getElementById('dig_CriteriaVal_Label');
      const unt = document.getElementById('dig_CriteriaVal_Unit');
      if (lbl && unt) {
        if (I.Criteria === 'SLR') { lbl.textContent = 'Solids Loading Rate'; unt.textContent = 'kg VSS/d/m³'; }
        else { lbl.textContent = 'Solids Retention Time'; unt.textContent = 'days'; }
      }

      // ── Pack results ──
      const R = {
        Qm, TssPrim, VolFlowPrim, BODAer, VolAer, TssWAS, FlowWAS,
        TssThknd, FlowThknd, VssFlow, DigVol, ActualSRT, ActualSLR,
        VolPerTank, Diameter,
        NumTanks: I.NumTanks, SWD: I.SWD,
      };

      this.render(R);
    } catch (err) {
      console.error("Digester Calculation Error: ", err);
    }
  },

  /* ═══ RENDER RESULTS TO DOM ═══ */
  render(R) {
    const sv = (id, val) => {
      const e = document.getElementById(id);
      if (e) {
        if (e.textContent !== String(val)) {
          const isKpi = e.closest('.mbr-kpi-val');
          const cleanVal = String(val).replace(/,/g, '');
          const numVal = parseFloat(cleanVal);

          if (isKpi && !isNaN(numVal) && window.animateValue && e.textContent !== '—') {
            const cur = parseFloat(e.textContent.replace(/,/g, '')) || 0;
            const decimals = String(cleanVal).includes('.') ? String(cleanVal).split('.')[1].length : 0;
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
      }
    };
    const n = (v, d) => (typeof v === 'number' && isFinite(v)) ? (d !== undefined ? v.toFixed(d) : fi(Math.round(v))) : '—';

    // ── KPI CARDS ──
    sv('dig_kpi_Qm', n(R.Qm));
    sv('dig_kpi_DigVol', n(R.DigVol));
    sv('dig_kpi_Diam', n(R.Diameter, 2));
    sv('dig_kpi_VssFlow', n(R.VssFlow));
    sv('dig_kpi_SRT', n(R.ActualSRT, 1));
    sv('dig_kpi_SLR', n(R.ActualSLR, 3));

    // ── Tab 2: Sludge Quantities ──
    sv('dig_r_Qm', n(R.Qm));
    sv('dig_r_TssPrim', n(R.TssPrim, 2));
    sv('dig_r_VolFlowPrim', n(R.VolFlowPrim, 2));
    sv('dig_r_BODAer', n(R.BODAer, 2));
    sv('dig_r_VolAer', n(R.VolAer, 2));
    sv('dig_r_TssWAS', n(R.TssWAS, 2));
    sv('dig_r_FlowWAS', n(R.FlowWAS, 2));
    sv('dig_r_TssThknd', n(R.TssThknd, 2));
    sv('dig_r_FlowThknd', n(R.FlowThknd, 2));

    // ── Tab 3: Digester Design ──
    sv('dig_r_VssFlow', n(R.VssFlow, 2));
    sv('dig_r_DigVol', n(R.DigVol, 2));
    sv('dig_r_ActualSRT', n(R.ActualSRT, 2));
    sv('dig_r_ActualSLR', n(R.ActualSLR, 3));
    sv('dig_r_VolPerTank', n(R.VolPerTank, 2));
    sv('dig_r_Diam', n(R.Diameter, 2));

    // ── Design Checks ──
    const L = this.LIMITS;
    const ckHtml = [
      this._ck(R.SWD >= L.SWD_min && R.SWD <= L.SWD_max, `Side Water Depth: ${L.SWD_min} – ${L.SWD_max} m`, n(R.SWD, 1) + ' m'),
      this._ck(R.Diameter >= L.DIAM_min && R.Diameter <= L.DIAM_max, `Tank Diameter: ${L.DIAM_min} – ${L.DIAM_max} m`, n(R.Diameter, 2) + ' m'),
      this._ck(R.ActualSLR >= L.SLR_min && R.ActualSLR <= L.SLR_max, `Solids Loading Rate: ${L.SLR_min} – ${L.SLR_max} kg VSS/d/m³`, n(R.ActualSLR, 2) + ' kg/d/m³'),
      this._ck(R.ActualSRT >= L.SRT_min && R.ActualSRT <= L.SRT_max, `Solids Retention Time: ${L.SRT_min} – ${L.SRT_max} days`, n(R.ActualSRT, 1) + ' days'),
    ].join('');
    const checksEl = document.getElementById('dig_r_checks');
    if (checksEl) checksEl.innerHTML = ckHtml;
  },

  _ck(ok, label, val) {
    const icon = ok ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    return `<div class="ck-card ${ok ? 'ok' : 'warn'}"><div class="ck-icon">${icon}</div><div class="ck-body"><div class="ck-label">${label}</div><div class="ck-val">${val}</div></div></div>`;
  },

  /* ═══ INITIALIZE MODULE ═══ */
  init() {
    setTimeout(() => {
      this.runSizing();
      const mod = document.getElementById('dig-module');
      if (mod) {
        mod.addEventListener('input', () => this.runSizing());
        mod.addEventListener('change', () => this.runSizing());
      }
    }, 100);
  }
};


/* ══════════════════════════════════════════════════════════════════════════════
   HTML BUILDER — buildDigester()
   ══════════════════════════════════════════════════════════════════════════════ */
function buildDigester() {
  return `<div class="mwrap" id="dig-module">
  <div class="mhdr"><div class="mh-left"><div class="mt-title">Anaerobic Digester Design<div class="mt-badge">SOLIDS HANDLING</div></div>
  <div class="mt-bread">Anaerobic Digester Calculations — S.I. Units · Ref: Metcalf & Eddy 4th Ed. (Tchobanoglous, Burton, Stensel, 2003)</div></div></div>

  <!-- ═══ KPI HIGHLIGHT CARDS ═══ -->
  <div class="mbr-kpi-row">
    ${_kpi('📐','Peak Monthly Flow','dig_kpi_Qm','m³/d','Qi × PF')}
    ${_kpi('🏗️','Digester Volume','dig_kpi_DigVol','m³','Total liquid volume')}
    ${_kpi('⚙️','Tank Diameter','dig_kpi_Diam','m','Per digester')}
    ${_kpi('🧪','VSS to Digester','dig_kpi_VssFlow','kg/d','Primary + Thknd WAS')}
    ${_kpi('⏱️','Actual SRT','dig_kpi_SRT','days','Solids Retention Time')}
    ${_kpi('📊','Actual SLR','dig_kpi_SLR','kg/d/m³','Solids Loading Rate')}
  </div>

  <!-- ═══ TAB BAR ═══ -->
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'dig-t2')">2. Sludge Quantity Calcns</div>
    <div class="tab" onclick="stab(this,'dig-t3')">3. Digester Tank Design</div>
    <div class="tab" onclick="stab(this,'dig-tRef')">📊 Reference & Checks</div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 2: SLUDGE QUANTITY CALCULATIONS                                 -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp active" id="dig-t2">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Primary Sludge — Inputs</div><div class="card-hd-s">Enter values in highlighted cells</div></div><div class="card-body">
          <div class="g2">
            ${_inp('dig_Qi', 'Design Ave. Flow Rate, Qi', 21600, 'm³/d', 100)}
            ${_inp('dig_PF', 'Peaking factor (peak monthly), PF', 1.2, '', 0.05)}
            ${_inp('dig_TSSi', 'Influent TSS, TSSi', 400, 'g/m³', 10)}
            ${_inp('dig_TSSp', 'After grit removal, TSSp', 360, 'g/m³', 10)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Primary Sludge — Properties</div></div><div class="card-body">
          <div class="g2">
            ${_inp('dig_PrimConc', 'Prim. Sludge solids conc.', 0.05, '', 0.01)}
            ${_inp('dig_PrimSpGr', 'Prim. Sludge Sp. Grav.', 1.02, '', 0.01)}
            ${_inp('dig_PrimTSSRem', 'Prim. Clarif. % TSS removal', 70, '%', 1)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Waste Activated Sludge — Inputs</div></div><div class="card-body">
          <div class="g2">
            ${_inp('dig_BODi', 'Infl. BOD conc., BODi', 375, 'g/m³', 5)}
            ${_inp('dig_PrimBODRem', 'Prim. Clarif. % BOD removal', 33, '%', 1)}
            ${_inp('dig_X', 'Aeration tank MLSS, X', 3500, 'g/m³', 100)}
            ${_inp('dig_SRT_aer', 'Design SRT (Aeration)', 13, 'days', 0.5)}
            ${_inp('dig_VL', 'Vol. loading for aeration, VL', 0.8, 'kg BOD/d/m³', 0.1)}
            ${_inp('dig_TSSw', 'WAS conc., TSSw', 10000, 'g/m³', 500)}
            ${_inp('dig_TSSe', 'Effl. TSS conc., TSSe', 20, 'g/m³', 1)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Thickened Waste Activated Sludge — Inputs</div></div><div class="card-body">
          <div class="g2">
            ${_inp('dig_ThkConc', 'Conc. of thickened sludge', 0.05, '', 0.01)}
            ${_inp('dig_SolRecov', 'Assumed solids recovery', 90, '%', 1)}
          </div>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Primary Sludge — Calculations</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('dig_r_Qm', 'Peak monthly flow, Qm', 'm³/d', true)}
            ${_out('dig_r_TssPrim', 'TSS in Primary Sludge', 'kg/d', true)}
            ${_out('dig_r_VolFlowPrim', 'Vol. Flow of Prim. Sludge', 'm³/d')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">WAS — Calculations</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('dig_r_BODAer', 'BOD to aeration tank', 'kg/d')}
            ${_out('dig_r_VolAer', 'Aeration tank volume, V', 'm³')}
            ${_out('dig_r_TssWAS', 'TSS flow rate WAS, ṁWAS', 'kg/d', true)}
            ${_out('dig_r_FlowWAS', 'WAS Flow Rate, Qw', 'm³/d')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Thickened WAS — Calculations</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('dig_r_TssThknd', 'TSS flow (thknd. Sludge)', 'kg/d', true)}
            ${_out('dig_r_FlowThknd', 'Flow rate (thknd. Sludge)', 'm³/d')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Equations Used for Calculations</div></div><div class="card-body mbr-ref">
          <div class="eq-blk"><span class="eq-l">Qm</span><span class="eq-r">= Qi × PF</span></div>
          <div class="eq-blk"><span class="eq-l">TSS in Prim. Sludge</span><span class="eq-r">= Qm × TSSp × (% TSS rem) / 1000  <small>kg/d</small></span></div>
          <div class="eq-blk"><span class="eq-l">Vol. Flow Prim. Sldge</span><span class="eq-r">= (TSS Prim) / [1000 × (conc.) × (Sp. Gr.)]  <small>m³/d</small></span></div>
          <div class="eq-blk"><span class="eq-l">BOD to Aer. Tank</span><span class="eq-r">= Qm × BODi × (1 − % BOD rem) / 1000  <small>kg/d</small></span></div>
          <div class="eq-blk"><span class="eq-l">Aer. Tank Vol.</span><span class="eq-r">= (BOD to Aer. Tank) / VL  <small>m³</small></span></div>
          <div class="eq-blk"><span class="eq-l">ṁWAS</span><span class="eq-r">= V×X / (SRT×1000) − Qm×TSSe / 1000  <small>kg/d</small></span></div>
          <div class="eq-blk"><span class="eq-l">Qw</span><span class="eq-r">= ṁWAS × 1000 / TSSw  <small>m³/d</small></span></div>
          <div class="eq-blk"><span class="eq-l">TSS Thknd</span><span class="eq-r">= ṁWAS × (solids recovery %)  <small>kg/d</small></span></div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 3: DIGESTER TANK DESIGN CALCULATIONS                           -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="dig-t3">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">I. Choose Design Criterion & Parameters</div><div class="card-hd-s">Enter Solids Loading Rate or Solids Retention Time</div></div><div class="card-body">
          <div class="g2">
            ${_inp('dig_VolPrim', '% Volatile solids in primary sludge', 70, '%', 1)}
            ${_inp('dig_VolWAS', '% Volatile solids in waste activated sludge', 80, '%', 1)}
            <div class="f mbr-in"><label>Design Criterion</label><select id="dig_Criteria"><option value="SRT">Solids Retention Time</option><option value="SLR">Solids Loading Rate</option></select></div>
            <div class="f mbr-in"><label id="dig_CriteriaVal_Label">Solids Retention Time</label><div class="fuw"><input type="number" id="dig_CriteriaVal" value="12.0" step="0.5"><div class="fu" id="dig_CriteriaVal_Unit">days</div></div></div>
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">II. Tank Dimensions</div></div><div class="card-body">
          <div class="g2">
            ${_inp('dig_NumTanks', 'Number of tanks', 2, '', 1)}
            ${_inp('dig_SWD', 'Side water depth', 10.0, 'm', 0.5)}
          </div>
          <div class="mbr-ref mt"><small>Min SWD = 7.5 m; Max SWD = 15 m  |  Min diam = 6 m; Max diam = 38 m</small></div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Discussion and References</div></div><div class="card-body mbr-ref">
          <p>For background information about anaerobic digestion see:</p>
          <ul>
            <li><em>Wastewater Engineering Treatment and Reuse</em>, 4th Ed., Tchobanoglous, Burton & Stensel, McGraw Hill, 2003</li>
            <li>Chapter 14: Treatment, Reuse, and Disposal of Solids</li>
            <li>Single-stage, mesophilic, completely mixed digester design</li>
          </ul>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">III. Process Design Calculations</div><div class="card-hd-s">Reactive — updates on every input change</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('dig_r_VssFlow', 'VSS flow rate to digester', 'kg/d', true)}
            ${_out('dig_r_DigVol', 'Total digester liquid volume', 'm³', true)}
            ${_out('dig_r_ActualSRT', 'Actual Solids Retention Time', 'days')}
            ${_out('dig_r_ActualSLR', 'Actual Solids Loading Rate', 'kg VSS/d/m³')}
            ${_out('dig_r_VolPerTank', 'Liquid volume / digester', 'm³')}
            ${_out('dig_r_Diam', 'Diameter of digester', 'm', true)}
          </div>
          <div class="alert al-i mt">Digester volume is based on peak 2-week or peak monthly influent wastewater flow rate. Solids retention time equals liquid retention time for a completely mixed reactor.</div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Equations Used in the Calculations</div></div><div class="card-body mbr-ref">
          <div class="eq-blk"><span class="eq-l">VSS to digester</span><span class="eq-r">= (TSS Prim × Vol.%) + (TSS Thknd × Vol.%)  <small>kg/d</small></span></div>
          <div class="eq-blk"><div class="eq-t">For Solids Loading Rate as design criterion:</div><span class="eq-l">Digester Vol.</span><span class="eq-r">= (VSS to digester) / SLR  <small>m³</small></span></div>
          <div class="eq-blk"><div class="eq-t">For Solids Retention Time as design criterion:</div><span class="eq-l">Digester Vol.</span><span class="eq-r">= (Flow prim + Flow WAS) × SRT  <small>m³</small></span><div class="eq-where">SRT = Liquid Retention Time for CSTR</div></div>
          <div class="eq-blk"><span class="eq-l">Vol. / digester</span><span class="eq-r">= (Total Vol.) / (Number of tanks)  <small>m³</small></span></div>
          <div class="eq-blk"><span class="eq-l">Diameter</span><span class="eq-r">= √[(Vol/tank × 4) / (π × SWD)]  <small>m</small></span></div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Typical Design Loading Rates</div><div class="card-hd-s">Mesophilic, high-rate, complete mix Anaerobic Digesters (Metcalf & Eddy)</div></div><div class="card-body">
          <table class="mbr-tbl"><thead><tr><th>Parameter</th><th>Range</th></tr></thead><tbody>
            <tr><td>Solids Loading Rate</td><td><b>1.6 – 4.8</b> kg VSS/day/m³</td></tr>
            <tr><td>Solids Retention Time</td><td><b>15 – 20</b> days</td></tr>
            <tr><td>Side Water Depth</td><td><b>7.5 – 15</b> m</td></tr>
            <tr><td>Digester Diameter</td><td><b>6 – 38</b> m</td></tr>
          </tbody></table>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB REF: DESIGN VERIFICATION CHECKS                                -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="dig-tRef">
    <div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div><div class="card-hd-s">Validated against Metcalf & Eddy 4th Ed. typical design ranges</div></div><div class="card-body"><div id="dig_r_checks" class="ck-list"></div></div></div>
  </div>

</div>`;
}
