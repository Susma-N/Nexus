/* ══════════════════════════════════════════════════════════════════════════════
   CMAS TERTIARY ANOXIC DENITRIFICATION DESIGN ENGINE — Aapaavani NEXUS
   Complete Replication of: "CMAS - Tertiary Denitrif." Workbook (2 Sheets)
   Reference: Metcalf & Eddy, Wastewater Engineering, Treatment and Reuse,
              4th Ed. (Tchobanoglous, Burton, Stensel), McGraw Hill, 2003.
              Example 8-9. S.I. Units.
   ══════════════════════════════════════════════════════════════════════════════ */

const TDNEngine = {

  /* ─── READ INPUTS ─── */
  read() {
    const v = id => { const e = document.getElementById(id); return e ? (parseFloat(e.value) || 0) : 0; };
    const s = id => { const e = document.getElementById(id); return e ? e.value : 'rectangular'; };
    return {
      // Wastewater Parameters
      Qo:    v('tdn_Q'),        // m³/d — design wastewater flow rate
      TSSo:  v('tdn_TSSo'),    // mg/L — influent TSS
      NO3No: v('tdn_NO3No'),   // mg/L — influent NO3-N
      TSSe:  v('tdn_TSSe'),    // mg/L — estimated effluent TSS
      Tww:   v('tdn_T'),       // °C  — anoxic tank temperature
      Ne:    v('tdn_Ne'),      // mg/L — target effluent nitrate conc.
      fd:    v('tdn_fd'),      // —    — residual biomass fraction (dimensionless)
      TSSw:  v('tdn_TSSw'),    // mg/L — waste/recycle A.S. concentration
      // Design Parameters
      SRT:   v('tdn_SRT'),     // d    — design solids retention time
      Fb:    v('tdn_Fb'),      // m    — tank freeboard
      Ntanks:v('tdn_Ntanks'),  // —    — number of tanks
      Ld:    v('tdn_Ld'),      // m    — liquid depth in anoxic tank
      Mix:   v('tdn_Mix'),     // kW/10³m³ — mixing energy for anoxic reactor
      MLSS:  v('tdn_MLSS'),    // mg/L — design MLSS
      treaer:v('tdn_treaer'),  // min  — reaeration detention time
      LW:    v('tdn_LW'),      // —    — tank L:W ratio (for rectangular)
      shape: s('tdn_shape'),   // 'rectangular' or 'cylindrical'
      // Actual tank dims (user inputs)
      ActW:  v('tdn_ActW'),    // m    — actual tank width (or diameter for cyl)
      ActL:  v('tdn_ActL'),    // m    — actual tank length (rectangular only)
      ActWr: v('tdn_ActWr'),   // m    — reaer actual width (or diam)
      ActLr: v('tdn_ActLr'),   // m    — reaer actual length (rectangular only)
      // Kinetic Coefficients at 10°C and 20°C
      YD10:  v('tdn_YD10'), YD20: v('tdn_YD20'),  // g VSS/g bCOD — synth yield
      KsD10: v('tdn_KsD10'), KsD20: v('tdn_KsD20'),  // mg/L — half velocity coeff
      mmD10: v('tdn_mmD10'), mmD20: v('tdn_mmD20'),  // /d — max spec growth rate
      kdD10: v('tdn_kdD10'), kdD20: v('tdn_kdD20'),  // /d — endogenous decay coeff
      kD10:  v('tdn_kD10'),  kD20:  v('tdn_kD20'),   // /d — max spec substr util rate
    };
  },

  /* ─── MASTER CALCULATION ENGINE ─── */
  calc() {
    try {
      const el = document.getElementById('tdn-module');
      if (!el) return;
      const I = this.read();

      // ── Step 1: Interpolate kinetic coefficients at wastewater temperature ──
      // Linear interpolation between 10°C and 20°C values
      // kdD = F29 + (H29-F29)*((Tww-10)/10)
      const frac = (I.Tww - 10) / 10;
      const kdD = I.kdD10 + (I.kdD20 - I.kdD10) * frac;   // g VSS/d/g VSS
      const YD  = I.YD10  + (I.YD20  - I.YD10)  * frac;   // g VSS/g bCOD
      const kD  = I.kD10  + (I.kD20  - I.kD10)  * frac;   // g VSS/d/g VSS (substr utiliz.)
      const KsD = I.KsD10 + (I.KsD20 - I.KsD10) * frac;   // mg/L

      // ── Step 2: Calculate Methanol Requirement ──
      // Residual methanol concentration in effluent, S (mg/L):
      // S = KsD * (1 + kdD*SRT) / (SRT * (YD*kD - kdD) - 1)
      const S = KsD * (1 + kdD * I.SRT) / (I.SRT * (YD * kD - kdD) - 1);   // mg/L bCOD

      // Net observed yield Yn (g VSS/g bCOD):
      // Yn = YD / (1 + kdD*SRT)
      const Yn = YD / (1 + kdD * I.SRT);

      // bCOD per unit of NO3-N removed (g/g):
      // bCOD/NO4-N = 2.86 / (1 - 1.43*Yn)  [Note: workbook uses 1.43*Yn, not 1.42*Yn in label]
      const bCODperNO3N = 2.86 / (1 - 1.43 * Yn);

      // Methanol dose as COD (mg/L COD):
      // MethDoseCOD = bCOD/NO4-N * (NO3-No - Ne) + S
      const MethDoseCOD = bCODperNO3N * (I.NO3No - I.Ne) + S;   // mg/L COD

      // Methanol dose (mg/L CH3OH):
      // Methanol = MethDoseCOD / 1.5  (1.5 g COD per g methanol)
      const MethDose = MethDoseCOD / 1.5;   // mg/L CH3OH

      // Daily methanol needed (kg/d):
      // = MethDose * Qo / 1000
      const MethDaily = (MethDose * I.Qo) / 1000;   // kg/d

      // ── Step 3: Calculate Anoxic Tank Volume, Dimensions, Detention Time ──
      // Solids production rate PX,TSS (kg/d):
      // PX,TSS = [ Qo*YD*MethDoseCOD / ((1+kdD*SRT)*0.85) ]
      //        + [ fd*kdD*SRT*Qo*YD*MethDoseCOD / ((1+kdD*SRT)*0.85) ]
      //        + [ Qo*TSSo ]
      // Note: /0.85 converts VSS to TSS (VSS/TSS = 0.85)
      const term1 = (I.Qo * YD * MethDoseCOD) / ((1 + kdD * I.SRT) * 0.85);
      const term2 = (I.fd * kdD * I.SRT * I.Qo * YD * MethDoseCOD) / ((1 + kdD * I.SRT) * 0.85);
      const term3 = I.Qo * I.TSSo;
      const PxTSS = (term1 + term2 + term3) / 1000;   // kg/d  (÷1000 for mg→g→kg unit fix)

      // Min. Anoxic Tank Volume (m³):
      // Van = PX,TSS * SRT / MLSS   [kg/d * d / (g/m³ → kg/m³)]
      // MLSS in mg/L = g/m³, so Van = PX,TSS[kg/d]*SRT[d] / (MLSS[g/m³]/1000[kg/g]) * 1000
      const Van = (PxTSS * I.SRT * 1000) / I.MLSS;   // m³

      // Volume per tank (m³):
      const Vtank = Van / I.Ntanks;   // m³

      // Tank dimensions (anoxic):
      let CalcW, CalcL, CalcWall, ActVolAnox;
      if (I.shape === 'cylindrical') {
        // Diameter = sqrt(Vtank/Ld * 4/PI)
        CalcW = Math.sqrt((Vtank / I.Ld) * (4 / Math.PI));   // m (diameter)
        CalcL = 0;   // not used
        // Actual volume from user-specified actual diameter
        ActVolAnox = I.Ld * Math.PI * Math.pow(I.ActW / 2, 2);   // m³
      } else {
        // Rectangular: W = sqrt(Vtank/(Ld*LW))
        CalcW = Math.sqrt((Vtank / I.Ld) / I.LW);   // m (width)
        CalcL = (Vtank / I.Ld) / CalcW;               // m (length = Vtank/(Ld*CalcW))
        // Actual volume from user-specified actual W and L
        ActVolAnox = I.Ld * I.ActW * I.ActL;   // m³
      }
      CalcWall = I.Ld + I.Fb;   // m

      // Anoxic Detention Time (hr):
      // t = ActVolAnox * Ntanks * 24 / Qo
      const tAnox = (ActVolAnox * I.Ntanks * 24) / I.Qo;   // hr

      // Anoxic Tank Mixing Power (kW):
      // Power = ActVolAnox * Ntanks * Mix / 1000
      const MixPow = (ActVolAnox * I.Ntanks * I.Mix) / 1000;   // kW

      // ── Step 4: Reaeration Volume and Dimensions ──
      // Reaeration Volume (m³) — same formula regardless of tank number:
      // Vreaer = Qo * treaer / (24*60)
      const Vreaer = (I.Qo * I.treaer) / (24 * 60);   // m³

      // Min reaer volume per tank:
      const VtankR = Vreaer / I.Ntanks;   // m³

      // Reaeration tank dimensions (same shape as anoxic):
      let CalcWr, CalcLr, ActVolRear;
      if (I.shape === 'cylindrical') {
        // Width stays same as anoxic calced diameter in Excel, but here calculated from VtankR
        CalcWr = Math.sqrt((VtankR / I.Ld) * (4 / Math.PI));   // m
        CalcLr = 0;
        ActVolRear = I.Ld * Math.PI * Math.pow(I.ActWr / 2, 2);   // m³
      } else {
        // Width is kept same as anoxic tank (H51 in Excel)
        CalcWr = I.ActW;   // same width as anoxic
        CalcLr = (VtankR / CalcWr) / I.Ld;   // length
        ActVolRear = I.Ld * I.ActWr * I.ActLr;   // m³
      }
      const CalcWallR = I.Ld + I.Fb;   // m

      // Reaer Detention Time (min):
      // t = ActVolRear * Ntanks * 60 * 24 / Qo
      const tRear = (ActVolRear * I.Ntanks * 60 * 24) / I.Qo;   // min

      // ── Step 5: Sludge Recycle Rate and Wasting Rate ──
      // Qr = Qo * (MLSS - TSSo) / (TSSw - MLSS)   [m³/d]
      const Qr = I.Qo * (I.MLSS - I.TSSo) / (I.TSSw - I.MLSS);

      // Qw = [(Ntanks*ActVolAnox * MLSS/SRT) - Qo*TSSe] / (TSSw - TSSe)  [m³/d]
      // Note: MLSS/SRT in mg/L/d, * volume m³ → need /1000 for kg/d then *1000 back for mg/m³*m³=g → /1000=kg/d
      // Workbook: Qw = [(V*MLSS/SRT) - Qo*TSSe] / (TSSw - TSSe) where V in m³, MLSS/TSSe/TSSw in mg/L
      // Units: m³ * mg/L / d / (mg/L) = m³/d ✓ (mg/L cancels)
      const Qw = ((I.Ntanks * ActVolAnox * I.MLSS / I.SRT) - (I.Qo * I.TSSe)) / (I.TSSw - I.TSSe);

      const R = {
        // Interpolated kinetics
        kdD, YD, kD, KsD,
        // Methanol
        S, Yn, bCODperNO3N, MethDoseCOD, MethDose, MethDaily,
        // Anoxic tank
        PxTSS, Van, Vtank, CalcW, CalcL, CalcWall, ActVolAnox, tAnox, MixPow,
        // Reaeration
        Vreaer, VtankR, CalcWr, CalcLr, CalcWallR, ActVolRear, tRear,
        // Sludge
        Qr, Qw,
        // Pass-through
        Ld: I.Ld, SRT: I.SRT, Ntanks: I.Ntanks, MLSS: I.MLSS,
        shape: I.shape, Tww: I.Tww,
      };

      this.render(R);
      this.drawSVG(R, I);
    } catch (err) {
      console.error('TDN Calculation Error:', err);
    }
  },

  /* ─── RENDER RESULTS ─── */
  render(R) {
    const sv = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    const n = (v, d) => (typeof v === 'number' && isFinite(v)) ? (d !== undefined ? (+v).toFixed(d) : fi(Math.round(v))) : '—';

    // Kinetics
    sv('tdn_r_kdD',   n(R.kdD, 4));
    sv('tdn_r_YD',    n(R.YD,  4));
    sv('tdn_r_kD',    n(R.kD,  4));
    sv('tdn_r_KsD',   n(R.KsD, 3));

    // Methanol
    sv('tdn_r_S',            n(R.S,            4));
    sv('tdn_r_Yn',           n(R.Yn,           4));
    sv('tdn_r_bCODperNO3N',  n(R.bCODperNO3N,  3));
    sv('tdn_r_MethDoseCOD',  n(R.MethDoseCOD,  2));
    sv('tdn_r_MethDose',     n(R.MethDose,      2));
    sv('tdn_r_MethDaily',    n(R.MethDaily,     2));

    // Anoxic tank
    sv('tdn_r_PxTSS',    n(R.PxTSS,     2));
    sv('tdn_r_Van',      n(R.Van,        2));
    sv('tdn_r_Vtank',    n(R.Vtank,      2));
    sv('tdn_r_CalcW',    n(R.CalcW,      2));
    sv('tdn_r_CalcL',    n(R.CalcL,      2));
    sv('tdn_r_CalcWall', n(R.CalcWall,   2));
    sv('tdn_r_ActVol',   n(R.ActVolAnox, 2));
    sv('tdn_r_tAnox',    n(R.tAnox,      2));
    sv('tdn_r_MixPow',   n(R.MixPow,     2));

    // Reaeration
    sv('tdn_r_Vreaer',   n(R.Vreaer,     2));
    sv('tdn_r_VtankR',   n(R.VtankR,     2));
    sv('tdn_r_CalcWr',   n(R.CalcWr,     2));
    sv('tdn_r_CalcLr',   n(R.CalcLr,     2));
    sv('tdn_r_ActVolR',  n(R.ActVolRear,  2));
    sv('tdn_r_tRear',    n(R.tRear,       2));

    // Sludge
    sv('tdn_r_Qr',  n(R.Qr,  1));
    sv('tdn_r_Qw',  n(R.Qw,  1));

    // KPI
    sv('tdn_kpi_Van',      n(R.Van,       0));
    sv('tdn_kpi_MethDaily',n(R.MethDaily, 1));
    sv('tdn_kpi_tAnox',    n(R.tAnox,     2));
    sv('tdn_kpi_Qr',       n(R.Qr,        0));

    // Design checks
    const chksHtml = [
      ck(R.SRT >= 5 && R.SRT <= 20,  'Design SRT: 5–20 days',          n(R.SRT, 1) + ' d', 'M&E 4th Ed. Ex 8-9'),
      ck(R.S >= 0 && R.S < 1.0,      'Residual methanol conc. S < 1 mg/L', n(R.S, 4) + ' mg/L', 'Calculated from kinetics'),
      ck(R.Yn > 0 && R.Yn < R.YD,    'Net yield Yn < synthesis yield YD',   n(R.Yn, 4) + ' < ' + n(R.YD, 3)),
      ck(R.bCODperNO3N > 2.86,       'bCOD/NO3-N > 2.86 g/g (valid ratio)', n(R.bCODperNO3N, 3) + ' g/g'),
      ck(R.tAnox >= 0.5 && R.tAnox <= 8, 'Anoxic det. time: 0.5–8 hr',  n(R.tAnox, 2) + ' hr'),
      ck(R.tRear >= 10 && R.tRear <= 30, 'Reaer. det. time: 10–30 min', n(R.tRear, 2) + ' min', 'M&E 4th Ed.'),
      ck(R.Qr > 0, 'Sludge recycle rate > 0',   n(R.Qr, 1) + ' m³/d'),
      ck(R.Qw > 0, 'Sludge wasting rate > 0',   n(R.Qw, 1) + ' m³/d'),
    ].join('');
    const checksEl = document.getElementById('tdn_r_checks');
    if (checksEl) checksEl.innerHTML = `<div class="ck-list">${chksHtml}</div>`;
  },

  /* ─── SVG PROCESS DIAGRAM ─── */
  drawSVG(R, I) {
    const svgW = 1100, svgH = 540;
    const col = { flow: '#3a9bd4', anox: '#1a7a3c', reaer: '#e8760a', sludge: '#8b7355', methanol: '#9b59b6', effl: '#1a9454' };

    let s = `<defs>
      ${mkArr('ara', col.flow)}${mkArr('arb', col.anox)}${mkArr('arc', col.reaer)}${mkArr('ars', col.sludge)}${mkArr('arm', col.methanol)}${mkArr('are', col.effl)}
    </defs>`;
    s += `<rect width="${svgW}" height="${svgH}" fill="#f6f5f0"/>`;
    // Title
    s += `<text x="14" y="24" font-size="11.5" font-weight="800" fill="#080808" font-family="Inter, sans-serif">CMAS TERTIARY ANOXIC DENITRIFICATION — PROCESS SCHEMATIC</text>`;
    s += `<text x="${svgW - 14}" y="24" text-anchor="end" font-size="9.5" fill="#888" font-family="Inter, sans-serif">Q = ${fi(I.Qo)} m³/d  |  NO3-N in = ${I.NO3No} mg/L  |  Target Ne = ${I.Ne} mg/L  |  T = ${I.Tww}°C</text>`;
    s += `<line x1="14" y1="30" x2="${svgW - 14}" y2="30" stroke="#e9e6dc" stroke-width="1"/>`;

    const bY = 55, flowY = bY + 100, tankH = 150;

    // ── INFLUENT (nitrified effluent from upstream)
    const infX = 30;
    s += `<rect x="${infX}" y="${bY}" width="90" height="${tankH}" rx="5" fill="#dbeafe" stroke="${col.flow}" stroke-width="2"/>`;
    s += `<text x="${infX + 45}" y="${bY + 22}" text-anchor="middle" font-size="9" font-weight="800" fill="#1565c0" font-family="Inter, sans-serif">NITRIFIED</text>`;
    s += `<text x="${infX + 45}" y="${bY + 36}" text-anchor="middle" font-size="9" font-weight="800" fill="#1565c0" font-family="Inter, sans-serif">INFLUENT</text>`;
    s += `<text x="${infX + 45}" y="${bY + 56}" text-anchor="middle" font-size="9" fill="#555" font-family="Inter, sans-serif">Q = ${fi(I.Qo)}</text>`;
    s += `<text x="${infX + 45}" y="${bY + 70}" text-anchor="middle" font-size="9" fill="#555" font-family="Inter, sans-serif">m³/d</text>`;
    s += `<text x="${infX + 45}" y="${bY + 88}" text-anchor="middle" font-size="9" fill="#c0392b" font-family="Inter, sans-serif">NO3 = ${I.NO3No}</text>`;
    s += `<text x="${infX + 45}" y="${bY + 102}" text-anchor="middle" font-size="9" fill="#c0392b" font-family="Inter, sans-serif">mg/L</text>`;

    // Flow arrow: influent → anoxic
    s += `<line x1="${infX + 90}" y1="${flowY}" x2="${infX + 150}" y2="${flowY}" stroke="${col.flow}" stroke-width="2.8" marker-end="url(#ara)"/>`;

    // ── METHANOL dosing arrow (from top)
    const methX = infX + 220;
    s += `<line x1="${methX}" y1="${bY - 30}" x2="${methX}" y2="${bY}" stroke="${col.methanol}" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arm)"/>`;
    s += `<rect x="${methX - 50}" y="${bY - 52}" width="100" height="20" rx="3" fill="#f0e6f6" stroke="${col.methanol}" stroke-width="1"/>`;
    s += `<text x="${methX}" y="${bY - 38}" text-anchor="middle" font-size="9" fill="#6c3483" font-weight="700" font-family="Inter, sans-serif">METHANOL</text>`;
    s += `<text x="${methX}" y="${bY - 24}" text-anchor="middle" font-size="8.5" fill="#888" font-family="Inter, sans-serif">${f2(R.MethDaily, 2)} kg/d</text>`;

    // ── ANOXIC TANK
    const anoxX = infX + 150;
    const anoxW = 240;
    s += `<rect x="${anoxX}" y="${bY}" width="${anoxW}" height="${tankH}" rx="5" fill="#e8f5e9" stroke="${col.anox}" stroke-width="2.5"/>`;
    s += `<text x="${anoxX + anoxW / 2}" y="${bY + 22}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#1a5c2e" font-family="Inter, sans-serif">ANOXIC BASIN</text>`;
    s += `<text x="${anoxX + anoxW / 2}" y="${bY + 37}" text-anchor="middle" font-size="8.5" fill="#555" font-family="Inter, sans-serif">Post-Anoxic Denitrification</text>`;
    s += `<text x="${anoxX + anoxW / 2}" y="${bY + 55}" text-anchor="middle" font-size="9" fill="#2e7d32" font-family="Inter, sans-serif" font-weight="700">SRT = ${I.SRT} d | MLSS = ${I.MLSS} mg/L</text>`;
    s += `<text x="${anoxX + anoxW / 2}" y="${bY + 70}" text-anchor="middle" font-size="9" fill="#2e7d32" font-family="Inter, sans-serif">Van = ${f2(R.Van, 1)} m³ | ${I.Ntanks} tank(s)</text>`;
    s += `<text x="${anoxX + anoxW / 2}" y="${bY + 85}" text-anchor="middle" font-size="9" fill="#555" font-family="Inter, sans-serif">t = ${f2(R.tAnox, 2)} hr</text>`;
    // Mixing swirl arrows inside
    const cx = anoxX + anoxW / 2, cy = bY + 118;
    s += `<path d="M${cx - 28} ${cy} A 28 22 0 1 1 ${cx + 28} ${cy}" fill="none" stroke="${col.anox}" stroke-width="1.5" stroke-dasharray="6 3" marker-end="url(#arb)"/>`;
    s += `<text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="8.5" fill="#1a5c2e" font-family="Inter, sans-serif">Mixing: ${I.Mix} kW/10³m³</text>`;

    // Flow arrow: anoxic → reaeration
    const anoxEnd = anoxX + anoxW;
    s += `<line x1="${anoxEnd}" y1="${flowY}" x2="${anoxEnd + 70}" y2="${flowY}" stroke="${col.flow}" stroke-width="2.8" marker-end="url(#ara)"/>`;

    // ── REAERATION TANK
    const reaerX = anoxEnd + 70;
    const reaerW = 180;
    s += `<rect x="${reaerX}" y="${bY}" width="${reaerW}" height="${tankH}" rx="5" fill="#fff3e0" stroke="${col.reaer}" stroke-width="2.5"/>`;
    s += `<text x="${reaerX + reaerW / 2}" y="${bY + 22}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#7f4c00" font-family="Inter, sans-serif">REAERATION</text>`;
    s += `<text x="${reaerX + reaerW / 2}" y="${bY + 38}" text-anchor="middle" font-size="9" fill="#7f4c00" font-family="Inter, sans-serif">Basin</text>`;
    s += `<text x="${reaerX + reaerW / 2}" y="${bY + 58}" text-anchor="middle" font-size="9" fill="#555" font-family="Inter, sans-serif">t = ${f2(R.tRear, 1)} min</text>`;
    s += `<text x="${reaerX + reaerW / 2}" y="${bY + 73}" text-anchor="middle" font-size="9" fill="#555" font-family="Inter, sans-serif">V = ${f2(R.ActVolRear, 1)} m³/tank</text>`;
    // Aeration bubbles
    for (let bi = 0; bi < 5; bi++) {
      const bx = reaerX + 20 + bi * 32;
      s += `<circle cx="${bx}" cy="${bY + 110}" r="6" fill="none" stroke="${col.reaer}" stroke-width="1.5" opacity=".6"/>`;
      s += `<line x1="${bx}" y1="${bY + 110}" x2="${bx}" y2="${bY + 92}" stroke="${col.reaer}" stroke-width="1" stroke-dasharray="3 2" marker-end="url(#arc)"/>`;
    }
    s += `<text x="${reaerX + reaerW / 2}" y="${bY + 136}" text-anchor="middle" font-size="8.5" fill="#7f4c00" font-family="Inter, sans-serif">↑ Aeration (strip N₂)</text>`;

    // ── SECONDARY CLARIFIER
    const clarX = reaerX + reaerW + 70;
    const clarW = 120;
    s += `<line x1="${reaerX + reaerW}" y1="${flowY}" x2="${clarX}" y2="${flowY}" stroke="${col.flow}" stroke-width="2.8" marker-end="url(#ara)"/>`;
    s += `<rect x="${clarX}" y="${bY}" width="${clarW}" height="${tankH}" rx="5" fill="#e3f2fd" stroke="${col.flow}" stroke-width="2"/>`;
    s += `<text x="${clarX + clarW / 2}" y="${bY + 22}" text-anchor="middle" font-size="9" font-weight="800" fill="#0d47a1" font-family="Inter, sans-serif">SECONDARY</text>`;
    s += `<text x="${clarX + clarW / 2}" y="${bY + 36}" text-anchor="middle" font-size="9" font-weight="800" fill="#0d47a1" font-family="Inter, sans-serif">CLARIFIER</text>`;
    // Settling arrows
    for (let si = 0; si < 3; si++) {
      const sx = clarX + 20 + si * 38;
      s += `<line x1="${sx}" y1="${bY + 55}" x2="${sx}" y2="${bY + 95}" stroke="${col.flow}" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#ara)"/>`;
      s += `<circle cx="${sx}" cy="${bY + 50}" r="5" fill="${col.flow}" opacity=".4"/>`;
    }
    s += `<text x="${clarX + clarW / 2}" y="${bY + 115}" text-anchor="middle" font-size="8.5" fill="#0d47a1" font-family="Inter, sans-serif">Sludge settles</text>`;
    s += `<text x="${clarX + clarW / 2}" y="${bY + 128}" text-anchor="middle" font-size="8.5" fill="#0d47a1" font-family="Inter, sans-serif">& separates</text>`;

    // ── EFFLUENT
    const efflX = clarX + clarW + 20;
    s += `<line x1="${efflX}" y1="${flowY}" x2="${efflX + 80}" y2="${flowY}" stroke="${col.effl}" stroke-width="2.8" marker-end="url(#are)"/>`;
    s += `<rect x="${efflX + 82}" y="${bY + 60}" width="100" height="70" rx="4" fill="#e8f5e9" stroke="${col.effl}" stroke-width="1.5"/>`;
    s += `<text x="${efflX + 132}" y="${bY + 78}" text-anchor="middle" font-size="9" font-weight="800" fill="#1a5c2e" font-family="Inter, sans-serif">EFFLUENT</text>`;
    s += `<text x="${efflX + 132}" y="${bY + 94}" text-anchor="middle" font-size="8.5" fill="#555" font-family="Inter, sans-serif">NO3 ≤ ${I.Ne} mg/L</text>`;
    s += `<text x="${efflX + 132}" y="${bY + 110}" text-anchor="middle" font-size="8.5" fill="#555" font-family="Inter, sans-serif">TSS = ${I.TSSe} mg/L</text>`;

    // ── RAS (Return Activated Sludge)
    const rasY = bY + tankH + 40;
    s += `<line x1="${clarX + clarW / 2}" y1="${bY + tankH}" x2="${clarX + clarW / 2}" y2="${rasY}" stroke="${col.sludge}" stroke-width="2" marker-end="url(#ars)"/>`;
    s += `<line x1="${clarX + clarW / 2}" y1="${rasY}" x2="${anoxX + anoxW / 2}" y2="${rasY}" stroke="${col.sludge}" stroke-width="2"/>`;
    s += `<line x1="${anoxX + anoxW / 2}" y1="${rasY}" x2="${anoxX + anoxW / 2}" y2="${bY + tankH}" stroke="${col.sludge}" stroke-width="2" marker-end="url(#ars)"/>`;
    s += `<text x="${(clarX + clarW / 2 + anoxX + anoxW / 2) / 2}" y="${rasY + 14}" text-anchor="middle" font-size="9" fill="${col.sludge}" font-weight="700" font-family="Inter, sans-serif">RAS — Qr = ${f2(R.Qr, 0)} m³/d</text>`;

    // ── WAS (Waste Activated Sludge)
    const wasX = clarX + clarW / 2 + 40;
    const wasY2 = rasY + 45;
    s += `<line x1="${wasX}" y1="${rasY + 2}" x2="${wasX}" y2="${wasY2}" stroke="${col.sludge}" stroke-width="2" stroke-dasharray="6 3" marker-end="url(#ars)"/>`;
    s += `<rect x="${wasX - 50}" y="${wasY2}" width="100" height="28" rx="3" fill="#f5edd8" stroke="${col.sludge}" stroke-width="1"/>`;
    s += `<text x="${wasX}" y="${wasY2 + 12}" text-anchor="middle" font-size="9" fill="#5a4a2e" font-weight="700" font-family="Inter, sans-serif">WAS</text>`;
    s += `<text x="${wasX}" y="${wasY2 + 24}" text-anchor="middle" font-size="8.5" fill="#888" font-family="Inter, sans-serif">Qw = ${f2(R.Qw, 0)} m³/d</text>`;

    // ── LEGEND BOX
    const legX = 14, legY = bY + tankH + 30;
    s += `<rect x="${legX}" y="${legY}" width="180" height="100" rx="4" fill="rgba(8,8,8,0.05)" stroke="#ccc" stroke-width="1"/>`;
    s += `<text x="${legX + 90}" y="${legY + 14}" text-anchor="middle" font-size="9" font-weight="700" fill="#333" font-family="Inter, sans-serif">LEGEND</text>`;
    const legItems = [
      { col: col.flow, lbl: 'Process Flow' },
      { col: col.anox, lbl: 'Anoxic Denitrification' },
      { col: col.reaer, lbl: 'Reaeration' },
      { col: col.methanol, lbl: 'Methanol Dose' },
      { col: col.sludge, lbl: 'RAS / WAS Sludge' },
    ];
    legItems.forEach((li, idx) => {
      const ly = legY + 26 + idx * 15;
      s += `<rect x="${legX + 10}" y="${ly}" width="14" height="9" rx="2" fill="${li.col}" opacity=".8"/>`;
      s += `<text x="${legX + 30}" y="${ly + 8}" font-size="8.5" fill="#444" font-family="Inter, sans-serif">${li.lbl}</text>`;
    });

    // ── Process parameters table below
    const tblY = bY + tankH + 30;
    const tblX = 210;
    s += `<rect x="${tblX}" y="${tblY}" width="660" height="108" rx="4" fill="rgba(8,8,8,0.04)" stroke="#ccc" stroke-width="1"/>`;
    s += `<text x="${tblX + 330}" y="${tblY + 15}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#222" font-family="Inter, sans-serif">KEY DESIGN PARAMETERS SUMMARY</text>`;
    const params = [
      { l: 'Anoxic Vol.', v: f2(R.Van, 1) + ' m³', col: col.anox },
      { l: 'Methanol/d', v: f2(R.MethDaily, 2) + ' kg/d', col: col.methanol },
      { l: 'SRT', v: I.SRT + ' d', col: '#555' },
      { l: 'MLSS', v: I.MLSS + ' mg/L', col: '#555' },
      { l: 'Anox t', v: f2(R.tAnox, 2) + ' hr', col: col.anox },
      { l: 'Reaer t', v: f2(R.tRear, 1) + ' min', col: col.reaer },
      { l: 'RAS Qr', v: f2(R.Qr, 0) + ' m³/d', col: col.sludge },
      { l: 'WAS Qw', v: f2(R.Qw, 0) + ' m³/d', col: col.sludge },
      { l: 'Reaer. Vol.', v: f2(R.Vreaer, 1) + ' m³', col: col.reaer },
    ];
    params.forEach((p, i) => {
      const px = tblX + 15 + (i % 3) * 220;
      const py = tblY + 35 + Math.floor(i / 3) * 28;
      s += `<rect x="${px}" y="${py}" width="200" height="22" rx="3" fill="${p.col}" opacity=".1" stroke="${p.col}" stroke-width="1" stroke-opacity=".3"/>`;
      s += `<text x="${px + 6}" y="${py + 14}" font-size="8.5" fill="#444" font-family="Inter, sans-serif">${p.l}:</text>`;
      s += `<text x="${px + 194}" y="${py + 14}" text-anchor="end" font-size="9" font-weight="700" fill="${p.col}" font-family="Inter, sans-serif">${p.v}</text>`;
    });

    s += TB(svgW, svgH,
      'CMAS Tertiary Anoxic Denitrification — Process Schematic',
      `M&E 4th Ed. Ex. 8-9 · Methanol as Carbon Source · SRT = ${I.SRT} d · T = ${I.Tww}°C`,
      'NTS', '1 of 1');

    const svg = document.getElementById('tdn-svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
      svg.innerHTML = s;
    }
  },

  init() {
    setTimeout(() => {
      this.calc();
      const mod = document.getElementById('tdn-module');
      if (mod) {
        mod.addEventListener('input', () => this.calc());
        mod.addEventListener('change', () => this.calc());
      }
    }, 100);
  }
};

/* ══════════════════════════════════════════════════════════════════════════════
   HTML BUILDER — buildTertiaryDenitrif()
   ══════════════════════════════════════════════════════════════════════════════ */
function buildTertiaryDenitrif() {
  /* Shared helpers matching existing app style */
  const _inp = (id, label, val, unit, step, hint) => {
    const stepAttr = step !== undefined ? `step="${step}"` : '';
    return `<div class="f mbr-in">
      <label>${label}</label>
      <div class="fuw"><input type="number" id="${id}" value="${val}" ${stepAttr}><div class="fu">${unit}</div></div>
      ${hint ? `<div class="h">${hint}</div>` : ''}
    </div>`;
  };
  const _out = (id, label, unit, bold) =>
    `<div class="mbr-res-cell${bold ? ' mbr-res-bold' : ''}">
      <div class="mbr-res-label">${label}</div>
      <div class="mbr-res-val"><span id="${id}">—</span> <span class="mbr-res-unit">${unit}</span></div>
    </div>`;
  const _kpi = (icon, title, id, unit, sub) =>
    `<div class="mbr-kpi">
      <div class="mbr-kpi-icon">${icon}</div>
      <div class="mbr-kpi-body">
        <div class="mbr-kpi-title">${title}</div>
        <div class="mbr-kpi-val"><span id="${id}">—</span> <small>${unit}</small></div>
        <div class="mbr-kpi-sub">${sub}</div>
      </div>
    </div>`;

  return `<div class="mwrap" id="tdn-module">
  <div class="mhdr"><div class="mh-left">
    <div class="mt-title">CMAS Tertiary Anoxic Denitrification<div class="mt-badge">TERTIARY BNR</div></div>
    <div class="mt-bread">Post-Anoxic, Completely Mixed Basin · Methanol as Carbon Source · M&amp;E 4th Ed. Example 8-9 · S.I. Units</div>
  </div></div>

  <!-- ═══ KPI CARDS ═══ -->
  <div class="mbr-kpi-row">
    ${_kpi('🏗️', 'Anoxic Tank Volume', 'tdn_kpi_Van', 'm³', 'Total anoxic basin vol.')}
    ${_kpi('🧪', 'Methanol Required', 'tdn_kpi_MethDaily', 'kg/d', 'Daily methanol dose')}
    ${_kpi('⏱️', 'Anoxic Det. Time', 'tdn_kpi_tAnox', 'hr', 'Hydraulic retention time')}
    ${_kpi('♻️', 'RAS Recycle Rate', 'tdn_kpi_Qr', 'm³/d', 'Return activated sludge')}
  </div>

  <!-- ═══ TAB BAR ═══ -->
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'tdn-t1')">📋 Inputs</div>
    <div class="tab" onclick="stab(this,'tdn-t2')">🧪 Methanol Calcs</div>
    <div class="tab" onclick="stab(this,'tdn-t3')">🏗️ Tank Dimensions</div>
    <div class="tab" onclick="stab(this,'tdn-t4')">🔄 Sludge Flows</div>
    <div class="tab" onclick="stab(this,'tdn-tRef')">📐 Equations</div>
    <div class="tab" onclick="stab(this,'tdn-tDrw')">🖼 Process Diagram</div>
    <div class="tab" onclick="stab(this,'tdn-tChk')">✅ Design Checks</div>
  </div>

  <!-- ══════════ TAB 1: INPUTS ══════════ -->
  <div class="tp active" id="tdn-t1">
    <div class="mbr-split">
      <div class="mbr-left">

        <div class="card"><div class="card-hd"><div class="card-hd-t">User Inputs 1 — Wastewater Parameters</div><div class="card-hd-s">Enter values for the nitrified influent feed</div></div><div class="card-body">
          <div class="g2">
            ${_inp('tdn_Q',     'Design WW Flow Rate, Qo',       4000, 'm³/d', 100, 'Average daily design flow')}
            ${_inp('tdn_T',     'Anoxic Tank Temp., Tww',        15,   '°C',   1,   'Critical design temperature')}
            ${_inp('tdn_TSSo',  'Influent TSS, TSSo',            20,   'mg/L', 1,   'TSS entering anoxic basin')}
            ${_inp('tdn_Ne',    'Target Effl. Nitrate Conc., Ne',2,    'mg/L', 0.5, 'Target effluent NO3-N')}
            ${_inp('tdn_NO3No', 'Influent NO3-N, NO3-No',        25,   'mg/L', 1,   'Nitrified influent NO3-N')}
            ${_inp('tdn_fd',    'Residual Biomass Fract., fd',   0.15, '—',    0.01,'Endogenous residue fraction')}
            ${_inp('tdn_TSSe',  'Est. Effl. TSS, TSSe',          15,   'mg/L', 1,   'Estimated final effluent TSS')}
            ${_inp('tdn_TSSw',  'Waste/Recycle A.S. Conc. TSSw', 6500, 'mg/L', 100, 'WAS + RAS concentration')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">User Inputs 2 — Design Parameters</div></div><div class="card-body">
          <div class="g2">
            ${_inp('tdn_SRT',    'Design SRT',                  5,    'days',        0.5,  'Solids retention time')}
            ${_inp('tdn_Fb',     'Tank Freeboard',               0.5,  'm',           0.1,  'Above liquid depth')}
            ${_inp('tdn_Ntanks', 'Number of Tanks',              3,    '—',           1,    'Anoxic + reaer. tanks')}
            ${_inp('tdn_Ld',     'Liquid Depth in Tank',         5,    'm',           0.5,  'Min SWD = 3m; Max = 8m')}
            ${_inp('tdn_Mix',    'Mixing Energy (Anoxic)',       10,   'kW/10³m³',    1,    'Typical: 8–15 kW/10³m³')}
            ${_inp('tdn_MLSS',   'Design MLSS',                  2000, 'mg/L',        100,  'Mixed liquor suspended solids')}
            ${_inp('tdn_treaer', 'Reaer. Det. Time, treaer',     15,   'min',         1,    'Reaeration basin HRT')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Tank Shape &amp; Actual Dimensions</div><div class="card-hd-s">Select shape and enter actual constructed dimensions</div></div><div class="card-body">
          <div class="g2">
            <div class="f mbr-in"><label>Tank Shape</label><select id="tdn_shape">
              <option value="rectangular">Rectangular</option>
              <option value="cylindrical">Cylindrical</option>
            </select></div>
            ${_inp('tdn_LW',   'Target L:W Ratio (rect. only)', 1.0, '—',  0.1, 'Length-to-width ratio')}
            ${_inp('tdn_ActW', 'Actual Tank Width (or Diam.)',   5.0, 'm',  0.5, 'Anoxic tank — actual W or D')}
            ${_inp('tdn_ActL', 'Actual Tank Length (rect.)',     5.0, 'm',  0.5, 'Anoxic tank — actual L')}
            ${_inp('tdn_ActWr','Reaer. Actual Width (or Diam.)', 5.0, 'm',  0.5, 'Reaeration tank — actual W or D')}
            ${_inp('tdn_ActLr','Reaer. Actual Length (rect.)',   0.7, 'm',  0.1, 'Reaeration tank — actual L')}
          </div>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">User Inputs 3 — Kinetic Coefficients for Denitrification with Methanol</div><div class="card-hd-s">M&amp;E 4th Ed. Table 8-14 (Metcalf &amp; Eddy, 2003)</div></div><div class="card-body">
          <table class="rtable">
            <thead><tr><th>Coefficient</th><th>Symbol</th><th>Unit</th><th>At 10°C</th><th>At 20°C</th></tr></thead>
            <tbody>
              <tr>
                <td>Synthesis Yield Coeff.</td><td><b>Y<sub>D</sub></b></td><td>g VSS/g bCOD</td>
                <td><div class="mbr-in"><input type="number" id="tdn_YD10"  value="0.17" step="0.01" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
                <td><div class="mbr-in"><input type="number" id="tdn_YD20"  value="0.18" step="0.01" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
              </tr>
              <tr>
                <td>Half Velocity Coeff.</td><td><b>K<sub>sD</sub></b></td><td>mg/L</td>
                <td><div class="mbr-in"><input type="number" id="tdn_KsD10" value="12.6" step="0.1" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
                <td><div class="mbr-in"><input type="number" id="tdn_KsD20" value="9.1"  step="0.1" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
              </tr>
              <tr>
                <td>Max. Spec. Growth Rate</td><td><b>μ<sub>mD</sub></b></td><td>g VSS/d/g VSS</td>
                <td><div class="mbr-in"><input type="number" id="tdn_mmD10" value="0.52" step="0.01" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
                <td><div class="mbr-in"><input type="number" id="tdn_mmD20" value="1.86" step="0.01" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
              </tr>
              <tr>
                <td>Endogenous Decay Coeff.</td><td><b>k<sub>dD</sub></b></td><td>g VSS/d/g VSS</td>
                <td><div class="mbr-in"><input type="number" id="tdn_kdD10" value="0.04" step="0.005" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
                <td><div class="mbr-in"><input type="number" id="tdn_kdD20" value="0.05" step="0.005" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
              </tr>
              <tr>
                <td>Max. Spec. Substr. Util. Rate</td><td><b>k</b></td><td>g bCOD/d/g VSS</td>
                <td><div class="mbr-in"><input type="number" id="tdn_kD10"  value="3.1"  step="0.1" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
                <td><div class="mbr-in"><input type="number" id="tdn_kD20"  value="10.3" step="0.1" style="width:72px; border-radius:6px; border-right:1.5px solid rgba(14,165,233,0.15);"></div></td>
              </tr>
            </tbody>
          </table>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Step 1 — Interpolated Kinetic Coefficients at Tww</div><div class="card-hd-s">Linear interpolation between 10°C and 20°C values</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('tdn_r_kdD', 'Endogenous Decay Coeff., k<sub>dD</sub>', 'g VSS/d/g VSS', true)}
            ${_out('tdn_r_YD',  'Synthesis Yield Coeff., Y<sub>D</sub>',   'g VSS/g bCOD',  true)}
            ${_out('tdn_r_kD',  'Max Spec. Substr. Util., k',              'g bCOD/d/g VSS')}
            ${_out('tdn_r_KsD', 'Half Velocity Coeff., K<sub>sD</sub>',   'mg/L')}
          </div>
          <div class="alert al-i mt">Linear interpolation: X<sub>Tww</sub> = X<sub>10</sub> + (X<sub>20</sub> − X<sub>10</sub>) × (T − 10)/10</div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ══════════ TAB 2: METHANOL CALCULATIONS ══════════ -->
  <div class="tp" id="tdn-t2">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Step 2 — Methanol Requirement</div><div class="card-hd-s">Residual concentration → dose → daily quantity</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('tdn_r_S',           'Residual Methanol Conc. in Effl., S',  'mg/L bCOD', true)}
            ${_out('tdn_r_Yn',          'Net Observed Yield, Yn',               'g VSS/g bCOD', true)}
            ${_out('tdn_r_bCODperNO3N', 'bCOD / NO3-N Ratio',                  'g/g')}
            ${_out('tdn_r_MethDoseCOD', 'Methanol Dose (as COD)',               'mg/L COD', true)}
            ${_out('tdn_r_MethDose',    'Methanol Dose',                        'mg/L CH₃OH')}
            ${_out('tdn_r_MethDaily',   'Daily Methanol Needed',                'kg/d', true)}
          </div>
        </div></div>
      </div>
      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Methanol Equations Used</div><div class="card-hd-s">M&amp;E 4th Ed. Chapter 8 — Denitrification Kinetics</div></div><div class="card-body mbr-ref">
          <div class="eq-blk"><span class="eq-l">S</span><span class="eq-r">= K<sub>sD</sub> × [1 + k<sub>dD</sub>·SRT] / [SRT × (Y<sub>D</sub>·k − k<sub>dD</sub>) − 1] <small>mg/L bCOD</small></span></div>
          <div class="eq-blk"><span class="eq-l">Yn</span><span class="eq-r">= Y<sub>D</sub> / [1 + k<sub>dD</sub>·SRT] <small>g VSS/g bCOD</small></span></div>
          <div class="eq-blk"><span class="eq-l">bCOD/NO3-N</span><span class="eq-r">= 2.86 / (1 − 1.43·Yn) <small>g/g</small></span><div class="eq-where">Oxygen equivalence of nitrate as electron acceptor</div></div>
          <div class="eq-blk"><span class="eq-l">Methanol dose (COD)</span><span class="eq-r">= (bCOD/NO3-N) × (NO3-No − Ne) + S <small>mg/L COD</small></span></div>
          <div class="eq-blk"><span class="eq-l">Methanol dose</span><span class="eq-r">= Methanol dose (COD) / 1.5 <small>mg/L CH₃OH</small></span><div class="eq-where">1.5 g COD per g methanol (stoichiometric)</div></div>
          <div class="eq-blk"><span class="eq-l">Daily methanol</span><span class="eq-r">= Methanol dose × Q<sub>o</sub> / 1000 <small>kg/d</small></span></div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ══════════ TAB 3: TANK DIMENSIONS ══════════ -->
  <div class="tp" id="tdn-t3">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Step 3 — Anoxic Tank Sizing</div><div class="card-hd-s">Volume, dimensions, and detention time</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('tdn_r_PxTSS',   'Solids Prod. Rate, P<sub>X,TSS</sub>', 'kg/d',  true)}
            ${_out('tdn_r_Van',     'Min. Anoxic Tank Volume, Van',          'm³',    true)}
            ${_out('tdn_r_Vtank',   'Min. Vol. per Tank, Vtank',             'm³')}
            ${_out('tdn_r_CalcW',   'Calculated Tank Width (or Diam.)',      'm')}
            ${_out('tdn_r_CalcL',   'Calculated Tank Length (rect.)',        'm')}
            ${_out('tdn_r_CalcWall','Tank Wall Height',                      'm')}
            ${_out('tdn_r_ActVol',  'Actual Liquid Volume / Tank',           'm³',    true)}
            ${_out('tdn_r_tAnox',   'Anoxic Detention Time, t',              'hr',    true)}
            ${_out('tdn_r_MixPow',  'Anoxic Tank Mixing Power',              'kW')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Step 4 — Reaeration Tank Sizing</div><div class="card-hd-s">Same shape as anoxic basin</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('tdn_r_Vreaer',  'Total Reaeration Volume, Vreaer',  'm³',  true)}
            ${_out('tdn_r_VtankR',  'Min. Reaer. Vol./Tank, Vtank',      'm³')}
            ${_out('tdn_r_CalcWr',  'Calculated Width (or Diam.)',        'm')}
            ${_out('tdn_r_CalcLr',  'Calculated Length (rect.)',          'm')}
            ${_out('tdn_r_ActVolR', 'Actual Liquid Volume / Tank',        'm³',  true)}
            ${_out('tdn_r_tRear',   'Reaeration Detention Time, t',       'min', true)}
          </div>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Tank Dimension Equations</div></div><div class="card-body mbr-ref">
          <div class="eq-blk">
            <div class="eq-t">Solids Production Rate:</div>
            <span class="eq-l">P<sub>X,TSS</sub></span>
            <span class="eq-r">[Q<sub>o</sub>·Y<sub>D</sub>·S<sub>dose</sub>/(1+k<sub>dD</sub>·SRT)/0.85] + [f<sub>d</sub>·k<sub>dD</sub>·SRT·Q<sub>o</sub>·Y<sub>D</sub>·S<sub>dose</sub>/(1+k<sub>dD</sub>·SRT)/0.85] + Q<sub>o</sub>·TSS<sub>o</sub> <small>kg/d</small></span>
            <div class="eq-where">VSS/TSS assumed = 0.85 · S<sub>dose</sub> = methanol dose as bCOD (mg/L)</div>
          </div>
          <div class="eq-blk">
            <div class="eq-t">Minimum Anoxic Volume:</div>
            <span class="eq-l">Van</span>
            <span class="eq-r">= P<sub>X,TSS</sub> × SRT / MLSS <small>m³</small></span>
          </div>
          <div class="eq-blk">
            <div class="eq-t">For Rectangular Tank:</div>
            <span class="eq-l">W</span><span class="eq-r">= √[V<sub>tank</sub> / (L<sub>d</sub> × L:W)] <small>m</small></span><br>
            <span class="eq-l">L</span><span class="eq-r">= V<sub>tank</sub> / (L<sub>d</sub> × W) <small>m</small></span>
          </div>
          <div class="eq-blk">
            <div class="eq-t">For Cylindrical Tank:</div>
            <span class="eq-l">D</span><span class="eq-r">= √[V<sub>tank</sub> × 4 / (π × L<sub>d</sub>)] <small>m</small></span>
          </div>
          <div class="eq-blk">
            <span class="eq-l">Wall Height</span><span class="eq-r">= Liquid Depth + Freeboard <small>m</small></span>
          </div>
          <div class="eq-blk">
            <div class="eq-t">Reaeration Volume:</div>
            <span class="eq-l">V<sub>reaer</sub></span><span class="eq-r">= Q<sub>o</sub> × t<sub>reaer</sub> / (24 × 60) <small>m³</small></span>
          </div>
          <div class="eq-blk">
            <span class="eq-l">Anoxic t</span><span class="eq-r">= V<sub>actual</sub> × N<sub>tanks</sub> × 24 / Q<sub>o</sub> <small>hr</small></span>
          </div>
          <div class="eq-blk">
            <span class="eq-l">Reaer. t</span><span class="eq-r">= V<sub>reaer,actual</sub> × N<sub>tanks</sub> × 1440 / Q<sub>o</sub> <small>min</small></span>
          </div>
          <div class="eq-blk">
            <span class="eq-l">Mixing Power</span><span class="eq-r">= V<sub>actual</sub> × N<sub>tanks</sub> × Mix<sub>energy</sub> / 1000 <small>kW</small></span>
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">📚 Typical Design Loading Rates</div><div class="card-hd-s">Metcalf &amp; Eddy 4th Ed. — Post-Anoxic Tertiary Denitrification</div></div><div class="card-body">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);"><span style="color:#94a3b8; font-size:11px; text-transform:uppercase;">Parameter</span><span style="color:#94a3b8; font-size:11px; text-transform:uppercase;">Range &nbsp;&rarr;&nbsp; Typical</span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px;"><span style="color:#cbd5e1; font-size:13px;">SRT</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">5–20 d &rarr; <b>10 d</b></span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px; background:rgba(255,255,255,0.02);"><span style="color:#cbd5e1; font-size:13px;">MLSS</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">1000–4000 mg/L &rarr; <b>2000 mg/L</b></span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px;"><span style="color:#cbd5e1; font-size:13px;">Liquid Depth</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">3–8 m &rarr; <b>5 m</b></span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px; background:rgba(255,255,255,0.02);"><span style="color:#cbd5e1; font-size:13px;">Anoxic Det. Time</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">0.5–8 hr &rarr; <b>1–3 hr</b></span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px;"><span style="color:#cbd5e1; font-size:13px;">Reaeration Det. Time</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">10–30 min &rarr; <b>15 min</b></span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px; background:rgba(255,255,255,0.02);"><span style="color:#cbd5e1; font-size:13px;">Mixing Energy (anoxic)</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">8–15 kW/10³m³ &rarr; <b>10 kW/10³m³</b></span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px;"><span style="color:#cbd5e1; font-size:13px;">Y<sub>D</sub> @ 10–20°C</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">0.17–0.18 &rarr; <b>g VSS/g bCOD</b></span></div>
            <div style="display:flex; justify-content:space-between; padding:6px 8px; background:rgba(255,255,255,0.02);"><span style="color:#cbd5e1; font-size:13px;">k<sub>dD</sub> @ 10–20°C</span><span style="color:#38bdf8; font-family:var(--fm); font-size:13px;">0.04–0.05 &rarr; <b>g VSS/d/g VSS</b></span></div>
          </div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ══════════ TAB 4: SLUDGE FLOWS ══════════ -->
  <div class="tp" id="tdn-t4">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Step 5 — Sludge Recycle Rate &amp; Wasting Rate</div><div class="card-hd-s">Activated sludge recirculation and wasting calculations</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('tdn_r_Qr', 'A.S. Recycle Rate, Qr', 'm³/d', true)}
            ${_out('tdn_r_Qw', 'Waste A.S. Rate, Qw',   'm³/d', true)}
          </div>
        </div></div>
      </div>
      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Sludge Flow Equations</div></div><div class="card-body mbr-ref">
          <div class="eq-blk">
            <div class="eq-t">Recycle Rate (M&amp;E 4th Ed. Eq. 8-xx):</div>
            <span class="eq-l">Qr</span>
            <span class="eq-r">= Q<sub>o</sub> × (MLSS − TSS<sub>o</sub>) / (TSS<sub>w</sub> − MLSS) <small>m³/d</small></span>
            <div class="eq-where">MLSS = design mixed liquor · TSS<sub>w</sub> = WAS concentration</div>
          </div>
          <div class="eq-blk">
            <div class="eq-t">Wasting Rate:</div>
            <span class="eq-l">Qw</span>
            <span class="eq-r">= [N<sub>tanks</sub> × V<sub>actual</sub> × MLSS / SRT − Q<sub>o</sub> × TSS<sub>e</sub>] / (TSS<sub>w</sub> − TSS<sub>e</sub>) <small>m³/d</small></span>
            <div class="eq-where">V<sub>actual</sub> = actual tank liquid volume per tank (m³)</div>
          </div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ══════════ TAB REF: EQUATIONS REFERENCE ══════════ -->
  <div class="tp" id="tdn-tRef">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Complete Design Equations — CMAS Tertiary Anoxic Denitrification</div><div class="card-hd-s">M&amp;E 4th Ed. Tchobanoglous, Burton, Stensel (2003) · S.I. Units</div></div><div class="card-body mbr-ref">
      <div class="eq-blk"><div class="eq-t">Step 1 — Kinetic coefficient interpolation at Tww (linear between 10°C and 20°C):</div>
        <span class="eq-l">X<sub>Tww</sub></span><span class="eq-r">= X<sub>10</sub> + (X<sub>20</sub> − X<sub>10</sub>) × (T<sub>ww</sub> − 10) / 10</span>
        <div class="eq-where">Applied to: Y<sub>D</sub>, K<sub>sD</sub>, μ<sub>mD</sub>, k<sub>dD</sub>, k</div>
      </div>
      <div class="eq-blk"><div class="eq-t">Step 2 — Residual methanol substrate concentration (Monod kinetics):</div>
        <span class="eq-l">S</span><span class="eq-r">= K<sub>sD</sub> × [1 + k<sub>dD</sub>·SRT] / [SRT × (Y<sub>D</sub>·k − k<sub>dD</sub>) − 1]  <small>mg/L bCOD</small></span>
      </div>
      <div class="eq-blk"><span class="eq-l">Yn</span><span class="eq-r">= Y<sub>D</sub> / (1 + k<sub>dD</sub>·SRT)  <small>g VSS/g bCOD</small></span></div>
      <div class="eq-blk"><span class="eq-l">bCOD/NO3-N</span><span class="eq-r">= 2.86 / (1 − 1.43·Yn)  <small>g/g</small></span></div>
      <div class="eq-blk"><span class="eq-l">MethDose<sub>COD</sub></span><span class="eq-r">= (bCOD/NO3-N) × (NO3-No − Ne) + S  <small>mg/L COD</small></span></div>
      <div class="eq-blk"><span class="eq-l">MethDose</span><span class="eq-r">= MethDose<sub>COD</sub> / 1.5  <small>mg/L CH₃OH</small></span></div>
      <div class="eq-blk"><span class="eq-l">Daily Methanol</span><span class="eq-r">= MethDose × Q<sub>o</sub> / 1000  <small>kg/d</small></span></div>
      <div class="eq-blk"><div class="eq-t">Step 3 — Solids Production (P<sub>X,TSS</sub>) and Anoxic Tank Volume:</div>
        <span class="eq-l">P<sub>X,TSS</sub></span><span class="eq-r">= [Q<sub>o</sub>·Y<sub>D</sub>·S<sub>dose</sub>/(1+k<sub>dD</sub>·SRT)/0.85] + [f<sub>d</sub>·k<sub>dD</sub>·SRT·Q<sub>o</sub>·Y<sub>D</sub>·S<sub>dose</sub>/(1+k<sub>dD</sub>·SRT)/0.85] + Q<sub>o</sub>·TSS<sub>o</sub>  <small>kg/d</small></span>
        <div class="eq-where">0.85 = VSS/TSS ratio · S<sub>dose</sub> = MethDose<sub>COD</sub> (mg/L)</div>
      </div>
      <div class="eq-blk"><span class="eq-l">Van</span><span class="eq-r">= P<sub>X,TSS</sub> × SRT / MLSS  <small>m³</small></span></div>
      <div class="eq-blk"><div class="eq-t">Step 4 — Reaeration:</div>
        <span class="eq-l">V<sub>reaer</sub></span><span class="eq-r">= Q<sub>o</sub> × t<sub>reaer</sub> / (24 × 60)  <small>m³</small></span>
      </div>
      <div class="eq-blk"><div class="eq-t">Step 5 — Sludge flows:</div>
        <span class="eq-l">Qr</span><span class="eq-r">= Q<sub>o</sub> × (MLSS − TSS<sub>o</sub>) / (TSS<sub>w</sub> − MLSS)  <small>m³/d</small></span>
      </div>
      <div class="eq-blk"><span class="eq-l">Qw</span><span class="eq-r">= [N<sub>t</sub> × V<sub>actual</sub> × MLSS / SRT − Q<sub>o</sub> × TSS<sub>e</sub>] / (TSS<sub>w</sub> − TSS<sub>e</sub>)  <small>m³/d</small></span></div>
      <div class="alert al-i mt">Reference: Metcalf &amp; Eddy, Inc. (revised by Tchobanoglous, G., Burton, F.L., and Stensel, D.H.), <em>Wastewater Engineering: Treatment and Reuse</em>, 4th Ed., McGraw Hill, 2003. Calculations follow Example 8-9.</div>
    </div></div>
  </div>

  <!-- ══════════ TAB DRW: PROCESS DIAGRAM ══════════ -->
  <div class="tp" id="tdn-tDrw">
    <div class="dwg-toolbar">
      <span>CMAS TERTIARY DENITRIFICATION — PROCESS SCHEMATIC (NTS)</span>
      <button class="btn btn-xs btn-dk" onclick="dlSVG('tdn-svg','cmas-tertiary-denitrification')">⬇ Export SVG</button>
    </div>
    <div class="dwg-wrap">
      <svg id="tdn-svg" viewBox="0 0 1100 540" xmlns="http://www.w3.org/2000/svg">
        <text x="550" y="270" text-anchor="middle" font-size="14" fill="#aaa" font-family="Inter, sans-serif">Calculate to generate process schematic</text>
      </svg>
    </div>
    <div class="dwg-legend">
      <div class="leg-i"><div class="leg-sw" style="background:#3a9bd4"></div>Process Flow</div>
      <div class="leg-i"><div class="leg-sw" style="background:#1a7a3c"></div>Anoxic Basin</div>
      <div class="leg-i"><div class="leg-sw" style="background:#e8760a"></div>Reaeration Basin</div>
      <div class="leg-i"><div class="leg-sw" style="background:#9b59b6"></div>Methanol Dose</div>
      <div class="leg-i"><div class="leg-sw" style="background:#8b7355"></div>RAS / WAS Sludge</div>
    </div>
  </div>

  <!-- ══════════ TAB CHK: DESIGN CHECKS ══════════ -->
  <div class="tp" id="tdn-tChk">
    <div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div><div class="card-hd-s">Validated against M&amp;E 4th Ed. typical design ranges</div></div><div class="card-body"><div id="tdn_r_checks"><div class="alert al-i">Calculate to see design checks.</div></div></div></div>
  </div>

</div>`;
}
