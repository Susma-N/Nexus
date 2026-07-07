/* ══════ CALCULATION: AERATED GRIT CHAMBER ══════ */
/* Exact replication of Aerated Grit Chamber Design workbook              */
/* Source: EngineeringExcelTemplates.com — M&E 4th Ed. Table 5-17, p 389  */
/* Sheets: 1. Aerated Grit Chamber Design  2. Est. of Peaking Factor      */

let agPfChartInstance = null;

function initAgPfChart() {
  const ctx = document.getElementById('agPfChart');
  if(!ctx) return;
  if(agPfChartInstance) agPfChartInstance.destroy();

  const dataPoints = [
    {x: 1893, y: 4.0},
    {x: 3785, y: 3.7},
    {x: 7571, y: 3.4},
    {x: 18927, y: 3.0},
    {x: 37854, y: 2.7},
    {x: 75708, y: 2.4},
    {x: 189271, y: 2.0},
    {x: 378541, y: 1.7}
  ];

  agPfChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Current Design Point',
          data: [], // Updated dynamically
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false,
          order: 1
        },
        {
          label: 'M&E Curve',
          data: dataPoints,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#0ea5e9',
          pointRadius: 4,
          fill: true,
          tension: 0.4,
          order: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'logarithmic',
          title: { display: true, text: 'Design Average Flow Rate, Q (m³/d)', color: '#94a3b8' },
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          title: { display: true, text: 'Peaking Factor, PF', color: '#94a3b8' },
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          min: 1
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `PF: ${ctx.parsed.y.toFixed(2)} @ Q: ${fi(ctx.parsed.x)} m³/d`
          }
        }
      }
    }
  });
}

function calcAeratedGritWB() {
  const Q   = parseFloat(document.getElementById('ag_Q').value) || 0;
  let   PF  = parseFloat(document.getElementById('ag_PF').value) || 0;
  const autoPF = document.getElementById('ag_autoPF').checked;

  // Auto-calc PF from Sheet 2: PF = -0.4343 × ln(Q) + 7.2776
  if (autoPF && Q > 0) {
    PF = -0.4343 * Math.log(Q) + 7.2776;
    document.getElementById('ag_PF').value = PF.toFixed(2);
  }

  const D   = parseFloat(document.getElementById('ag_D').value) || 0;
  const LW  = parseFloat(document.getElementById('ag_LW').value) || 0;
  const t   = parseFloat(document.getElementById('ag_t').value) || 0;
  const QaL = parseFloat(document.getElementById('ag_QaL').value) || 0;
  const N   = parseInt(document.getElementById('ag_N').value) || 1;

  // ═══ Excel Formulas — Exact Replication ═══
  const Qp    = Q * PF;                              // H7: =C7*C9
  const V     = t * (Qp / (24 * 60));                // H9: =C15*(H7/(24*60))
  const W     = (D > 0 && LW > 0) ? Math.pow((V / D) / LW, 0.5) : 0; // H11: =((H9/C11)/C13)^(1/2)
  const L     = LW * W;                              // H13: =C13*H11
  const WD    = D > 0 ? W / D : 0;                   // H15: =H11/C11
  const Qa    = QaL * L;                              // H17: =C17*H13
  const Qatot = Qa * N;                               // H19: =H17*C19

  // ═══ Render breadcrumb ═══
  document.getElementById('ag_Qd').textContent = fi(Q);
  document.getElementById('ag_Qpd').textContent = fi(Qp);

  // ═══ Render Results — same rs()/rg()/rc() pattern as Horizontal Grit ═══
  const html =
    rs('⚡ Input & Assumed Parameters', rg([
      rc(fi(Q), 'Design Ave Flow Q', 'm³/d'),
      rc(f2(PF, 2), 'Peaking Factor (PF)', '—'),
      rc(fi(Qp), 'Peak Hourly Flow (Qp)', 'm³/d'),
      rc(N, 'No. of Grit Chambers', '—'),
      rc(f2(D, 1), 'Tank Depth (D)', 'm'),
      rc(f2(LW, 1), 'Length:Width Ratio (L:W)', '—'),
      rc(f2(t, 1), 'Detention Time at Peak (t)', 'min'),
      rc(f2(QaL, 2), 'Air Supply per Unit Length', 'm³/min-m')
    ])) +
    rs('📐 Chamber Dimensions', rg([
      rc(f2(V, 3), 'Grit Chamber Volume (V)', 'm³'),
      rc(f2(W, 4), 'Tank Width (W)', 'm', W >= 2.5 && W <= 7 ? '' : 'warn'),
      rc(f2(L, 4), 'Tank Length (L)', 'm', L >= 7.5 && L <= 20 ? '' : 'warn'),
      rc(f2(WD, 4), 'Width:Depth Ratio (W:D)', '—', WD >= 1 && WD <= 5 ? '' : 'warn')
    ])) +
    rs('🌬️ Air Supply', rg([
      rc(f2(Qa, 4), 'Req. Air Supply per Tank (Qa)', 'm³/min'),
      rc(f2(Qatot, 4), 'Total Req. Air Supply (Qa,tot)', 'm³/min')
    ]));

  document.getElementById('ag-res-area').innerHTML = html;

  document.getElementById('ag-checks-area').innerHTML = `<div class="ck-list">${[
    ck(t >= 2 && t <= 5,       'Detention time (at peak flow): 2 – 5 min',        f2(t, 1) + ' min',       'Table 5-17'),
    ck(D >= 2 && D <= 5,       'Tank Depth: 2 – 5 m',                              f2(D, 1) + ' m',         'Table 5-17'),
    ck(W >= 2.5 && W <= 7,     'Tank Width: 2.5 – 7 m',                            f2(W, 2) + ' m',         'Table 5-17'),
    ck(L >= 7.5 && L <= 20,    'Tank Length: 7.5 – 20 m',                           f2(L, 2) + ' m',         'Table 5-17'),
    ck(WD >= 1 && WD <= 5,     'Width:Depth ratio: 1:1 – 5:1',                     f2(WD, 2) + ':1',        'Table 5-17'),
    ck(LW >= 3 && LW <= 5,     'Length:Width ratio: 3:1 – 5:1',                    f2(LW, 1) + ':1',        'Table 5-17'),
    ck(QaL >= 0.2 && QaL <= 0.5,'Air Supply per unit length: 0.2 – 0.5 m³/min-m', f2(QaL, 2) + ' m³/min-m','Table 5-17'),
  ].join('')}</div>`;

  // Update dynamic chart
  if (agPfChartInstance) {
    agPfChartInstance.data.datasets[0].data = [{x: Q, y: PF}];
    agPfChartInstance.update();
  }
}

function toggleAutoPF_AG() {
  const autoPF = document.getElementById('ag_autoPF').checked;
  document.getElementById('ag_PF').disabled = autoPF;
  calcAeratedGritWB();
}

function initAeratedGritListeners() {
  const ids = ['ag_Q', 'ag_PF', 'ag_D', 'ag_LW', 'ag_t', 'ag_QaL', 'ag_N'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcAeratedGritWB);
  });
}


/* ═══ HTML BUILDER — mirrors buildGritHorizontal() layout exactly ═══ */
function buildAeratedGrit() {
  setTimeout(() => {
    initAeratedGritListeners();
    initAgPfChart();
    calcAeratedGritWB();
  }, 50);

  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left"><div class="mt-title">Aerated Grit Chamber<div class="mt-badge">PRETREATMENT</div></div><div class="mt-bread">Average: <b id="ag_Qd">${fi(G.Q)}</b> m³/d · Peak: <b id="ag_Qpd">${fi(G.Q*G.PF)}</b> m³/d</div></div></div>
  
  <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
    <!-- LEFT PANEL: INPUTS -->
    <div style="flex: 1; min-width: 320px;">
      <div class="card"><div class="card-hd"><div class="card-hd-t">💧 Primary Inputs</div></div><div class="card-body">
        <div class="g2">
          <div class="f"><label>Design Ave Flow Rate, Q</label><div class="fuw"><input type="number" id="ag_Q" value="10500" step="100"><div class="fu">m³/d</div></div></div>
          <div class="f"><label>Auto-Calc Peaking Factor?</label>
            <div style="display:flex;align-items:center;height:40px;"><input type="checkbox" id="ag_autoPF" onchange="toggleAutoPF_AG()" style="width:20px;height:20px;margin:0 10px 0 0;"> Use Workbook Equation</div>
          </div>
          <div class="f"><label>Peaking Factor, PF</label><input type="number" id="ag_PF" value="3.26" step="0.01"><div class="h">(Peak hourly flow / Average flow)</div></div>
          <div class="f"><label>No. of Grit Chambers</label><input type="number" id="ag_N" value="2" min="1"></div>
        </div>
      </div></div>
      
      <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Assumptions</div></div><div class="card-body">
        <div class="g2">
          <div class="f"><label>Tank Depth, D</label><div class="fuw"><input type="number" id="ag_D" value="2.5" step="0.1"><div class="fu">m</div></div><div class="h">Typical: 2 – 5 m</div></div>
          <div class="f"><label>Length-Width Ratio, L:W</label><input type="number" id="ag_LW" value="3.0" step="0.5"><div class="h">Typical: 3:1 – 5:1 (Typical: 4:1)</div></div>
          <div class="f"><label>Detention Time at Peak Flow, t</label><div class="fuw"><input type="number" id="ag_t" value="3.0" step="0.5"><div class="fu">min</div></div><div class="h">Typical: 2 – 5 min (Typical: 3)</div></div>
          <div class="f"><label>Air Supply per Unit Length, Qa/L</label><div class="fuw"><input type="number" id="ag_QaL" value="0.3" step="0.05"><div class="fu">m³/min-m</div></div><div class="h">Typical: 0.2 – 0.5 m³/min-m</div></div>
        </div>
      </div></div>
      
      <div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Validation</div><div class="card-hd-s">M&E Table 5-17</div></div><div class="card-body">
        <div id="ag-checks-area"></div>
      </div></div>
    </div>
    
    <!-- RIGHT PANEL: RESULTS -->
    <div style="flex: 1; min-width: 320px;">
      <div class="card"><div class="card-hd"><div class="card-hd-t">📊 Instant Results</div></div><div class="card-body">
        <div id="ag-res-area"></div>
      </div></div>
    </div>
  </div>

  <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Calculation Summary & Equations</div><div class="card-hd-s">Formulas match the source spreadsheet exactly. Source: M&E 4th Ed. Table 5-17, p 389.</div></div><div class="card-body">
    <div class="eq-blk"><div class="eq-t">Peaking Factor — Auto-Calculation</div><span class="eq-l">PF</span> = <span class="eq-r">– 0.4343 × Ln(Q) + 7.2776</span><div class="eq-where">Q is in m³/d. Source: M&E 4th Ed. Figure 3-13, p 202.</div></div>
    <div class="eq-blk"><div class="eq-t">Peak Hourly Flow Rate</div><span class="eq-l">Qp</span> = <span class="eq-r">Q × PF</span></div>
    <div class="eq-blk"><div class="eq-t">Grit Chamber Volume — for each tank</div><span class="eq-l">V</span> = <span class="eq-r">t × (Qp / (24 × 60))</span><div class="eq-where">Volume based on total system peak flow.</div></div>
    <div class="eq-blk"><div class="eq-t">Tank Width</div><span class="eq-l">W</span> = <span class="eq-r">√( (V / D) / L:W )</span></div>
    <div class="eq-blk"><div class="eq-t">Tank Length</div><span class="eq-l">L</span> = <span class="eq-r">L:W × W</span></div>
    <div class="eq-blk"><div class="eq-t">Width-Depth Ratio</div><span class="eq-l">W:D</span> = <span class="eq-r">W / D</span></div>
    <div class="eq-blk"><div class="eq-t">Required Air Supply — per tank</div><span class="eq-l">Qa</span> = <span class="eq-r">(Qa/L) × L</span></div>
    <div class="eq-blk"><div class="eq-t">Total Required Air Supply</div><span class="eq-l">Qa,tot</span> = <span class="eq-r">Qa × N</span></div>
  </div></div>

  <div class="card"><div class="card-hd"><div class="card-hd-t">📊 WW Flow Rate Peaking Factor</div><div class="card-hd-s">Reference graph & table from Sheet 2 of the workbook, derived from M&E 4th Ed. Figure 3-13. <span style="color:#ef4444;font-weight:bold;">●</span> Your current design point.</div></div><div class="card-body" style="display:flex;gap:30px;flex-wrap:wrap;align-items:center;">
    <div style="flex:1;min-width:300px;">
      <table class="rtable">
        <thead><tr><th>Population</th><th>Flow (m³/d)</th><th>Peaking Factor</th></tr></thead>
        <tbody>
          <tr><td>5,000</td><td>1,893</td><td>4.0</td></tr>
          <tr><td>10,000</td><td>3,785</td><td>3.7</td></tr>
          <tr><td>20,000</td><td>7,571</td><td>3.4</td></tr>
          <tr><td>50,000</td><td>18,927</td><td>3.0</td></tr>
          <tr><td>100,000</td><td>37,854</td><td>2.7</td></tr>
          <tr><td>200,000</td><td>75,708</td><td>2.4</td></tr>
          <tr><td>500,000</td><td>189,271</td><td>2.0</td></tr>
          <tr><td>1,000,000</td><td>378,541</td><td>1.7</td></tr>
        </tbody>
      </table>
    </div>
    <div style="flex:1.5;min-width:350px;height:320px;position:relative;">
      <canvas id="agPfChart"></canvas>
    </div>
  </div></div>

</div>`;
}
