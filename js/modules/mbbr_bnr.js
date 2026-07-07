/* ═══════════════════════════════════════════════════════════════════════════════
   MBBR Nitrification-Denitrification Module — Full Workbook-Parity Rewrite
   Source: MBBR Nitrification-Denitrification-S.I.xlsx
   Tabs:  1. Introduction  |  2. Pre-Anoxic  |  3. Post-Anoxic  |  4. Satn DO vs T
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── DO Saturation Lookup Table (Tab 4 — USGS data) ─── */
const DO_SAT_TABLE = [
  [0,14.62],[1,14.22],[2,13.83],[3,13.46],[4,13.11],[5,12.77],[6,12.45],[7,12.14],
  [8,11.84],[9,11.56],[10,11.29],[11,11.03],[12,10.78],[13,10.54],[14,10.30],[15,10.08],
  [16,9.87],[17,9.66],[18,9.47],[19,9.28],[20,9.09],[21,8.92],[22,8.74],[23,8.58],
  [24,8.42],[25,8.26],[26,8.11],[27,7.97],[28,7.83],[29,7.69],[30,7.56],[31,7.43],
  [32,7.30],[33,7.18],[34,7.06],[35,6.95]
];

function getDOSaturation(T) {
  if (T <= 0) return DO_SAT_TABLE[0][1];
  if (T >= 35) return DO_SAT_TABLE[35][1];
  const lo = Math.floor(T);
  const hi = Math.ceil(T);
  if (lo === hi) return DO_SAT_TABLE[lo][1];
  const frac = T - lo;
  return DO_SAT_TABLE[lo][1] + frac * (DO_SAT_TABLE[hi][1] - DO_SAT_TABLE[lo][1]);
}

/* ─── Nitrification SARR Table (M&E 5th Ed, Fig 9-25) ─── */
const NITRIF_TABLE = [
  { DO: 2, SARRmax: 0.61, N: 0.5 },
  { DO: 3, SARRmax: 0.88, N: 0.8 },
  { DO: 4, SARRmax: 1.03, N: 1.0 },
  { DO: 5, SARRmax: 1.23, N: 1.3 },
  { DO: 6, SARRmax: 1.41, N: 1.65 }
];

function getNitrifSARR(DO_conc) {
  if (DO_conc <= NITRIF_TABLE[0].DO) return { SARRmax: NITRIF_TABLE[0].SARRmax, N: NITRIF_TABLE[0].N };
  if (DO_conc >= NITRIF_TABLE[NITRIF_TABLE.length - 1].DO) {
    const last = NITRIF_TABLE[NITRIF_TABLE.length - 1];
    return { SARRmax: last.SARRmax, N: last.N };
  }
  for (let i = 0; i < NITRIF_TABLE.length - 1; i++) {
    if (DO_conc >= NITRIF_TABLE[i].DO && DO_conc <= NITRIF_TABLE[i + 1].DO) {
      const frac = (DO_conc - NITRIF_TABLE[i].DO) / (NITRIF_TABLE[i + 1].DO - NITRIF_TABLE[i].DO);
      return {
        SARRmax: NITRIF_TABLE[i].SARRmax + frac * (NITRIF_TABLE[i + 1].SARRmax - NITRIF_TABLE[i].SARRmax),
        N: NITRIF_TABLE[i].N + frac * (NITRIF_TABLE[i + 1].N - NITRIF_TABLE[i].N)
      };
    }
  }
  return { SARRmax: 0.88, N: 0.8 };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CALCULATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════════ */
const MBBR_BNREngine = {
  charts: {},

  init() {
    const root = document.getElementById('mbbr-bnr-module');
    if (!root) return;
    root.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', () => this.calc());
      el.addEventListener('change', () => this.calc());
    });
    this.calc();
  },

  v(id) { const e = document.getElementById(id); return e ? parseFloat(e.value) || 0 : 0; },
  vs(id) { const e = document.getElementById(id); return e ? (e.value || e.textContent || '') : ''; },
  out(id, val) { const e = document.getElementById(id); if (e) { e.textContent = val; } },

  calc() {
    const f2 = (v, d) => { if (v === undefined || v === null || isNaN(v)) return '—'; return v.toFixed(d); };

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION I — Wastewater Parameter Inputs (FIX #14: Excel defaults)
    // ══════════════════════════════════════════════════════════════════════════
    const Qo    = this.v('mbb_Qo');
    const So    = this.v('mbb_So');
    const TKNo  = this.v('mbb_TKNo');
    const NO3No = this.v('mbb_NO3No');
    const peakHr = this.v('mbb_peakHr') || 4;
    const Alk_in = this.v('mbb_Alk');
    const T     = this.v('mbb_T') || 15;

    // Pre-Anoxic Stage params
    const NO3Ne_target = this.v('mbb_NO3Ne');
    const QR_Qo_est    = this.v('mbb_QR_est') || 1.5;
    const SALR_NO3_pre = this.v('mbb_SALR_NO3_pre');

    // BOD Stage params
    const SALR_BOD = this.v('mbb_SALR_BOD');

    // Nitrification params
    const NH4Ne = this.v('mbb_NH4Ne');
    const DO_conc = this.v('mbb_DO');

    // Post-Anoxic params
    const NO3Ne_post = this.v('mbb_NO3Ne_post');
    const SALR_NO3_post = this.v('mbb_SALR_NO3_post');

    // Carrier & Tank
    const specArea   = this.v('mbb_specArea') || 500;
    const voidPct    = this.v('mbb_voidSpace') / 100;   // FIX #3: divide by 100
    const depth      = this.v('mbb_depth') || 2.4;
    const shape      = this.vs('mbb_shape') || 'rectangular';
    const lw         = this.v('mbb_lw') || 1.5;
    const fill1      = this.v('mbb_fill1') / 100;       // FIX #2: divide by 100
    const fill2      = this.v('mbb_fill2') / 100;       // FIX #2
    const fill3      = this.v('mbb_fill3') / 100;       // FIX #2

    // Aeration BOD stage inputs
    const O2_per_BOD   = this.v('mbb_O2_BOD') || 1.50;
    const O2_per_NH3   = this.v('mbb_O2_NH3') || 4.57;
    const SOTE_pct_m   = this.v('mbb_SOTE_pct') || 2.50;   // % per meter depth
    const AOTE_SOTE    = this.v('mbb_AOTE_SOTE') || 0.5;
    const dP_diff_bod  = this.v('mbb_dP_diff') / 100;      // FIX #6: kPa to bar
    const d_diff_bod   = this.v('mbb_d_diff_bod') || 2.3;
    const T_norm       = this.v('mbb_T_norm') || 0;
    const P_norm       = this.v('mbb_P_norm') / 100;       // FIX #6: kPa to bar
    const P_atm        = this.v('mbb_P_atm') / 100;        // FIX #6: kPa to bar
    const rho_air_stp  = this.v('mbb_rho_air_stp') || 1.200;
    const O2_content   = this.v('mbb_O2_content') / 100;   // FIX #7: % to fraction

    // Nitrification aeration inputs
    const SOTE_nitrif  = this.v('mbb_SOTE_nitrif') || 5.6;  // % per meter
    const F_fouling    = this.v('mbb_F_fouling') || 0.8;
    const alpha_nitrif = this.v('mbb_alpha') || 0.6;
    const d_diff_nitrif = this.v('mbb_d_diff_nitrif') || 2.5;
    const rho_air_norm = this.v('mbb_rho_air_norm') || 1.275;
    const P_atm_nitrif = this.v('mbb_P_atm_nitrif') / 100;  // FIX #6: kPa to bar
    const beta_nitrif  = this.v('mbb_beta') || 1.0;
    const dP_diff_nitrif = this.v('mbb_dP_nitrif') / 100;    // FIX #6: kPa to bar

    // Alkalinity inputs
    const Alk_target = this.v('mbb_Alk_target') || 80;

    // Carbon source inputs (Post-Anoxic only)
    const COD_req      = this.v('mbb_COD_req') || 4.6;
    const COD_content  = this.v('mbb_COD_content') || 1.5;

    // SARR/SALR data points
    const pre_SALR1 = this.v('mbb_pre_salr_p1') || 0.2;
    const pre_SALR2 = this.v('mbb_pre_salr_p2') || 0.5;
    const pre_ratio1 = this.v('mbb_pre_ratio_p1') || 0.95;
    const pre_ratio2 = this.v('mbb_pre_ratio_p2') || 0.94;

    const bod_SALR1 = this.v('mbb_bod_salr_p1') || 7.5;
    const bod_SALR2 = this.v('mbb_bod_salr_p2') || 15.0;
    const bod_ratio1 = this.v('mbb_bod_ratio_p1') || 0.925;
    const bod_ratio2 = this.v('mbb_bod_ratio_p2') || 0.875;

    const post_SALR1 = this.v('mbb_post_salr_p1') || 1.0;
    const post_SALR2 = this.v('mbb_post_salr_p2') || 1.8;
    const post_ratio1 = this.v('mbb_post_ratio_p1') || 0.900;
    const post_ratio2 = this.v('mbb_post_ratio_p2') || 0.889;

    if (Qo <= 0 || TKNo <= 0) return;

    // ══════════════════════════════════════════════════════════════════════════
    // SARR/SALR Linear Regression (slope + intercept from 2 data points)
    // Excel: =SLOPE(H17:I17,H16:I16) and =INTERCEPT(H17:I17,H16:I16)
    // ══════════════════════════════════════════════════════════════════════════
    const slopeCalc = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);
    const interceptCalc = (x1, y1, slope) => y1 - slope * x1;

    const pre_slope = slopeCalc(pre_SALR1, pre_ratio1, pre_SALR2, pre_ratio2);
    const pre_intercept = interceptCalc(pre_SALR1, pre_ratio1, pre_slope);
    const pre_SARR_SALR = pre_slope * SALR_NO3_pre + pre_intercept;

    const bod_slope = slopeCalc(bod_SALR1, bod_ratio1, bod_SALR2, bod_ratio2);
    const bod_intercept = interceptCalc(bod_SALR1, bod_ratio1, bod_slope);
    const bod_SARR_SALR = bod_slope * SALR_BOD + bod_intercept;

    const post_slope = slopeCalc(post_SALR1, post_ratio1, post_SALR2, post_ratio2);
    const post_intercept = interceptCalc(post_SALR1, post_ratio1, post_slope);
    const post_SARR_SALR = post_slope * SALR_NO3_post + post_intercept;

    // ══════════════════════════════════════════════════════════════════════════
    // NITRIFICATION SARR (Section 5 / Preliminary Calcs per Excel)
    // Excel: SARR = [N/(2.2+N)]*3.3 (Eqn 9-48, M&E 5th Ed)
    // ══════════════════════════════════════════════════════════════════════════
    const nitrifData = getNitrifSARR(DO_conc);
    const SARRmax = nitrifData.SARRmax;
    const N_at_SARRmax = nitrifData.N;

    const pct_NH4_rem = TKNo > 0 ? (TKNo - NH4Ne) / TKNo : 0;
    const NH4Ne_at_SARRmax_calc = N_at_SARRmax;

    // Excel: =IF(H36>H41,C42,(H36/(2.2+H36))*3.3)
    let SARR15, theta_sarr;
    if (NH4Ne > N_at_SARRmax) {
      SARR15 = SARRmax;        // DO-limited
      theta_sarr = 1.058;
    } else {
      SARR15 = (NH4Ne / (2.2 + NH4Ne)) * 3.3;  // NH4-limited
      theta_sarr = 1.098;
    }
    // Excel: =H42*(C44^(C36-15))
    const SARR_T = SARR15 * Math.pow(theta_sarr, T - 15);
    // Excel: =H43/C41
    const SALR_nitrif = pct_NH4_rem > 0 ? SARR_T / pct_NH4_rem : 0;

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION II — Pre vs Post Determination (FIX #1)
    // Excel: =IF(C48<4,"Post-Anoxic",IF(C49>0.75,"Post-Anoxic","Pre-Anoxic"))
    // ══════════════════════════════════════════════════════════════════════════
    const CN_Ratio = TKNo > 0 ? So / TKNo : 0;

    // FIX #1: Read the actual dropdown
    const modeVal = this.vs('mbb_denitrif_mode') || 'Pre-Anoxic';
    const use_post = (modeVal === 'Post-Anoxic');

    const use_post_NO3Ne = use_post ? NO3Ne_post : NO3Ne_target;
    const target_N_rem = TKNo > 0 ? (TKNo - use_post_NO3Ne) / TKNo : 0;

    // Toggle UI sections
    document.querySelectorAll('.mbb-pre-only').forEach(el => el.style.display = use_post ? 'none' : '');
    document.querySelectorAll('.mbb-post-only').forEach(el => el.style.display = use_post ? '' : 'none');

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION IV — Tank Sizing
    // ══════════════════════════════════════════════════════════════════════════
    let s1 = {}, s2 = {}, s3 = {};
    let BODe = 0, QR_Qo = 0;
    let req_NO3N_rem = 0;

    const tankCalc = (dailyLoad, SALR, fillPct) => {
      const area = SALR > 0 ? dailyLoad / SALR : 0;
      const carrVol = specArea > 0 ? area / specArea : 0;
      const tankVol = fillPct > 0 ? carrVol / fillPct : 0;
      return { dailyLoad, area, carrVol, tankVol };
    };

    const geomCalc = (tankVol) => {
      let W = 0, L = 0, D = 0;
      if (shape === 'rectangular') {
        const floorArea = depth > 0 ? tankVol / depth : 0;
        W = lw > 0 ? Math.sqrt(floorArea / lw) : 0;
        L = W * lw;
      } else {
        D = depth > 0 ? Math.sqrt((tankVol / depth) * 4 / Math.PI) : 0;
      }
      return { W, L, D };
    };

    // FIX #3: Use corrected voidPct (already divided by 100 above)
    const liqVolCalc = (tankVol, carrVol) => {
      return tankVol - (1 - voidPct) * carrVol;
    };

    // FIX #4: HRT in minutes (matches Excel)
    const hrtCalc = (liqVol) => {
      const Qo_min = Qo / (24 * 60); // m³/min
      const hrt_avg = Qo_min > 0 ? liqVol / Qo_min : 0;    // minutes
      const hrt_peak = peakHr > 0 ? hrt_avg / peakHr : 0;   // minutes
      return { hrt_avg, hrt_peak };
    };

    if (!use_post) {
      // ════ PRE-ANOXIC WORKFLOW ════
      // Stage order: 1. Pre-Anoxic (Denitrif) → 2. BOD Removal → 3. Nitrification
      const s1_name = 'Pre-Anoxic (Denitrification)';
      const s2_name = 'BOD Removal';
      const s3_name = 'Nitrification';

      // --- Iterative Solver for QR/Qo ---
      // Excel: C71: =C10*(C11-C16-H36)  → Req'd NO3-N removal
      req_NO3N_rem = Qo * (TKNo - NO3Ne_target - NH4Ne);
      if (req_NO3N_rem < 0) req_NO3N_rem = 0;

      // Excel: C64: =(C10*H11)+(C10*C17*C16)  → NO3-N Daily Loading
      QR_Qo = QR_Qo_est;
      for (let iter = 0; iter < 50; iter++) {
        const NO3_load = Qo * NO3No + Qo * QR_Qo * NO3Ne_target;
        const area = SALR_NO3_pre > 0 ? NO3_load / SALR_NO3_pre : 0;
        const SARR = pre_SARR_SALR * SALR_NO3_pre;
        const est_rem = SARR * area;
        const err = est_rem - req_NO3N_rem;
        if (Math.abs(err) < 0.001) break;
        const dLoad_dQR = Qo * NO3Ne_target;
        const dArea_dQR = SALR_NO3_pre > 0 ? dLoad_dQR / SALR_NO3_pre : 0;
        const dEst_dQR = SARR * dArea_dQR;
        if (Math.abs(dEst_dQR) < 1e-12) break;
        QR_Qo = QR_Qo - err / dEst_dQR;
        if (QR_Qo < 0) QR_Qo = 0;
      }

      // Stage 1: Pre-Anoxic
      const NO3_load_s1 = Qo * NO3No + Qo * QR_Qo * NO3Ne_target;
      const s1_tc = tankCalc(NO3_load_s1, SALR_NO3_pre, fill1);
      const s1_geom = geomCalc(s1_tc.tankVol);
      const s1_liqVol = liqVolCalc(s1_tc.tankVol, s1_tc.carrVol);
      const s1_hrt = hrtCalc(s1_liqVol);
      const s1_SARR = pre_SARR_SALR * SALR_NO3_pre;
      const s1_est_rem = s1_SARR * s1_tc.area;
      const s1_req_rem = req_NO3N_rem;

      s1 = { name: s1_name, ...s1_tc, ...s1_geom, liqVol: s1_liqVol, ...s1_hrt,
              SARR: s1_SARR, SALR: SALR_NO3_pre, est_rem: s1_est_rem, req_rem: s1_req_rem,
              fill: fill1, param: 'NO₃-N' };

      // --- Iterative Solver for BODe ---
      // Excel: BOD loading = Qo*So + Qo*QR_Qo*BODe - 0.67*(20/7)*NO3N_removal
      BODe = 10;
      for (let iter = 0; iter < 50; iter++) {
        const BOD_load = (Qo * So) + (Qo * QR_Qo * BODe) - (0.67 * (20 / 7) * req_NO3N_rem);
        const area_bod = SALR_BOD > 0 ? BOD_load / SALR_BOD : 0;
        const SARR_bod = bod_SARR_SALR * SALR_BOD;
        const bod_rem = SARR_bod * area_bod;
        const calc_BODe = Qo > 0 ? (BOD_load - bod_rem) / Qo : 0;
        const err = BODe - calc_BODe;
        if (Math.abs(err) < 0.0001) break;
        BODe = calc_BODe;
        if (BODe < 0) BODe = 0;
      }

      // Stage 2: BOD Removal
      const BOD_load_s2 = (Qo * So) + (Qo * QR_Qo * BODe) - (0.67 * (20 / 7) * req_NO3N_rem);
      const s2_tc = tankCalc(BOD_load_s2 > 0 ? BOD_load_s2 : 0, SALR_BOD, fill2);
      const s2_geom = geomCalc(s2_tc.tankVol);
      const s2_liqVol = liqVolCalc(s2_tc.tankVol, s2_tc.carrVol);
      const s2_hrt = hrtCalc(s2_liqVol);
      const s2_SARR = bod_SARR_SALR * SALR_BOD;
      const s2_est_rem = s2_SARR * s2_tc.area;
      const s2_calc_BODe = Qo > 0 ? (BOD_load_s2 - s2_est_rem) / Qo : 0;

      s2 = { name: s2_name, ...s2_tc, ...s2_geom, liqVol: s2_liqVol, ...s2_hrt,
              SARR: s2_SARR, SALR: SALR_BOD, est_rem: s2_est_rem,
              calc_effl: s2_calc_BODe, fill: fill2, BODe: BODe, param: 'BOD' };

      // Stage 3: Nitrification
      const NH4_load_s3 = Qo * TKNo + Qo * QR_Qo * NH4Ne;
      const s3_tc = tankCalc(NH4_load_s3, SALR_nitrif, fill3);
      const s3_geom = geomCalc(s3_tc.tankVol);
      const s3_liqVol = liqVolCalc(s3_tc.tankVol, s3_tc.carrVol);
      const s3_hrt = hrtCalc(s3_liqVol);
      const s3_SARR = SARR_T;
      const s3_est_rem = s3_SARR * s3_tc.area;
      const s3_calc_effl = Qo > 0 ? (NH4_load_s3 - s3_est_rem) / Qo : 0;
      const bod_salr_check = s3_tc.area > 0 ? (BODe * Qo / s3_tc.area) : 0;

      s3 = { name: s3_name, ...s3_tc, ...s3_geom, liqVol: s3_liqVol, ...s3_hrt,
              SARR: s3_SARR, SALR: SALR_nitrif, est_rem: s3_est_rem,
              calc_effl: s3_calc_effl, fill: fill3, bod_salr_check: bod_salr_check, param: 'NH₃-N' };

    } else {
      // ════ POST-ANOXIC WORKFLOW ════
      const s1_name = 'BOD Removal';
      const s2_name = 'Nitrification';
      const s3_name = 'Post-Anoxic (Denitrification)';

      // Stage 1: BOD Removal (no recycle)
      const BOD_load_s1 = Qo * So;
      const s1_tc = tankCalc(BOD_load_s1, SALR_BOD, fill1);
      const s1_geom = geomCalc(s1_tc.tankVol);
      const s1_liqVol = liqVolCalc(s1_tc.tankVol, s1_tc.carrVol);
      const s1_hrt = hrtCalc(s1_liqVol);
      const s1_SARR = bod_SARR_SALR * SALR_BOD;
      const s1_est_rem = s1_SARR * s1_tc.area;
      BODe = Qo > 0 ? (BOD_load_s1 - s1_est_rem) / Qo : 0;
      if (BODe < 0) BODe = 0;

      s1 = { name: s1_name, ...s1_tc, ...s1_geom, liqVol: s1_liqVol, ...s1_hrt,
              SARR: s1_SARR, SALR: SALR_BOD, est_rem: s1_est_rem,
              calc_effl: BODe, fill: fill1, BODe: BODe, param: 'BOD' };

      // Stage 2: Nitrification
      const NH4_load_s2 = Qo * TKNo;
      const s2_tc = tankCalc(NH4_load_s2, SALR_nitrif, fill2);
      const s2_geom = geomCalc(s2_tc.tankVol);
      const s2_liqVol = liqVolCalc(s2_tc.tankVol, s2_tc.carrVol);
      const s2_hrt = hrtCalc(s2_liqVol);
      const s2_SARR = SARR_T;
      const s2_est_rem = s2_SARR * s2_tc.area;
      const s2_calc_effl = Qo > 0 ? (NH4_load_s2 - s2_est_rem) / Qo : 0;
      const bod_salr_check = s2_tc.area > 0 ? (BODe * Qo / s2_tc.area) : 0;

      s2 = { name: s2_name, ...s2_tc, ...s2_geom, liqVol: s2_liqVol, ...s2_hrt,
              SARR: s2_SARR, SALR: SALR_nitrif, est_rem: s2_est_rem,
              calc_effl: s2_calc_effl, fill: fill2, bod_salr_check: bod_salr_check, param: 'NH₃-N' };

      // Stage 3: Post-Anoxic Denitrification
      const NO3_load_s3 = Qo * (TKNo - NH4Ne);
      const s3_tc = tankCalc(NO3_load_s3, SALR_NO3_post, fill3);
      const s3_geom = geomCalc(s3_tc.tankVol);
      const s3_liqVol = liqVolCalc(s3_tc.tankVol, s3_tc.carrVol);
      const s3_hrt = hrtCalc(s3_liqVol);
      const s3_SARR = post_SARR_SALR * SALR_NO3_post;
      const s3_est_rem = s3_SARR * s3_tc.area;
      const s3_calc_effl = Qo > 0 ? (NO3_load_s3 - s3_est_rem) / Qo : 0;

      s3 = { name: s3_name, ...s3_tc, ...s3_geom, liqVol: s3_liqVol, ...s3_hrt,
              SARR: s3_SARR, SALR: SALR_NO3_post, est_rem: s3_est_rem,
              calc_effl: s3_calc_effl, fill: fill3, param: 'NO₃-N' };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION V — O₂/Air/Blower for BOD Removal Stage
    // ══════════════════════════════════════════════════════════════════════════
    const BOD_removed = use_post
      ? (Qo * So - Qo * BODe)
      : (Qo * So + Qo * QR_Qo * BODe - 0.67 * (20 / 7) * req_NO3N_rem - Qo * BODe);
    const O2_req_BOD = (BOD_removed / 1000) * O2_per_BOD;
    const SOTE_bod = SOTE_pct_m * d_diff_bod / 100;
    const AOTE_bod = SOTE_bod * AOTE_SOTE;
    const air_req_bod = AOTE_bod > 0 ? (O2_req_BOD / AOTE_bod) / (O2_content * 24) : 0;
    const P_blower_bod = P_atm + dP_diff_bod + (9.81 * 1000 * d_diff_bod) / 100000;

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION VI — O₂/Air/Blower for Nitrification Stage
    // ══════════════════════════════════════════════════════════════════════════
    const NH4_removed = TKNo - NH4Ne;
    const O2_req_nitrif = (Qo * NH4_removed / 1000) * O2_per_NH3;

    const PD_kPa = P_atm_nitrif * 100 + 9.81 * 1000 * (d_diff_nitrif / 2) / 1000;
    const Cs = getDOSaturation(T);
    const Css = getDOSaturation(20);
    const P_std = 101.325;
    const SOTE_nitrif_frac = SOTE_nitrif / 100;
    const AOTE_nitrif_val = SOTE_nitrif_frac * alpha_nitrif * F_fouling *
      ((beta_nitrif * (PD_kPa / P_std) * Cs - DO_conc) / Css) *
      Math.pow(1.024, T - 20);

    const MW_air = 28.97, MW_O2 = 32, O2_frac = 0.2095;
    const air_Nm3_hr = AOTE_nitrif_val > 0 ?
      (O2_req_nitrif / AOTE_nitrif_val) * MW_air / (O2_frac * MW_O2 * rho_air_norm * 24) : 0;

    const PB2_bar = P_atm_nitrif + dP_diff_nitrif + (9.81 * 1000 * d_diff_nitrif) / 100000;
    const air_m3_hr = air_Nm3_hr * ((T + 273.15) / (T_norm + 273.15)) * (P_norm / PB2_bar);

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION VII — Alkalinity Requirements
    // ══════════════════════════════════════════════════════════════════════════
    const Alk_nitrif = 7.14, Alk_denitrif = 3.57;
    const EW_CaCO3 = 50, EW_NaHCO3 = 84;

    const NH4_rem_conc = TKNo - NH4Ne;
    let NO3_rem_conc = use_post ? (TKNo - NO3Ne_post - NH4Ne) : (TKNo - NO3Ne_target - NH4Ne);
    if (NO3_rem_conc < 0) NO3_rem_conc = 0;

    const Alk_consumed = NH4_rem_conc * Alk_nitrif;
    const Alk_produced = NO3_rem_conc * Alk_denitrif;
    const Alk_to_add = Alk_target - (Alk_in - Alk_consumed + Alk_produced);
    const Alk_daily_CaCO3 = Alk_to_add > 0 ? (Alk_to_add * Qo) / 1000 : 0;
    const Alk_daily_NaHCO3 = Alk_daily_CaCO3 * (EW_NaHCO3 / EW_CaCO3);

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION VIII — Carbon Source (Post-Anoxic only)
    // ══════════════════════════════════════════════════════════════════════════
    let carbon_dosage = 0, carbon_daily = 0;
    if (use_post) {
      carbon_dosage = COD_content > 0 ? COD_req / COD_content : 0;
      const NO3_removed_daily = s3.est_rem;
      carbon_daily = (NO3_removed_daily / 1000) * carbon_dosage;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ALL OUTPUT BINDINGS
    // ══════════════════════════════════════════════════════════════════════════

    // --- KPI Cards ---
    this.out('mbb_cn_disp', CN_Ratio.toFixed(1));
    this.out('mbb_targetN_disp', (target_N_rem * 100).toFixed(0));
    this.out('mbb_out_BODe', f2(BODe, 1));
    this.out('mbb_out_QR', use_post ? 'N/A' : f2(QR_Qo, 2));
    this.out('mbb_pct_nh4_rem', (pct_NH4_rem * 100).toFixed(0));
    this.out('mbb_SALR_nitrif', f2(SALR_nitrif, 2));
    this.out('mbb_SARRmax', f2(SARRmax, 2));
    this.out('mbb_SARR_T', f2(SARR_T, 2));

    // --- SARR/SALR regression ---
    this.out('mbb_pre_sarr_salr', f2(pre_SARR_SALR, 3));
    this.out('mbb_bod_sarr_salr', f2(bod_SARR_SALR, 3));
    this.out('mbb_post_sarr_salr', f2(post_SARR_SALR, 3));

    // --- FIX #8 & #9: Tank Sizing Summary Table ---
    const stages = [s1, s2, s3];
    const stageIds = use_post
      ? ['bod', 'nitrif', 'post']
      : ['pre', 'bod', 'nitrif'];

    stageIds.forEach((sid, i) => {
      this.out('mbb_out_V_media_' + sid, f2(stages[i].carrVol, 2));
      this.out('mbb_out_V_tank_' + sid, f2(stages[i].tankVol, 1));
    });

    const totalMedia = stages.reduce((sum, s) => sum + s.carrVol, 0);
    const totalTank = stages.reduce((sum, s) => sum + s.tankVol, 0);
    const totalArea = stages.reduce((sum, s) => sum + s.area, 0);
    const totalHRT = stages.reduce((sum, s) => sum + s.hrt_avg, 0);

    this.out('mbb_out_V_media_tot', f2(totalMedia, 2));
    this.out('mbb_out_V_tank_tot', f2(totalTank, 1));
    this.out('mbb_out_A_surf', f2(totalArea, 0));
    this.out('mbb_out_HRT', f2(totalHRT, 0) + ' min');

    // Footprint estimation
    const totalFloorArea = depth > 0 ? totalTank / depth : 0;
    const totalW = lw > 0 ? Math.sqrt(totalFloorArea / lw) : 0;
    const totalL = totalW * lw;
    this.out('mbb_out_footprint', f2(totalW, 1) + ' × ' + f2(totalL, 1));

    // --- FIX #5: Aeration & Chemistry outputs (direct from computed vars) ---
    this.out('mbb_air_bod_out', f2(air_req_bod, 1));
    this.out('mbb_air_nitrif_out', f2(air_Nm3_hr, 1));
    this.out('mbb_alk_daily_out', f2(Alk_daily_NaHCO3, 1));
    this.out('mbb_carbon_daily_out', f2(carbon_daily, 1));

    // --- FIX #10: Populate verification table ---
    const tbody = document.getElementById('mbb-verification-tbody');
    if (tbody) {
      const rows = [
        ['Pre-Anoxic SARR/SALR', f2(pre_SARR_SALR, 3), '—'],
        ['BOD SARR/SALR', f2(bod_SARR_SALR, 3), '—'],
        ['Post-Anoxic SARR/SALR', f2(post_SARR_SALR, 3), '—'],
        ['SARR15 (at 15°C)', f2(SARR15, 2), 'g/m²d'],
        ['SARR_T (at ' + T + '°C)', f2(SARR_T, 2), 'g/m²d'],
        ['SARRmax (DO=' + DO_conc + ')', f2(SARRmax, 2), 'g/m²d'],
        ['θ (temp coeff)', f2(theta_sarr, 3), '—'],
        ['NH₄-N % removal', (pct_NH4_rem * 100).toFixed(0), '%'],
        ['Design SALR (nitrif)', f2(SALR_nitrif, 2), 'g/m²d'],
        ['C/N Ratio', f2(CN_Ratio, 1), '—'],
        ['Target N removal', (target_N_rem * 100).toFixed(0), '%'],
        ['Recycle Ratio QR/Qo', use_post ? 'N/A' : f2(QR_Qo, 2), '—'],
        ['Effluent BOD', f2(BODe, 1), 'mg/L'],
        ['DO Saturation (Cs)', f2(Cs, 2), 'mg/L'],
      ];
      tbody.innerHTML = rows.map(r =>
        `<tr><td>${r[0]}</td><td class="mbbr-val" style="text-align:right;">${r[1]}</td><td class="mbbr-unit" style="text-align:center;">${r[2]}</td></tr>`
      ).join('');
    }

    // --- FIX #13: Full Stage Results Table ---
    const stageTable = document.getElementById('mbb-stage-results-tbody');
    if (stageTable) {
      const stageRows = stages.map((s, i) => {
        const geom = shape === 'rectangular'
          ? f2(s.W, 1) + ' × ' + f2(s.L, 1) + ' m'
          : 'Ø' + f2(s.D, 1) + ' m';
        return `<tr>
          <td style="font-weight:600;">${s.name}</td>
          <td>${f2(s.dailyLoad, 0)}</td>
          <td>${f2(s.area, 0)}</td>
          <td>${f2(s.carrVol, 2)}</td>
          <td>${(s.fill * 100).toFixed(0)}%</td>
          <td>${f2(s.tankVol, 1)}</td>
          <td>${geom}</td>
          <td>${f2(s.liqVol, 1)}</td>
          <td>${f2(s.hrt_avg, 0)}</td>
          <td>${f2(s.hrt_peak, 0)}</td>
          <td>${f2(s.SARR, 2)}</td>
        </tr>`;
      });
      stageTable.innerHTML = stageRows.join('');
    }

    // --- Hidden outputs for backward compat ---
    this.out('mbb_pre_slope', f2(pre_slope, 3));
    this.out('mbb_pre_intercept', f2(pre_intercept, 3));
    this.out('mbb_bod_slope', f2(bod_slope, 3));
    this.out('mbb_bod_intercept', f2(bod_intercept, 3));
    this.out('mbb_post_slope', f2(post_slope, 3));
    this.out('mbb_post_intercept', f2(post_intercept, 3));
    this.out('mbb_SARR15', f2(SARR15, 2));
    this.out('mbb_NH4Ne_SARRmax', f2(NH4Ne_at_SARRmax_calc, 2));
    this.out('mbb_theta_sarr', f2(theta_sarr, 3));
    this.out('mbb_O2_BOD_out', f2(O2_req_BOD, 1));
    this.out('mbb_SOTE_bod', (SOTE_bod * 100).toFixed(1) + '%');
    this.out('mbb_AOTE_bod', (AOTE_bod * 100).toFixed(1) + '%');
    this.out('mbb_air_bod', f2(air_req_bod, 1));
    this.out('mbb_blower_bod', f2(P_blower_bod, 2));
    this.out('mbb_O2_nitrif_out', f2(O2_req_nitrif, 1));
    this.out('mbb_PD', f2(PD_kPa, 1));
    this.out('mbb_Cs', f2(Cs, 1));
    this.out('mbb_AOTE_nitrif', (AOTE_nitrif_val * 100).toFixed(1) + '%');
    this.out('mbb_air_nitrif_nm3', f2(air_Nm3_hr, 1));
    this.out('mbb_air_nitrif_m3', f2(air_m3_hr, 1));
    this.out('mbb_PB2', f2(PB2_bar, 2));
    this.out('mbb_alk_nitrif_const', Alk_nitrif.toFixed(2));
    this.out('mbb_alk_denitrif_const', Alk_denitrif.toFixed(2));
    this.out('mbb_alk_to_add', f2(Alk_to_add, 1));
    this.out('mbb_alk_daily', f2(Alk_daily_CaCO3, 1));
    this.out('mbb_alk_nahco3', f2(Alk_daily_NaHCO3, 1));
    this.out('mbb_carbon_dosage', f2(carbon_dosage, 1));
    this.out('mbb_carbon_daily', f2(carbon_daily, 1));

    // ══════════════════════════════════════════════════════════════════════════
    // CHARTS
    // ══════════════════════════════════════════════════════════════════════════
    this.updateCharts(
      { pre_slope, pre_intercept, SALR_NO3_pre, pre_SARR_SALR,
        bod_slope, bod_intercept, SALR_BOD, bod_SARR_SALR,
        post_slope, post_intercept, SALR_NO3_post, post_SARR_SALR,
        DO_conc, NH4Ne, SARR15, SARR_T, SARRmax, N_at_SARRmax, use_post }
    );
  },

  updateCharts(d) {
    this.renderLineChart('mbb_chart_denitrif',
      d.use_post ? 'Post-Anoxic SARR/SALR vs SALR' : 'Pre-Anoxic SARR/SALR vs SALR',
      d.use_post ? d.post_slope : d.pre_slope,
      d.use_post ? d.post_intercept : d.pre_intercept,
      d.use_post ? d.SALR_NO3_post : d.SALR_NO3_pre,
      d.use_post ? d.post_SARR_SALR : d.pre_SARR_SALR,
      d.use_post ? [0, 3] : [0, 1.5],
      'SALR (g/m²/d)', 'SARR/SALR Ratio'
    );

    this.renderLineChart('mbb_chart_bod',
      'BOD SARR/SALR vs SALR',
      d.bod_slope, d.bod_intercept,
      d.SALR_BOD, d.bod_SARR_SALR,
      [0, 20],
      'SALR (g/m²/d)', 'SARR/SALR Ratio'
    );

    this.renderNitrifChart('mbb_chart_nitrif', d);
  },

  renderLineChart(canvasId, title, slope, intercept, designX, designY, xRange, xLabel, yLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (this.charts[canvasId]) this.charts[canvasId].destroy();

    const pts = 50;
    const xMin = xRange[0], xMax = xRange[1];
    const step = (xMax - xMin) / pts;
    const lineData = [];
    for (let x = xMin; x <= xMax; x += step) {
      lineData.push({ x, y: slope * x + intercept });
    }

    this.charts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'SARR/SALR Regression',
            data: lineData, showLine: true,
            borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.08)',
            borderWidth: 2, pointRadius: 0, fill: true, order: 2
          },
          {
            label: 'Design Point',
            data: [{ x: designX, y: designY }],
            pointRadius: 8, pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff', pointBorderWidth: 2, order: 1
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: title, color: '#334155', font: { size: 12, family: 'Inter' } },
          legend: { display: false }
        },
        scales: {
          x: { title: { display: true, text: xLabel, color: '#475569' },
               ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' },
               min: xRange[0], max: xRange[1] },
          y: { title: { display: true, text: yLabel, color: '#475569' },
               ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' }
             }
        }
      }
    });
  },

  renderNitrifChart(canvasId, d) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (this.charts[canvasId]) this.charts[canvasId].destroy();

    const curveData = [];
    for (let N = 0; N <= 8; N += 0.1) {
      curveData.push({ x: N, y: (N / (2.2 + N)) * 3.3 });
    }
    const tableData = NITRIF_TABLE.map(r => ({x: r.N, y: r.SARRmax}));

    this.charts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'SARR = N/(2.2+N) × 3.3', data: curveData, showLine: true,
            borderColor: '#10b981', borderWidth: 2, pointRadius: 0, fill: false, order: 3
          },
          {
            label: 'M&E Fig 9-25 Points', data: tableData,
            pointRadius: 5, pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff', pointBorderWidth: 1, order: 2
          },
          {
            label: 'Design Point', data: [{ x: d.NH4Ne, y: d.SARR_T }],
            pointRadius: 10, pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff', pointBorderWidth: 2, pointStyle: 'star', order: 1
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: `Nitrification SARR at DO = ${d.DO_conc} mg/L`, color: '#334155', font: { size: 12, family: 'Inter' } },
          legend: { labels: { color: '#475569', font: { size: 10 } } }
        },
        scales: {
          x: { title: { display: true, text: 'Effluent NH₄-N (mg/L)', color: '#475569' },
               ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' },
               min: 0, max: 8 },
          y: { title: { display: true, text: 'SARR (g/m²/d)', color: '#475569' },
               ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' },
               min: 0, max: 3.5 }
        }
      }
    });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════════
   UI BUILDER — buildMBBRBNR()
   FIX #11, #12, #13, #14: Charts, stage table, Excel defaults
   ═══════════════════════════════════════════════════════════════════════════════ */
function buildMBBRBNR() {
  const _inp = (id, lbl, val, unt, style='') => `
    <div class="f" style="${style}"><label>${lbl}</label><div class="fuw"><input type="number" id="${id}" value="${val}"><div class="fu">${unt}</div></div></div>`;

  const _out = (id, lbl, unt, highlight=false) => `
    <div class="f ${highlight?'hl':''}"><label>${lbl}</label><div class="fuw"><div class="out-val" id="${id}">—</div><div class="fu">${unt}</div></div></div>`;

  const _kpi = (icon, lbl, id, unt, desc='') => `
    <div class="mbr-kpi"><div class="mbr-kpi-icon">${icon}</div><div class="mbr-kpi-val" id="${id}">—</div><div class="mbr-kpi-unit">${unt}</div><div class="mbr-kpi-label">${lbl}</div>${desc?`<div class="mbr-kpi-sub">${desc}</div>`:''}</div>`;

  const _resCard = (id, lbl, unt) => `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; text-align:center;">
      <div style="font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">${lbl}</div>
      <div style="font-size:20px; font-weight:700; color:#0ea5e9; display:flex; align-items:center; justify-content:center; gap:6px;">
        <span id="${id}">—</span>
        <span style="font-size:12px; font-weight:600; color:#94a3b8; background:#e2e8f0; padding:2px 6px; border-radius:4px;">${unt}</span>
      </div>
    </div>`;

  const _hide = (id) => `<div id="${id}" style="display:none;"></div>`;

  const _style = `
    <style>
      .mbbr-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
      .mbbr-table th { padding: 14px 12px; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
      .mbbr-table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; }
      .mbbr-table tr:hover td { background-color: #f8fafc; }
      .mbbr-table .mbbr-val { font-weight: 600; color: #0ea5e9; }
      .mbbr-table .mbbr-unit { color: #94a3b8; font-size: 13px; }
    </style>
  `;

  return `${_style}<div class="mwrap" id="mbbr-bnr-module">
    <div class="mhdr">
      <div class="mh-left">
        <div class="mt-title">MBBR Nitrification–Denitrification Design<div class="mt-badge">MBBR</div></div>
        <div class="mt-bread">Full BNR: Pre-Anoxic & Post-Anoxic Denitrification · Basin Sizing · Aeration · Alkalinity</div>
      </div>
      <button class="btn btn-o btn-sm" onclick="closeModule('mbbr-bnr-module')">✕ Close</button>
    </div>

    <!-- ═══ KPI HIGHLIGHT CARDS ═══ -->
    <div class="mbr-kpi-row">
      ${_kpi('⚖️', 'C/N RATIO', 'mbb_cn_disp', '', 'Influent Ratio')}
      ${_kpi('🎯', 'TARGET N REM.', 'mbb_targetN_disp', '%', 'Nitrogen Removal')}
      ${_kpi('📉', 'EST. EFFL. BOD', 'mbb_out_BODe', 'mg/L', 'Calculated Effluent')}
      ${_kpi('🔄', 'RECYCLE RATIO', 'mbb_out_QR', 'QR/Qo', 'Pre-Anoxic Only')}
      ${_kpi('✨', 'NH₄ REMOVAL', 'mbb_pct_nh4_rem', '%', 'Target')}
      ${_kpi('🧬', 'NITRIF. SALR', 'mbb_SALR_nitrif', 'g/m²d', 'Required SALR')}
      ${_kpi('🌬️', 'SARRmax (DO)', 'mbb_SARRmax', 'g/m²d', 'Max at DO')}
      ${_kpi('🌡️', 'SARR_T', 'mbb_SARR_T', 'g/m²d', 'At Design Temp')}
    </div>

    <!-- ═══ TAB BAR ═══ -->
    <div class="tab-bar">
      <div class="tab active" onclick="stab(this,'mbb-t1')">1. Process Kinetics</div>
      <div class="tab" onclick="stab(this,'mbb-t2')">2. Tank Sizing</div>
      <div class="tab" onclick="stab(this,'mbb-t3')">3. Aeration & Chemistry</div>
      <div class="tab" onclick="stab(this,'mbb-t4')">📊 Graphs</div>
      <div class="tab" onclick="stab(this,'mbb-t5')">📐 Diagrams</div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: PROCESS KINETICS -->
    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <div id="mbb-t1" class="tp active">
      <div class="mbr-split">
        <div class="mbr-left">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">Process Configuration</div></div>
            <div class="card-body">
              <div class="f" style="flex-direction:column;align-items:flex-start;gap:8px;">
                <label>Denitrification Mode</label>
                <select id="mbb_denitrif_mode" style="width:100%;border:1px solid #dcdde1;border-radius:6px;padding:10px;font-size:14px;background:#f8f9fa;">
                  <option value="Pre-Anoxic">Pre-Anoxic Denitrification</option>
                  <option value="Post-Anoxic">Post-Anoxic Denitrification</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card mt">
            <div class="card-hd"><div class="card-hd-t">I. Wastewater Parameters</div></div>
            <div class="card-body g2">
              ${_inp('mbb_Qo', 'Design WW Flow, Qo', 760, 'm³/d')}
              ${_inp('mbb_peakHr', 'Peak Hour Factor', 4, '')}
              ${_inp('mbb_T', 'Min Design Temp, T', 15, '°C')}
              ${_inp('mbb_So', 'Influent BOD, So', 180, 'mg/L')}
              ${_inp('mbb_TKNo', 'Influent TKN', 25, 'mg/L')}
              ${_inp('mbb_NO3No', 'Influent NO₃-N', 0, 'mg/L')}
              ${_inp('mbb_Alk', 'Influent Alkalinity', 140, 'mg/L as CaCO₃')}
            </div>
          </div>

          <div class="card mt">
            <div class="card-hd"><div class="card-hd-t">II. Effluent Targets</div></div>
            <div class="card-body g2">
              ${_inp('mbb_NH4Ne', 'Target Effl. NH₄-N', 3.3, 'mg/L')}
              ${_inp('mbb_NO3Ne', 'Target Pre-Anoxic NO₃-N', 9.0, 'mg/L')}
              <div class="mbb-post-only" style="display:none;">${_inp('mbb_NO3Ne_post', 'Target Post-Anoxic NO₃-N', 3.0, 'mg/L')}</div>
              ${_inp('mbb_DO', 'Design D.O.', 3.0, 'mg/L')}
            </div>
          </div>

          <div style="display:none;">
            ${_inp('mbb_pre_salr_p1', '', 0.2, '')}
            ${_inp('mbb_pre_ratio_p1', '', 0.95, '')}
            ${_inp('mbb_pre_salr_p2', '', 0.5, '')}
            ${_inp('mbb_pre_ratio_p2', '', 0.94, '')}
            ${_inp('mbb_post_salr_p1', '', 1.0, '')}
            ${_inp('mbb_post_ratio_p1', '', 0.900, '')}
            ${_inp('mbb_post_salr_p2', '', 1.8, '')}
            ${_inp('mbb_post_ratio_p2', '', 0.889, '')}
            ${_inp('mbb_bod_salr_p1', '', 7.5, '')}
            ${_inp('mbb_bod_ratio_p1', '', 0.925, '')}
            ${_inp('mbb_bod_salr_p2', '', 15.0, '')}
            ${_inp('mbb_bod_ratio_p2', '', 0.875, '')}
          </div>
        </div>

        <div class="mbr-right">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">Calculation Summary</div></div>
            <div class="card-body">
              <table class="mbbr-table">
                <thead>
                  <tr><th>Parameter</th><th style="width:120px; text-align:right;">Value</th><th style="width:80px; text-align:center;">Unit</th></tr>
                </thead>
                <tbody id="mbb-verification-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: TANK SIZING -->
    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <div id="mbb-t2" class="tp">
      <div class="mbr-split">
        <div class="mbr-left">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">Target Loading Rates (SALR)</div></div>
            <div class="card-body g2">
              ${_inp('mbb_SALR_NO3_pre', 'Pre-Anoxic SALR', 0.9, 'g NO₃/m²d')}
              ${_inp('mbb_SALR_NO3_post', 'Post-Anoxic SALR', 1.0, 'g NO₃/m²d')}
              ${_inp('mbb_SALR_BOD', 'BOD SALR', 6.0, 'g BOD/m²d')}
            </div>
          </div>

          <div class="card mt">
            <div class="card-hd"><div class="card-hd-t">Media & Geometry</div></div>
            <div class="card-body g2">
              ${_inp('mbb_specArea', 'Carrier Spec. Area', 500, 'm²/m³')}
              ${_inp('mbb_voidSpace', 'Carrier Void Space', 60, '%')}
              ${_inp('mbb_fill1', 'Stage 1 Fill', 40, '%')}
              ${_inp('mbb_fill2', 'Stage 2 Fill', 50, '%')}
              ${_inp('mbb_fill3', 'Stage 3 Fill', 55, '%')}
              ${_inp('mbb_depth', 'Basin Water Depth', 2.4, 'm')}
              ${_inp('mbb_lw', 'Length/Width Ratio', 1.5, '—')}
            </div>
          </div>
        </div>

        <div class="mbr-right">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">Carrier Volume & Tank Dimensions</div></div>
            <div class="card-body">
              <table class="mbbr-table">
                <thead>
                  <tr><th>Stage</th><th style="text-align:right;">Media (m³)</th><th style="text-align:right;">Tank (m³)</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pre-Anoxic</td><td class="mbbr-val" id="mbb_out_V_media_pre" style="text-align:right;">—</td><td class="mbbr-val" id="mbb_out_V_tank_pre" style="text-align:right;">—</td>
                  </tr>
                  <tr>
                    <td>BOD Removal</td><td class="mbbr-val" id="mbb_out_V_media_bod" style="text-align:right;">—</td><td class="mbbr-val" id="mbb_out_V_tank_bod" style="text-align:right;">—</td>
                  </tr>
                  <tr>
                    <td>Nitrification</td><td class="mbbr-val" id="mbb_out_V_media_nitrif" style="text-align:right;">—</td><td class="mbbr-val" id="mbb_out_V_tank_nitrif" style="text-align:right;">—</td>
                  </tr>
                  <tr class="mbb-post-only" style="display:none;">
                    <td>Post-Anoxic</td><td class="mbbr-val" id="mbb_out_V_media_post" style="text-align:right;">—</td><td class="mbbr-val" id="mbb_out_V_tank_post" style="text-align:right;">—</td>
                  </tr>
                  <tr style="background:#f8f9fa;">
                    <td style="text-align:right;font-weight:600;">TOTAL:</td><td class="mbbr-val" id="mbb_out_V_media_tot" style="text-align:right;">—</td><td class="mbbr-val" id="mbb_out_V_tank_tot" style="text-align:right;">—</td>
                  </tr>
                </tbody>
              </table>
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:15px; margin-top:20px;">
                ${_resCard('mbb_out_A_surf', 'Total Surface Area', 'm²')}
                ${_resCard('mbb_out_footprint', 'Est. Footprint', 'm × m')}
                ${_resCard('mbb_out_HRT', 'Total HRT', 'min')}
              </div>
            </div>
          </div>

          <div class="card mt">
            <div class="card-hd"><div class="card-hd-t">Full Stage Breakdown</div></div>
            <div class="card-body" style="overflow-x:auto;">
              <table class="mbbr-table" style="white-space:nowrap;">
                <thead>
                  <tr><th>Stage</th><th>Load (g/d)</th><th>Area (m²)</th><th>Media (m³)</th><th>Fill</th><th>Tank (m³)</th><th>Dims</th><th>Liq (m³)</th><th>HRT avg</th><th>HRT pk</th><th>SARR</th></tr>
                </thead>
                <tbody id="mbb-stage-results-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 3: AERATION & CHEMISTRY -->
    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <div id="mbb-t3" class="tp">
      <div class="mbr-split">
        <div class="mbr-left">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">Aeration General Inputs</div></div>
            <div class="card-body g2">
              ${_inp('mbb_alpha', 'Alpha Factor, α', 0.6, '—')}
              ${_inp('mbb_beta', 'Beta Factor, β', 1.0, '—')}
              ${_inp('mbb_F_fouling', 'Fouling Factor, F', 0.8, '—')}
              ${_inp('mbb_P_atm', 'Site Atm. Pressure', 101.4, 'kPa')}
              ${_inp('mbb_rho_air_stp', 'Air Density (STP)', 1.200, 'kg/m³')}
              ${_inp('mbb_rho_air_norm', 'Air Density (Norm)', 1.275, 'kg/m³')}
              ${_inp('mbb_P_norm', 'Standard Pressure', 100.0, 'kPa')}
              ${_inp('mbb_T_norm', 'Standard Temp.', 0, '°C')}
              ${_inp('mbb_O2_content', 'O₂ by weight', 27.7, '%')}
              ${_inp('mbb_O2_BOD', 'O₂ req / kg BOD', 1.50, 'kgO₂/kg')}
              ${_inp('mbb_O2_NH3', 'O₂ req / kg NH₄', 4.57, 'kgO₂/kg')}
            </div>
          </div>

          <div class="card mt">
            <div class="card-hd"><div class="card-hd-t">Diffuser Specs</div></div>
            <div class="card-body g2">
              ${_inp('mbb_SOTE_pct', 'BOD SOTE', 2.5, '%/m')}
              ${_inp('mbb_d_diff_bod', 'BOD Diffuser Depth', 2.3, 'm')}
              ${_inp('mbb_dP_diff', 'BOD Press. Drop', 3.0, 'kPa')}
              ${_inp('mbb_SOTE_nitrif', 'Nitrif. SOTE', 5.6, '%/m')}
              ${_inp('mbb_d_diff_nitrif', 'Nitrif. Diffuser Depth', 2.5, 'm')}
              ${_inp('mbb_dP_nitrif', 'Nitrif. Press. Drop', 2.1, 'kPa')}
              ${_inp('mbb_P_atm_nitrif', 'Site Pressure', 101.4, 'kPa')}
            </div>
          </div>

          <div class="card mt">
            <div class="card-hd"><div class="card-hd-t">Chemistry</div></div>
            <div class="card-body g2">
              ${_inp('mbb_Alk_target', 'Target Effl. Alkalinity', 80, 'mg/L')}
              ${_inp('mbb_COD_req', 'g COD req/g NO₃', 4.6, 'g/g')}
              ${_inp('mbb_COD_content', 'g COD / g Methanol', 1.5, 'g/g')}
            </div>
          </div>
        </div>

        <div class="mbr-right">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">Aeration & Chemical Dosage Summary</div></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px;">
                ${_resCard('mbb_air_bod_out', 'BOD Airflow Req.', 'Nm³/hr')}
                ${_resCard('mbb_air_nitrif_out', 'Nitrif. Airflow Req.', 'Nm³/hr')}
                ${_resCard('mbb_alk_daily_out', 'NaHCO₃ Dosage', 'kg/d')}
                ${_resCard('mbb_carbon_daily_out', 'Methanol (Carbon)', 'kg/d')}
              </div>
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px; margin-top:15px;">
                ${_resCard('mbb_O2_BOD_out', 'O₂ Required (BOD)', 'kgO₂/d')}
                ${_resCard('mbb_SOTE_bod', 'SOTE (BOD)', '%')}
                ${_resCard('mbb_AOTE_bod', 'AOTE (BOD)', '%')}
                ${_resCard('mbb_blower_bod', 'Blower P (BOD)', 'bar')}
                
                ${_resCard('mbb_O2_nitrif_out', 'O₂ Required (Nitrif)', 'kgO₂/d')}
                ${_resCard('mbb_AOTE_nitrif', 'AOTE (Nitrif)', '%')}
                ${_resCard('mbb_PB2', 'Blower P (Nitrif)', 'bar')}
                ${_resCard('mbb_PD', 'Mid-depth Press.', 'kPa')}
                
                ${_resCard('mbb_Cs', 'DO Saturation', 'mg/L')}
                ${_resCard('mbb_alk_to_add', 'Alk. to Add', 'mg/L')}
                ${_resCard('mbb_alk_daily', 'Daily CaCO₃', 'kg/d')}
                ${_resCard('mbb_alk_nahco3', 'Daily NaHCO₃', 'kg/d')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 4: GRAPHS (FIX #11 & #12) -->
    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <div id="mbb-t4" class="tp">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div class="card">
          <div class="card-hd"><div class="card-hd-t">Denitrification SARR/SALR</div></div>
          <div class="card-body" style="height:300px;"><canvas id="mbb_chart_denitrif"></canvas></div>
        </div>
        <div class="card">
          <div class="card-hd"><div class="card-hd-t">BOD Removal SARR/SALR</div></div>
          <div class="card-body" style="height:300px;"><canvas id="mbb_chart_bod"></canvas></div>
        </div>
      </div>
      <div class="card mt">
        <div class="card-hd"><div class="card-hd-t">Nitrification SARR (M&E 5th Ed, Eqn 9-48)</div></div>
        <div class="card-body" style="height:350px;"><canvas id="mbb_chart_nitrif"></canvas></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 5: DIAGRAMS -->
    <!-- ══════════════════════════════════════════════════════════════════════════ -->
    <div id="mbb-t5" class="tp">
      <div class="card">
        <div class="card-hd"><div class="card-hd-t">Process Diagrams</div></div>
        <div class="card-body" style="display:flex; flex-direction:column; gap:20px; align-items:center;">
          <img src="img/image2.png" style="max-width:100%; border:1px solid #e2e8f0; border-radius:8px;" alt="Diagram 2">
          <img src="img/image6.png" style="max-width:100%; border:1px solid #e2e8f0; border-radius:8px;" alt="Diagram 6">
        </div>
      </div>
    </div>

    <!-- HIDDEN FIELDS FOR LOGIC ENGINE -->
    <div style="display:none;">
      ${_hide('mbb_SARR15')} ${_hide('mbb_pre_slope')} ${_hide('mbb_pre_intercept')}
      ${_hide('mbb_post_slope')} ${_hide('mbb_post_intercept')}
      ${_hide('mbb_bod_slope')} ${_hide('mbb_bod_intercept')}
      ${_hide('mbb_air_bod')} ${_hide('mbb_blower_bod')}
      ${_hide('mbb_air_nitrif_m3')} ${_hide('mbb_air_nitrif_nm3')}
      ${_hide('mbb_alk_nitrif_const')} ${_hide('mbb_alk_denitrif_const')}
      ${_hide('mbb_alk_daily')} ${_hide('mbb_alk_nahco3')}
      ${_hide('mbb_carbon_dosage')} ${_hide('mbb_carbon_daily')}
      ${_hide('mbb_theta_sarr')} ${_hide('mbb_NH4Ne_SARRmax')}
      ${_inp('mbb_QR_est', '', 1.5, '')}
      ${_inp('mbb_AOTE_SOTE', '', 0.5, '')}
    </div>
  </div>`;
}
