/* ══════ CALCULATION: HORIZONTAL FLOW GRIT CHAMBER ══════ */
function calcGritHorizontal() {
  const Q = parseFloat(document.getElementById('gh_Q').value) || 0;
  let PF = parseFloat(document.getElementById('gh_PF').value) || 0;
  const autoPF = document.getElementById('gh_autoPF').checked;

  if (autoPF && Q > 0) {
    // PF = (18 + (P^0.5)) / (4 + (P^0.5)) where P = (Q / 0.378541) / 1000
    const P = (Q / 0.378541) / 1000;
    const P_sqrt = Math.pow(P, 0.5);
    PF = (18 + P_sqrt) / (4 + P_sqrt);
    document.getElementById('gh_PF').value = PF.toFixed(4);
  }

  const N = parseInt(document.getElementById('gh_N').value) || 1;
  const DFB = parseFloat(document.getElementById('gh_DFB').value) || 0;
  const V = parseFloat(document.getElementById('gh_V').value) || 0;
  const t = parseFloat(document.getElementById('gh_t').value) || 0;
  const ladd = (parseFloat(document.getElementById('gh_ladd').value) || 0) / 100;
  const DGR = parseFloat(document.getElementById('gh_DGR').value) || 0;
  const W = parseFloat(document.getElementById('gh_W').value) || 1;

  // Peak Hourly Flow Rate (m3/d)
  const Qp = Q * PF;
  
  // Length for Flow (m)
  const Lf = V * t;

  // Grit Chamber Volume (m3)
  const Vol = (Qp / (24 * 3600)) * t;

  // Area of Flow (m2)
  const A = Lf > 0 ? Vol / Lf : 0;

  // Depth of Flow (m)
  const D = W > 0 ? A / W : 0;

  // Tank Length (m)
  const L = Lf * (1 + ladd);

  // Tank Wall Depth (m)
  const DW = D + DFB + DGR;

  // Render Output
  document.getElementById('gh_Qd').textContent = fi(Q);
  document.getElementById('gh_Qpd').textContent = fi(Qp);

  const html = 
    rs('⚡ Input & Assumed Parameters', rg([
      rc(fi(Q), 'Design Ave Flow Q', 'm³/d'),
      rc(f2(PF, 4), 'Peaking Factor', '—'),
      rc(f2(Qp, 0), 'Peak Hourly Flow', 'm³/d'),
      rc(N, 'Tanks in Parallel', '—'),
      rc(f2(V, 2), 'Design Horiz. Velocity', 'm/s'),
      rc(f2(t, 1), 'Design Detention Time', 'sec')
    ])) +
    rs('📐 Chamber Dimensions', rg([
      rc(f2(Vol, 3), 'Grit Chamber Volume (V)', 'm³'),
      rc(f2(Lf, 2), 'Length for Flow (Lf)', 'm'),
      rc(f2(A, 3), 'Area of Flow (A)', 'm²'),
      rc(f2(D, 3), 'Depth of Flow (D)', 'm'),
      rc(f2(W, 3), 'Tank Width (W)', 'm'),
      rc(f2(L, 2), 'Tank Length (L)', 'm'),
      rc(f2(DW, 3), 'Tank Wall Depth (DW)', 'm')
    ]));
  
  document.getElementById('gh-res-area').innerHTML = html;
}

function toggleAutoPF() {
  const autoPF = document.getElementById('gh_autoPF').checked;
  document.getElementById('gh_PF').disabled = autoPF;
  calcGritHorizontal();
}

// Add event listeners for auto-recalculation
function initGritHorizontalListeners() {
  const inputs = ['gh_Q', 'gh_PF', 'gh_N', 'gh_V', 'gh_t', 'gh_ladd', 'gh_W', 'gh_DFB', 'gh_DGR'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      el.addEventListener('input', calcGritHorizontal);
    }
  });
}

function buildGritHorizontal() {
  setTimeout(() => {
    initGritHorizontalListeners();
    calcGritHorizontal();
  }, 50);

  return `<div class="mwrap">
  <div class="mhdr"><div class="mh-left"><div class="mt-title">Horizontal Flow Grit Chamber<div class="mt-badge">PRETREATMENT</div></div><div class="mt-bread">Average: <b id="gh_Qd">${fi(G.Q)}</b> m³/d · Peak: <b id="gh_Qpd">${fi(G.Q*2.51)}</b> m³/d</div></div></div>
  
  <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
    <!-- LEFT PANEL: INPUTS -->
    <div style="flex: 1; min-width: 320px;">
      <div class="card"><div class="card-hd"><div class="card-hd-t">💧 Primary Inputs</div></div><div class="card-body">
        <div class="g2">
          <div class="f"><label>Design Ave Flow Rate, Q</label><div class="fuw"><input type="number" id="gh_Q" value="10500" step="100"><div class="fu">m³/d</div></div></div>
          <div class="f"><label>Auto-Calc Peaking Factor?</label>
            <div style="display:flex;align-items:center;height:40px;"><input type="checkbox" id="gh_autoPF" onchange="toggleAutoPF()" style="width:20px;height:20px;margin:0 10px 0 0;"> Use 10 States Stds</div>
          </div>
          <div class="f"><label>Peaking Factor, PF</label><input type="number" id="gh_PF" value="2.51" step="0.01"></div>
          <div class="f"><label>No. of Tanks in Parallel, N</label><input type="number" id="gh_N" value="2" min="1"></div>
        </div>
      </div></div>
      
      <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Assumptions</div></div><div class="card-body">
        <div class="g2">
          <div class="f"><label>Design Horiz. Velocity, V</label><div class="fuw"><input type="number" id="gh_V" value="0.3" step="0.05"><div class="fu">m/s</div></div><div class="h">Typical: 0.25 - 0.4 m/s</div></div>
          <div class="f"><label>Design Detention Time, t</label><div class="fuw"><input type="number" id="gh_t" value="60" step="5"><div class="fu">sec</div></div><div class="h">Typical: 45 - 90 sec</div></div>
          <div class="f"><label>Add. Length for I+O</label><div class="fuw"><input type="number" id="gh_ladd" value="25" step="1"><div class="fu">%</div></div><div class="h">Typical: 25 - 50%</div></div>
          <div class="f"><label>Tank Width, W</label><div class="fuw"><input type="number" id="gh_W" value="1" step="0.1"><div class="fu">m</div></div></div>
          <div class="f"><label>Tank Freeboard, DFB</label><div class="fuw"><input type="number" id="gh_DFB" value="0.3" step="0.05"><div class="fu">m</div></div></div>
          <div class="f"><label>Grit Storage Depth, DGR</label><div class="fuw"><input type="number" id="gh_DGR" value="0.25" step="0.05"><div class="fu">m</div></div><div class="h">Typical: 0.2 - 0.5 m</div></div>
        </div>
      </div></div>
    </div>
    
    <!-- RIGHT PANEL: RESULTS -->
    <div style="flex: 1; min-width: 320px;">
      <div class="card"><div class="card-hd"><div class="card-hd-t">📊 Instant Results</div></div><div class="card-body">
        <div id="gh-res-area"></div>
      </div></div>
    </div>
  </div>

  <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Calculation Summary & Equations</div><div class="card-hd-s">Values below demonstrate the logic used to derive the dimensions matching the source spreadsheet.</div></div><div class="card-body">
    <div class="eq-blk"><div class="eq-t">Peaking Factor (10 States Standards)</div><span class="eq-l">PF</span> = <span class="eq-r">(18 + (P^0.5)) / (4 + (P^0.5))</span><div class="eq-where">P = Population in thousands = (Q / 0.378541) / 1000</div></div>
    <div class="eq-blk"><div class="eq-t">Peak Hourly Flow Rate</div><span class="eq-l">Qp</span> = <span class="eq-r">Q × PF</span></div>
    <div class="eq-blk"><div class="eq-t">Grit Chamber Volume</div><span class="eq-l">V</span> = <span class="eq-r">Qp × t</span><div class="eq-where">Volume is calculated based on the total peak flow as designed.</div></div>
    <div class="eq-blk"><div class="eq-t">Length for Flow</div><span class="eq-l">Lf</span> = <span class="eq-r">V_horiz × t</span></div>
    <div class="eq-blk"><div class="eq-t">Area of Flow</div><span class="eq-l">A</span> = <span class="eq-r">V / Lf</span></div>
    <div class="eq-blk"><div class="eq-t">Depth of Flow</div><span class="eq-l">D</span> = <span class="eq-r">A / W</span></div>
    <div class="eq-blk"><div class="eq-t">Tank Length</div><span class="eq-l">L</span> = <span class="eq-r">Lf × (1 + Added_Length_%)</span></div>
    <div class="eq-blk"><div class="eq-t">Tank Wall Depth</div><span class="eq-l">DW</span> = <span class="eq-r">D + DFB + DGR</span></div>
  </div></div>

</div>`;
}
