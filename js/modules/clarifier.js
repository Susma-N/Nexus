/* ══════════════════════════════════════════════════════════════════════════════
   WASTE WATER CLARIFIER DESIGN — Aapaavani NEXUS
   Combined Primary + Secondary Clarifier Design Calculations
   Exact implementation of Wastewater Clarifier Design_SI units workbook
   ══════════════════════════════════════════════════════════════════════════════ */

const ClarEngine = {

  /* ═══ READ ALL DOM INPUTS ═══ */
  read() {
    const v = id => { const e = document.getElementById(id); return e ? parseFloat(e.value) || 0 : 0; };
    return {
      /* Primary Clarifier */
      p_Q: v('cl_p_Q'), p_R: v('cl_p_R'), p_SORa: v('cl_p_SORa'),
      p_SORp: v('cl_p_SORp'), p_PF: v('cl_p_PF'), p_N: v('cl_p_N'),
      p_WOR: v('cl_p_WOR'), p_LW: v('cl_p_LW'),
      
      /* Secondary Clarifier */
      s_Q: v('cl_s_Q'), s_R: v('cl_s_R'), s_X: v('cl_s_X'),
      s_SORa: v('cl_s_SORa'), s_SORp: v('cl_s_SORp'),
      s_SLRa: v('cl_s_SLRa'), s_SLRp: v('cl_s_SLRp'),
      s_PF: v('cl_s_PF'), s_N: v('cl_s_N'),
      s_WOR: v('cl_s_WOR'), s_LW: v('cl_s_LW'),
    };
  },

  /* ═══ PRIMARY CLARIFIER CALCULATIONS ═══ */
  calcPrimary(I) {
    const Q = I.p_Q, R = I.p_R, SORa = I.p_SORa, SORp = I.p_SORp;
    const PF = I.p_PF, N = I.p_N, WOR = I.p_WOR, LW = I.p_LW;

    // Flow Rates
    const Qr = R * Q;
    const Qp = Q * PF;

    // Area based on SOR
    const A1 = SORa > 0 ? Q / SORa : 0;
    const A2 = SORp > 0 ? Qp / SORp : 0;
    const A_gov = Math.max(A1, A2);

    // Circular Clarifier
    const D = N > 0 ? Math.sqrt((A_gov / N) * 4 / Math.PI) : 0;
    
    // Circular Weir
    const min_D_single = (N > 0 && WOR > 0) ? (Q / N) / (Math.PI * WOR) : 0;
    const min_D_double = (N > 0 && WOR > 0) ? (Q / (2 * N)) / (Math.PI * WOR) : 0;

    // Rectangular Clarifier
    const W = (N > 0 && LW > 0) ? Math.sqrt((A_gov / N) / LW) : 0;
    const L = W > 0 ? (A_gov / LW) / W : 0; // Exactly matching =(H19/C36)/H35

    // Rectangular Weir
    const channels = (N > 0 && WOR > 0 && W > 0) ? (Q / N) / (WOR * W) : 0;

    return { Qr, Qp, A1, A2, A_gov, D, min_D_single, min_D_double, W, L, channels };
  },

  /* ═══ SECONDARY CLARIFIER CALCULATIONS ═══ */
  calcSecondary(I) {
    const Q = I.s_Q, R = I.s_R, X = I.s_X, SORa = I.s_SORa, SORp = I.s_SORp;
    const SLRa = I.s_SLRa, SLRp = I.s_SLRp, PF = I.s_PF, N = I.s_N;
    const WOR = I.s_WOR, LW = I.s_LW;

    // Flow Rates
    const Qr = R * Q;
    const Qp = Q * PF;

    // Area based on SOR
    const A1 = SORa > 0 ? Q / SORa : 0;
    const A2 = SORp > 0 ? Qp / SORp : 0;
    const A_gov_SOR = Math.max(A1, A2);

    // Area based on SLR
    const A3 = SLRa > 0 ? (Q + Qr) * 0.001 * X / (24 * SLRa) : 0;
    const A4 = SLRp > 0 ? (Q + Qr) * 0.001 * X * PF / (24 * SLRp) : 0;
    const A_gov_SLR = Math.max(A3, A4);

    // Final Area
    const A_gov = Math.max(A_gov_SOR, A_gov_SLR);

    // Circular Clarifier
    const D = N > 0 ? Math.sqrt((A_gov / N) * 4 / Math.PI) : 0;
    
    // Circular Weir
    const min_D_single = (N > 0 && WOR > 0) ? (Q / N) / (Math.PI * WOR) : 0;
    const min_D_double = (N > 0 && WOR > 0) ? (Q / (2 * N)) / (Math.PI * WOR) : 0;

    // Rectangular Clarifier
    const W = (N > 0 && LW > 0) ? Math.sqrt((A_gov / N) / LW) : 0;
    const L = W > 0 ? (A_gov / LW) / W : 0;

    // Rectangular Weir
    const channels = (N > 0 && WOR > 0 && W > 0) ? (Q / N) / (WOR * W) : 0;

    return { Qr, Qp, A1, A2, A_gov_SOR, A3, A4, A_gov_SLR, A_gov, D, min_D_single, min_D_double, W, L, channels };
  },

  /* ═══ MASTER CALCULATION ═══ */
  runCalcs() {
    try {
      const I = this.read();
      const P = this.calcPrimary(I);
      const S = this.calcSecondary(I);
      this.render(I, P, S);
    } catch(err) { console.error('ClarEngine Error', err); }
  },

  /* ═══ RENDER RESULTS ═══ */
  render(I, P, S) {
    const sv = (id, val) => {
      const e = document.getElementById(id);
      if (!e || e.textContent === String(val)) return;
      const isKpi = e.closest('.mbr-kpi-val');
      const cleanVal = String(val).replace(/,/g, '').replace(/%/g, '');
      const numVal = parseFloat(cleanVal);
      if (isKpi && !isNaN(numVal) && window.animateValue && e.textContent !== '—') {
        const cur = parseFloat(e.textContent.replace(/,/g, '').replace(/%/g, '')) || 0;
        const decimals = String(cleanVal).includes('.') ? String(cleanVal).split('.')[1].length : 0;
        if (String(val).includes('%')) e.setAttribute('data-suffix', '%');
        else e.removeAttribute('data-suffix');
        window.animateValue(e, cur, numVal, 800, decimals);
      } else {
        e.textContent = val;
      }
      const cell = e.closest('.mbr-res-cell') || e.closest('.mbr-kpi');
      if (cell) { cell.classList.remove('mbr-flash'); void cell.offsetWidth; cell.classList.add('mbr-flash'); }
    };
    const n = (v, d) => (typeof v === 'number' && isFinite(v)) ? (d !== undefined ? v.toFixed(d) : fi(Math.round(v))) : '—';

    /* ── KPIs ── */
    sv('kpi_cl_pA', n(P.A_gov, 0));
    sv('kpi_cl_pD', n(P.D, 1));
    sv('kpi_cl_sA', n(S.A_gov, 0));
    sv('kpi_cl_sD', n(S.D, 1));
    sv('kpi_cl_pQp', n(P.Qp, 0));
    sv('kpi_cl_pQr', n(P.Qr, 0));
    sv('kpi_cl_sQp', n(S.Qp, 0));
    sv('kpi_cl_sQr', n(S.Qr, 0));

    /* ── Primary Results ── */
    sv('r_p_Qr', n(P.Qr, 1));
    sv('r_p_Qp', n(P.Qp, 1));
    sv('r_p_A1', n(P.A1, 1));
    sv('r_p_A2', n(P.A2, 1));
    sv('r_p_Agov', n(P.A_gov, 1));
    
    sv('r_p_D', n(P.D, 1));
    sv('r_p_w_single', n(P.min_D_single, 2));
    sv('r_p_w_double', n(P.min_D_double, 2));
    
    sv('r_p_W', n(P.W, 1));
    sv('r_p_L', n(P.L, 1));
    sv('r_p_chan', n(P.channels, 2));

    /* ── Secondary Results ── */
    sv('r_s_Qr', n(S.Qr, 1));
    sv('r_s_Qp', n(S.Qp, 1));
    sv('r_s_A1', n(S.A1, 1));
    sv('r_s_A2', n(S.A2, 1));
    sv('r_s_Agov_SOR', n(S.A_gov_SOR, 1));
    sv('r_s_A3', n(S.A3, 1));
    sv('r_s_A4', n(S.A4, 1));
    sv('r_s_Agov_SLR', n(S.A_gov_SLR, 1));
    sv('r_s_Agov', n(S.A_gov, 1));

    sv('r_s_D', n(S.D, 1));
    sv('r_s_w_single', n(S.min_D_single, 2));
    sv('r_s_w_double', n(S.min_D_double, 2));
    
    sv('r_s_W', n(S.W, 1));
    sv('r_s_L', n(S.L, 1));
    sv('r_s_chan', n(S.channels, 2));

    /* ── Design Checks ── */
    const chk = document.getElementById('cl-checks');
    if (chk) {
      chk.innerHTML = `
        <div class="fg-t" style="margin-bottom:12px; color:var(--primary); font-size:11px; letter-spacing:1px; text-transform:uppercase;">Primary Clarifier Checks</div>
        <div class="ck-list">
          ${ck(I.p_N >= 2, 'Minimum 2 units', I.p_N + ' units')}
          ${ck(I.p_SORa >= 32 && I.p_SORa <= 48, 'SOR ave 32–48 m³/d/m²', n(I.p_SORa,1) + ' m³/d/m²')}
          ${ck(I.p_SORp >= 80 && I.p_SORp <= 120, 'SOR peak 80–120 m³/d/m²', n(I.p_SORp,1) + ' m³/d/m²')}
        </div>
        <div class="fg-t" style="margin-top:24px; margin-bottom:12px; color:var(--primary); font-size:11px; letter-spacing:1px; text-transform:uppercase;">Secondary Clarifier Checks</div>
        <div class="ck-list">
          ${ck(I.s_N >= 2, 'Minimum 2 units', I.s_N + ' units')}
          ${ck(I.s_SORa >= 16 && I.s_SORa <= 28, 'SOR ave 16–28 m³/d/m²', n(I.s_SORa,1) + ' m³/d/m²')}
          ${ck(I.s_SORp >= 33 && I.s_SORp <= 56, 'SOR peak 33–56 m³/d/m²', n(I.s_SORp,1) + ' m³/d/m²')}
          ${ck(I.s_SLRa <= 6, 'SLR ave ≤ 6 kg/hr/m²', n(I.s_SLRa,2) + ' kg/hr/m²')}
        </div>
      `;
    }

    /* ── SVG Diagrams ── */
    this.drawPrimary(I, P);
    this.drawSecondary(I, S);
  },

  /* ═══ PRIMARY CLARIFIER SVG ═══ */
  drawPrimary(I, P) {
    const svg = document.getElementById('cl-svg-p');
    if (!svg) return;
    const W = 1100, H = 520;
    const cX = 320, cY = 170;
    const r = Math.min(Math.max(P.D * 18, 90), 160);
    const SWD = 3.5; // Fixed assumption for drawing since not in input
    let s = `<defs>${mkArr('clap','#0284c7')}${mkArr('clapg','#059669')}${mkArr('claps','#8b5cf6')}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`;
    s += `<text x="14" y="24" font-size="11.5" font-weight="800" fill="#0f172a" font-family="Space Grotesk,Inter,sans-serif">PRIMARY CLARIFIER — LONGITUDINAL SECTION (CIRCULAR)</text>`;
    s += `<text x="${W-14}" y="24" text-anchor="end" font-size="9.5" fill="#64748b" font-family="Inter,sans-serif">Ø=${f2(P.D,2)} m  |  ${I.p_N} units</text>`;
    s += `<line x1="14" y1="32" x2="${W-14}" y2="32" stroke="#e2e8f0" stroke-width="1"/>`;

    // Tank shell — ellipse top + walls
    s += `<ellipse cx="${cX}" cy="${cY}" rx="${r}" ry="${r*0.2}" fill="none" stroke="#0284c7" stroke-width="2.5"/>`;
    s += `<line x1="${cX-r}" y1="${cY}" x2="${cX-r}" y2="${cY+SWD*28}" stroke="#0284c7" stroke-width="2.5"/>`;
    s += `<line x1="${cX+r}" y1="${cY}" x2="${cX+r}" y2="${cY+SWD*28}" stroke="#0284c7" stroke-width="2.5"/>`;
    s += `<path d="M${cX-r} ${cY} Q${cX} ${cY+r*0.2} ${cX+r} ${cY} L${cX+r} ${cY+SWD*28} L${cX-r} ${cY+SWD*28} Z" fill="#0284c7" opacity=".06"/>`;

    const hB = cY + SWD * 28;

    // Sludge hopper
    s += `<path d="M${cX-r+4} ${hB} L${cX-20} ${hB+44} L${cX+20} ${hB+44} L${cX+r-4} ${hB} Z" fill="#92400e" opacity=".15" stroke="#92400e" stroke-width="1.5"/>`;
    s += `<text x="${cX}" y="${hB+30}" text-anchor="middle" font-size="9" fill="#78350f" font-family="Inter,sans-serif" font-weight="700">Sludge Hopper</text>`;

    // Inlet baffle
    s += `<rect x="${cX-28}" y="${cY-r*0.1+6}" width="56" height="${SWD*28*0.45}" rx="4" fill="#fefce8" stroke="#eab308" stroke-width="2"/>`;
    s += `<text x="${cX}" y="${cY-r*0.1+20}" text-anchor="middle" font-size="9" fill="#a16207" font-family="Inter,sans-serif" font-weight="700">Inlet Baffle</text>`;

    // Influent arrow
    s += `<line x1="30" y1="${cY+8}" x2="${cX-28}" y2="${cY+8}" stroke="#0284c7" stroke-width="2.5" marker-end="url(#clap)"/>`;
    s += `<text x="34" y="${cY}" font-size="9.5" font-weight="700" fill="#0284c7" font-family="Inter,sans-serif">Raw Wastewater In</text>`;
    s += `<text x="34" y="${cY+22}" font-size="8.5" fill="#64748b" font-family="Inter,sans-serif">Q = ${fi(I.p_Q)} m³/d</text>`;

    // Scum baffle + effluent weir
    s += `<line x1="${cX+r*0.75}" y1="${cY-12}" x2="${cX+r*0.75}" y2="${cY+24}" stroke="#0f172a" stroke-width="3"/>`;
    s += `<text x="${cX+r*0.75}" y="${cY-16}" text-anchor="middle" font-size="8" fill="#475569" font-family="Inter,sans-serif">Scum Baffle</text>`;
    s += `<line x1="${cX+r*0.85}" y1="${cY+4}" x2="${cX+r*0.85}" y2="${cY+20}" stroke="#059669" stroke-width="3"/>`;
    s += `<text x="${cX+r*0.85}" y="${cY-4}" text-anchor="middle" font-size="8" fill="#059669" font-family="Inter,sans-serif">Weir</text>`;

    // Effluent out
    s += `<line x1="${cX+r*0.85}" y1="${cY+12}" x2="${W-80}" y2="${cY+12}" stroke="#059669" stroke-width="2" marker-end="url(#clapg)"/>`;
    s += `<text x="${W-75}" y="${cY+8}" font-size="9.5" font-weight="700" fill="#059669" font-family="Inter,sans-serif">Effluent</text>`;

    // Sludge withdrawal
    s += `<line x1="${cX}" y1="${hB+44}" x2="${cX}" y2="${hB+80}" stroke="#92400e" stroke-width="2.5" marker-end="url(#clap)"/>`;
    s += `<text x="${cX+6}" y="${hB+68}" font-size="9" fill="#78350f" font-family="Inter,sans-serif" font-weight="700">Primary Sludge</text>`;

    // Scraper
    s += `<line x1="${cX}" y1="${hB}" x2="${cX+r-6}" y2="${hB-8}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8 4"/>`;
    s += `<text x="${cX+r*0.4}" y="${hB-13}" font-size="8.5" fill="#94a3b8" font-family="Inter,sans-serif">Rotating Scraper</text>`;

    // Dimension lines
    s += DL(cX-r, cY-r*0.2-26, cX+r, cY-r*0.2-26, 'Ø = '+f2(P.D,2)+' m (each of '+I.p_N+')', true, '#059669');

    // Title block
    s += TB(W, H, 'Primary Clarifier — Section View', 'M&E 5th Ed. Table 5-15', 'NTS', '1 of 2');

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = s;
  },

  /* ═══ SECONDARY CLARIFIER SVG ═══ */
  drawSecondary(I, S) {
    const svg = document.getElementById('cl-svg-s');
    if (!svg) return;
    const W = 1100, H = 520;
    const cX = 320, cY = 170;
    const r = Math.min(Math.max(S.D * 18, 90), 160);
    const SWD = 4.0; // Fixed assumption for drawing since not in input
    let s = `<defs>${mkArr('clas','#0284c7')}${mkArr('clasg','#059669')}${mkArr('clasb','#8b5cf6')}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`;
    s += `<text x="14" y="24" font-size="11.5" font-weight="800" fill="#0f172a" font-family="Space Grotesk,Inter,sans-serif">SECONDARY CLARIFIER — LONGITUDINAL SECTION (CIRCULAR)</text>`;
    s += `<text x="${W-14}" y="24" text-anchor="end" font-size="9.5" fill="#64748b" font-family="Inter,sans-serif">Ø=${f2(S.D,2)} m  |  ${I.s_N} units</text>`;
    s += `<line x1="14" y1="32" x2="${W-14}" y2="32" stroke="#e2e8f0" stroke-width="1"/>`;

    // Water level line
    s += `<line x1="${cX-r+8}" y1="${cY}" x2="${cX+r-8}" y2="${cY}" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="8 4" opacity=".55"/>`;

    // Tank shell
    s += `<ellipse cx="${cX}" cy="${cY}" rx="${r}" ry="${r*0.2}" fill="none" stroke="#0284c7" stroke-width="2.5"/>`;
    s += `<line x1="${cX-r}" y1="${cY}" x2="${cX-r}" y2="${cY+SWD*28}" stroke="#0284c7" stroke-width="2.5"/>`;
    s += `<line x1="${cX+r}" y1="${cY}" x2="${cX+r}" y2="${cY+SWD*28}" stroke="#0284c7" stroke-width="2.5"/>`;
    s += `<path d="M${cX-r} ${cY} Q${cX} ${cY+r*0.2} ${cX+r} ${cY} L${cX+r} ${cY+SWD*28} L${cX-r} ${cY+SWD*28} Z" fill="#0284c7" opacity=".06"/>`;

    const hB = cY + SWD * 28;

    // Sludge blanket
    s += `<path d="M${cX-r+4} ${hB} L${cX-22} ${hB+48} L${cX+22} ${hB+48} L${cX+r-4} ${hB} Z" fill="#92400e" opacity=".15" stroke="#92400e" stroke-width="1.5"/>`;
    s += `<text x="${cX}" y="${hB+33}" text-anchor="middle" font-size="9" fill="#78350f" font-family="Inter,sans-serif" font-weight="700">Sludge Blanket</text>`;

    // Feed well
    s += `<rect x="${cX-22}" y="${cY-r*0.12+5}" width="44" height="${SWD*28*0.52}" rx="4" fill="#fefce8" stroke="#eab308" stroke-width="2"/>`;
    s += `<text x="${cX}" y="${cY-r*0.12+19}" text-anchor="middle" font-size="9" fill="#a16207" font-family="Inter,sans-serif" font-weight="700">Feed Well</text>`;

    // From aeration (influent)
    s += `<line x1="30" y1="${cY+8}" x2="${cX-22}" y2="${cY+8}" stroke="#0284c7" stroke-width="2.5" marker-end="url(#clas)"/>`;
    s += `<text x="34" y="${cY}" font-size="9.5" font-weight="700" fill="#0284c7" font-family="Inter,sans-serif">From Aeration Basin</text>`;

    // Scum baffle + effluent weir
    s += `<line x1="${cX+r*0.77}" y1="${cY-14}" x2="${cX+r*0.77}" y2="${cY+24}" stroke="#0f172a" stroke-width="3"/>`;
    s += `<line x1="${cX+r*0.84}" y1="${cY+4}" x2="${cX+r*0.84}" y2="${cY+20}" stroke="#059669" stroke-width="3"/>`;
    s += `<line x1="${cX+r*0.84}" y1="${cY+12}" x2="${W-100}" y2="${cY+12}" stroke="#059669" stroke-width="2" marker-end="url(#clasg)"/>`;
    s += `<text x="${W-95}" y="${cY+8}" font-size="9.5" font-weight="700" fill="#059669" font-family="Inter,sans-serif">Effluent</text>`;

    // RAS
    s += `<line x1="${cX}" y1="${hB+48}" x2="${cX}" y2="${hB+84}" stroke="#8b5cf6" stroke-width="2.5" marker-end="url(#clasb)"/>`;
    s += `<text x="${cX+6}" y="${hB+72}" font-size="9" fill="#6d28d9" font-family="Inter,sans-serif" font-weight="700">RAS to Aeration</text>`;

    // Scraper
    s += `<line x1="${cX}" y1="${hB}" x2="${cX+r-6}" y2="${hB-8}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8 4"/>`;
    s += `<text x="${cX+r*0.4}" y="${hB-13}" font-size="8.5" fill="#94a3b8" font-family="Inter,sans-serif">Rotating Scraper</text>`;

    // WAS
    s += `<line x1="${cX-r*0.4}" y1="${hB+48}" x2="${cX-r*0.4}" y2="${hB+80}" stroke="#92400e" stroke-width="1.8" stroke-dasharray="5 3" marker-end="url(#clas)"/>`;
    s += `<text x="${cX-r*0.4+5}" y="${hB+70}" font-size="8.5" fill="#64748b" font-family="Inter,sans-serif">WAS →</text>`;

    // Dimension lines
    s += DL(cX-r, cY-r*0.2-26, cX+r, cY-r*0.2-26, 'Ø = '+f2(S.D,2)+' m (each of '+I.s_N+')', true, '#059669');

    // Title block
    s += TB(W, H, 'Secondary Clarifier — Section View', 'M&E 5th Ed. Section 8-5', 'NTS', '2 of 2');

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = s;
  },

  /* ═══ INITIALIZE MODULE ═══ */
  init() {
    setTimeout(() => {
      this.runCalcs();
      const mod = document.getElementById('cl-module');
      if (mod) {
        mod.addEventListener('input', () => this.runCalcs());
        mod.addEventListener('change', () => this.runCalcs());
      }
    }, 100);
  }
};

/* ══════════════════════════════════════════════════════════════════════════════
   HTML BUILDER — buildClarifier()
   ══════════════════════════════════════════════════════════════════════════════ */
function buildClarifier() {

  /* ── Helper shorthands ── */
  const _cl_kpi = (icon, label, id, unit, sub) =>
    `<div class="mbr-kpi"><div class="mbr-kpi-icon">${icon}</div><div class="mbr-kpi-val" id="${id}">—</div><div class="mbr-kpi-unit">${unit}</div><div class="mbr-kpi-label">${label}</div>${sub ? `<div class="mbr-kpi-sub">${sub}</div>` : ''}</div>`;

  const _cl_inp = (id, label, val, unit, step) =>
    `<div class="f mbr-in"><label>${label}</label><div class="fuw"><input type="number" id="${id}" value="${val}"${step ? ' step="'+step+'"' : ''}>${unit ? '<div class="fu">'+unit+'</div>' : ''}</div></div>`;

  const _cl_out = (id, label, unit, highlight) =>
    `<div class="mbr-res-cell${highlight ? ' mbr-res-hl' : ''}"><div class="mbr-res-label">${label}</div><div class="mbr-res-val"><span id="${id}">—</span>${unit ? ' <small>'+unit+'</small>' : ''}</div></div>`;

  return `<div class="mwrap" id="cl-module">
  <div class="mhdr"><div class="mh-left"><div class="mt-title">Waste Water Clarifier Design<div class="mt-badge">CLARIFIER</div></div>
  <div class="mt-bread">Primary + Secondary Clarifier Design Calculations — Exact Spreadsheet Implementation</div></div></div>

  <!-- ═══ KPI HIGHLIGHT CARDS ═══ -->
  <div class="mbr-kpi-row">
    ${_cl_kpi('📐','Prim. Area','kpi_cl_pA','m²','Area needed')}
    ${_cl_kpi('⭕','Prim. Diameter','kpi_cl_pD','m','Circular tank')}
    ${_cl_kpi('📐','Sec. Area','kpi_cl_sA','m²','Area needed')}
    ${_cl_kpi('⭕','Sec. Diameter','kpi_cl_sD','m','Circular tank')}
    ${_cl_kpi('📈','Prim. Peak Flow','kpi_cl_pQp','m³/d','Peak Hourly')}
    ${_cl_kpi('♻️','Prim. Recycle','kpi_cl_pQr','m³/d','RAS Rate')}
    ${_cl_kpi('📈','Sec. Peak Flow','kpi_cl_sQp','m³/d','Peak Hourly')}
    ${_cl_kpi('♻️','Sec. Recycle','kpi_cl_sQr','m³/d','RAS Rate')}
  </div>

  <!-- ═══ TAB BAR ═══ -->
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'cl-t1')">1. Primary Clarifier</div>
    <div class="tab" onclick="stab(this,'cl-t2')">2. Secondary Clarifier</div>
    <div class="tab" onclick="stab(this,'cl-t3')">3. Design Criteria</div>
    <div class="tab" onclick="stab(this,'cl-t4')">4. Engineering Diagrams</div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 1: PRIMARY CLARIFIER DESIGN                                     -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp active" id="cl-t1">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Inputs — Primary Clarifier</div><div class="card-hd-s">Enter values in blue boxes in spreadsheet</div></div><div class="card-body">
          <div class="g3">
            ${_cl_inp('cl_p_Q', 'Influent Flow, Q', G.Q || 10600.0, 'm³/d')}
            ${_cl_inp('cl_p_R', 'RAS Ratio, R', 0.3, '', 0.1)}
            ${_cl_inp('cl_p_SORa', 'Avg. SOR', 40.0, 'm³/d/m²', 1)}
            ${_cl_inp('cl_p_SORp', 'Peak SOR', 100.0, 'm³/d/m²', 1)}
            ${_cl_inp('cl_p_PF', 'Peaking Factor, PF', G.PF || 2.25, '', 0.1)}
            ${_cl_inp('cl_p_N', 'No. Clarifiers, N', 2.0, '', 1)}
            ${_cl_inp('cl_p_WOR', 'Max WOR', 200.0, 'm³/hr/m', 10)}
            ${_cl_inp('cl_p_LW', 'L/W Ratio', 4.0, '', 0.5)}
          </div>
        </div></div>
      </div>
      <div class="mbr-right">
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch;">
    <!-- COLUMN 1 -->
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div class="card" style="margin:0;"><div class="card-hd"><div class="card-hd-t">Flow Calculations</div></div><div class="card-body">
        <div class="mbr-res-grid">
          ${_cl_out('r_p_Qr', 'Recycle Sludge, Qr', 'm³/d')}
          ${_cl_out('r_p_Qp', 'Peak Flow, Qp', 'm³/d')}
        </div>
      </div></div>
      <div class="card" style="margin:0; flex: 1; display: flex; flex-direction: column;"><div class="card-hd"><div class="card-hd-t">Dimensions & Rect. Weir</div></div><div class="card-body" style="flex: 1;">
        <div class="fg-t">Circular Clarifier</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_p_D', 'Diameter, D', 'm', true)}
        </div>
        <div class="fg-t mt">Rectangular Clarifier & Weir</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_p_W', 'Width, W', 'm')}
          ${_cl_out('r_p_L', 'Length, L', 'm')}
          ${_cl_out('r_p_chan', 'Channel Widths Req.', '')}
        </div>
      </div></div>
    </div>
    <!-- COLUMN 2 -->
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div class="card" style="margin:0;"><div class="card-hd"><div class="card-hd-t">Area Calculations</div></div><div class="card-body">
        <div class="fg-t">Surface Overflow Rate (SOR)</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_p_A1', 'Avg. Flow Area, A1', 'm²')}
          ${_cl_out('r_p_A2', 'Peak Flow Area, A2', 'm²')}
          ${_cl_out('r_p_Agov', 'Design Area, A', 'm²', true)}
        </div>
      </div></div>
      <div class="card" style="margin:0; flex: 1; display: flex; flex-direction: column;"><div class="card-hd"><div class="card-hd-t">Circular Weir Design</div></div><div class="card-body" style="flex: 1;">
        <div class="fg-t">Minimum Diameters</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_p_w_single', 'Min. Dia. (Single)', 'm')}
          ${_cl_out('r_p_w_double', 'Min. Dia. (Double)', 'm')}
        </div>
      </div></div>
    </div>
  </div>
</div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 2: SECONDARY CLARIFIER DESIGN                                   -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="cl-t2">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Inputs — Secondary Clarifier</div><div class="card-hd-s">Enter values in blue boxes in spreadsheet</div></div><div class="card-body">
          <div class="g3">
            ${_cl_inp('cl_s_Q', 'Prim. Effluent, Q', G.Q || 10600.0, 'm³/d')}
            ${_cl_inp('cl_s_R', 'RAS Ratio, R', 0.3, '', 0.1)}
            ${_cl_inp('cl_s_X', 'MLSS, X', 2100.0, 'mg/L', 100)}
            ${_cl_inp('cl_s_SORa', 'Avg. SOR', 22.0, 'm³/d/m²', 1)}
            ${_cl_inp('cl_s_SORp', 'Peak SOR', 47.0, 'm³/d/m²', 1)}
            ${_cl_inp('cl_s_SLRa', 'Avg. SLR', 5.0, 'kg/hr/m²', 0.5)}
            ${_cl_inp('cl_s_SLRp', 'Peak SLR', 8.0, 'kg/hr/m²', 0.5)}
            ${_cl_inp('cl_s_PF', 'Peaking Factor, PF', G.PF || 2.25, '', 0.1)}
            ${_cl_inp('cl_s_N', 'No. Clarifiers, N', 2.0, '', 1)}
            ${_cl_inp('cl_s_WOR', 'Max WOR', 375.0, 'm³/d/m', 25)}
            ${_cl_inp('cl_s_LW', 'L/W Ratio', 4.0, '', 0.5)}
          </div>
        </div></div>
      </div>
      <div class="mbr-right">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: stretch;">
    <!-- COLUMN 1 -->
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div class="card" style="margin:0;"><div class="card-hd"><div class="card-hd-t">Flow Calculations</div></div><div class="card-body">
        <div class="mbr-res-grid">
          ${_cl_out('r_s_Qr', 'Recycle Sludge, Qr', 'm³/d')}
          ${_cl_out('r_s_Qp', 'Peak Flow, Qp', 'm³/d')}
        </div>
      </div></div>
      <div class="card" style="margin:0; flex: 1; display: flex; flex-direction: column;"><div class="card-hd"><div class="card-hd-t">Clarifier Dimensions</div></div><div class="card-body" style="flex: 1;">
        <div class="fg-t">Circular Clarifier</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_s_D', 'Diameter, D', 'm', true)}
        </div>
        <div class="fg-t mt">Rectangular Clarifier</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_s_W', 'Width, W', 'm')}
          ${_cl_out('r_s_L', 'Length, L', 'm')}
        </div>
      </div></div>
    </div>
    <!-- COLUMN 2 -->
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div class="card" style="margin:0;"><div class="card-hd"><div class="card-hd-t">Area Calculations (SOR)</div></div><div class="card-body">
        <div class="fg-t">Based on SOR</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_s_A1', 'Avg. Flow Area, A1', 'm²')}
          ${_cl_out('r_s_A2', 'Peak Flow Area, A2', 'm²')}
          ${_cl_out('r_s_Agov_SOR', 'Governing SOR Area', 'm²')}
        </div>
      </div></div>
      <div class="card" style="margin:0; flex: 1; display: flex; flex-direction: column;"><div class="card-hd"><div class="card-hd-t">Circular Weir Design</div></div><div class="card-body" style="flex: 1;">
        <div class="fg-t">Minimum Diameters</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_s_w_single', 'Min. Dia. (Single)', 'm')}
          ${_cl_out('r_s_w_double', 'Min. Dia. (Double)', 'm')}
        </div>
      </div></div>
    </div>
    <!-- COLUMN 3 -->
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div class="card" style="margin:0;"><div class="card-hd"><div class="card-hd-t">Area Calculations (SLR)</div></div><div class="card-body">
        <div class="fg-t">Based on SLR</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_s_A3', 'Avg. Flow Area, A3', 'm²')}
          ${_cl_out('r_s_A4', 'Peak Flow Area, A4', 'm²')}
          ${_cl_out('r_s_Agov_SLR', 'Governing SLR Area', 'm²')}
        </div>
      </div></div>
      <div class="card" style="margin:0; flex: 1; display: flex; flex-direction: column;"><div class="card-hd"><div class="card-hd-t">Final Design Outputs</div></div><div class="card-body" style="flex: 1;">
        <div class="fg-t">Final Area & Rect. Weir</div>
        <div class="mbr-res-grid">
          ${_cl_out('r_s_Agov', 'Design Area, A', 'm²', true)}
          ${_cl_out('r_s_chan', 'Channel Widths Req.', '')}
        </div>
      </div></div>
    </div>
  </div>
</div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 3: DESIGN CRITERIA REFERENCE TABLES                             -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="cl-t3">
    <div class="g2">
      <div class="card"><div class="card-hd"><div class="card-hd-t">Primary Clarifier — Typical Design Criteria</div><div class="card-hd-s">M&E 5th Ed., Table 5-15 / Ten States Standards</div></div><div class="card-body">
        <div style="background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.05); border-radius:8px; padding:10px;">
          <table style="width:100%; border-collapse:collapse; color:var(--ink); font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid rgba(0,0,0,0.1);"><th style="text-align:left; padding:10px; font-weight:700;">Parameter</th><th style="padding:10px;">Unit</th><th style="padding:10px;">Range</th><th style="padding:10px;">Typical</th></tr>
            </thead>
            <tbody>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">SOR at avg. flow</td><td style="padding:10px; text-align:center;">m³/m²/d</td><td style="padding:10px; text-align:center;">32 – 48</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">40</td></tr>
              <tr><td style="padding:10px; font-weight:500;">SOR at peak flow</td><td style="padding:10px; text-align:center;">m³/m²/d</td><td style="padding:10px; text-align:center;">80 – 120</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">100</td></tr>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">Side Water Depth</td><td style="padding:10px; text-align:center;">m</td><td style="padding:10px; text-align:center;">3.0 – 4.5</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">3.5</td></tr>
              <tr><td style="padding:10px; font-weight:500;">HRT at avg. flow</td><td style="padding:10px; text-align:center;">hr</td><td style="padding:10px; text-align:center;">1.5 – 2.5</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">2.0</td></tr>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">Weir Loading Rate</td><td style="padding:10px; text-align:center;">m³/m/d</td><td style="padding:10px; text-align:center;">125 – 500</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">250</td></tr>
              <tr><td style="padding:10px; font-weight:500;">TSS Removal</td><td style="padding:10px; text-align:center;">%</td><td style="padding:10px; text-align:center;">50 – 70</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">60</td></tr>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">BOD Removal</td><td style="padding:10px; text-align:center;">%</td><td style="padding:10px; text-align:center;">25 – 40</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">35</td></tr>
            </tbody>
          </table>
        </div>
      </div></div>

      <div class="card"><div class="card-hd"><div class="card-hd-t">Secondary Clarifier — Typical Design Criteria</div><div class="card-hd-s">M&E 5th Ed., Table 8-13 / Section 8-5</div></div><div class="card-body">
        <div style="background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.05); border-radius:8px; padding:10px;">
          <table style="width:100%; border-collapse:collapse; color:var(--ink); font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid rgba(0,0,0,0.1);"><th style="text-align:left; padding:10px; font-weight:700;">Parameter</th><th style="padding:10px;">Unit</th><th style="padding:10px;">Range</th><th style="padding:10px;">Typical</th></tr>
            </thead>
            <tbody>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">SOR at avg. flow</td><td style="padding:10px; text-align:center;">m³/m²/d</td><td style="padding:10px; text-align:center;">16 – 28</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">22</td></tr>
              <tr><td style="padding:10px; font-weight:500;">SOR at peak flow</td><td style="padding:10px; text-align:center;">m³/m²/d</td><td style="padding:10px; text-align:center;">33 – 56</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">47</td></tr>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">Solids Loading Rate</td><td style="padding:10px; text-align:center;">kg/m²/hr</td><td style="padding:10px; text-align:center;">4 – 6</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">5.0</td></tr>
              <tr><td style="padding:10px; font-weight:500;">Side Water Depth</td><td style="padding:10px; text-align:center;">m</td><td style="padding:10px; text-align:center;">3.5 – 5.0</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">4.0</td></tr>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">Max Weir Loading</td><td style="padding:10px; text-align:center;">m³/m/d</td><td style="padding:10px; text-align:center;">125 – 500</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">375</td></tr>
              <tr><td style="padding:10px; font-weight:500;">SVI</td><td style="padding:10px; text-align:center;">mL/g</td><td style="padding:10px; text-align:center;">80 – 150</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">120</td></tr>
              <tr style="background:rgba(0,0,0,0.02);"><td style="padding:10px; font-weight:500;">MLSS</td><td style="padding:10px; text-align:center;">mg/L</td><td style="padding:10px; text-align:center;">1500 – 3500</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">3000</td></tr>
              <tr><td style="padding:10px; font-weight:500;">RAS Ratio (R/Q)</td><td style="padding:10px; text-align:center;">—</td><td style="padding:10px; text-align:center;">0.3 – 1.0</td><td style="padding:10px; text-align:center; font-weight:700; color:#0284c7;">0.5</td></tr>
            </tbody>
          </table>
        </div>
      </div></div>
    </div>

    <div class="card mt"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body"><div id="cl-checks"></div></div></div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 4: ENGINEERING DIAGRAMS                                         -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="cl-t4">
    <div class="card"><div class="card-hd"><div class="card-hd-t">Primary Clarifier — Section View</div></div><div class="card-body">
      <div class="dwg-toolbar"><span>PRIMARY CLARIFIER — SECTION VIEW (NTS)</span><button class="btn btn-xs btn-dk" onclick="dlSVG('cl-svg-p','primary-clarifier')">⬇ Export SVG</button></div>
      <div class="dwg-wrap"><svg id="cl-svg-p" viewBox="0 0 1100 520" xmlns="http://www.w3.org/2000/svg"><text x="550" y="260" text-anchor="middle" font-size="14" fill="#aaa">Loading...</text></svg></div>
    </div></div>

    <div class="card mt"><div class="card-hd"><div class="card-hd-t">Secondary Clarifier — Section View</div></div><div class="card-body">
      <div class="dwg-toolbar"><span>SECONDARY CLARIFIER — SECTION VIEW (NTS)</span><button class="btn btn-xs btn-dk" onclick="dlSVG('cl-svg-s','secondary-clarifier')">⬇ Export SVG</button></div>
      <div class="dwg-wrap"><svg id="cl-svg-s" viewBox="0 0 1100 520" xmlns="http://www.w3.org/2000/svg"><text x="550" y="260" text-anchor="middle" font-size="14" fill="#aaa">Loading...</text></svg></div>
    </div></div>
  </div>

</div>`;
}
