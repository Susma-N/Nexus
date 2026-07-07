/* ══════════════════════════════════════════════════════════════════════════════
   MBR DESIGN ENGINE v2.0 — Aapaavani NEXUS
   Complete Replication of: MBR_Process_Design_Calculations.xlsx (7 Sheets)
   References: M&E 5th Ed. | WEF MOP No. 36 | WRRF 6th Ed. | Nalco 4th Ed.
   Architecture: Namespace-isolated MBREngine with reactive event binding
   ══════════════════════════════════════════════════════════════════════════════ */

const MBREngine = {

  /* ═══ CONSTANTS — Sheet 2, Section IV ═══ */
  C: {
    f_BOD5: 0.68,        // Ratio of BOD5 to BODu
    BODu_VSS: 1.42,      // kg BODu/kg VSS
    gamma_H2O: 9.79,     // kN/m³ Specific Weight of water
    MW_air: 28.97,        // Molecular Weight of Air
    MW_O2: 32.0,          // Molecular Weight of Oxygen
    theta_O2: 1.024,      // Temp Coefficient for O2 transfer rate
    Css20: 9.17,          // Saturation D.O. at 20°C & 1 atm, mg/L
    Pstd: 1.013,          // Normal Pressure, bar
    Tstd: 0.0,            // Normal Temperature, °C
    O2_mol: 0.209,        // O2 mole fraction in Air
    R: 8314,              // Gas constant, J/(kmol·K) — for Patm eqn
    // SDNR lookup table [rbCOD/bCOD, b0, b1] — M&E 5th Ed.
    SDNR_TBL: [
      [0.1, 0.186, 0.078],
      [0.2, 0.213, 0.118],
      [0.3, 0.235, 0.141],
      [0.4, 0.242, 0.152],
      [0.5, 0.270, 0.162]
    ],
    // Membrane Flux vs Temp data points — M&E Fig. 8-57 / Sheet 6
    FLUX_DATA: [[5,11],[10,14.5],[15,18],[20,22],[25,25.5]],
  },

  /* ═══ CHART INSTANCES ═══ */
  charts: { flux: null, satDO: null },

  /* ═══ READ ALL DOM INPUTS ═══ */
  read() {
    const v = id => { const e = document.getElementById(id); return e ? (e.tagName === 'SELECT' ? e.value : parseFloat(e.value) || 0) : 0; };
    const s = id => { const e = document.getElementById(id); return e ? e.value : 'rectangular'; };
    return {
      // WW Parameters (Sheet 2, Sec I)
      Qo: v('mbr_Q'), BODo: v('mbr_BOD'), sBODo: v('mbr_sBOD'),
      CODo: v('mbr_COD'), sCODo: v('mbr_sCOD'), rbCODo: v('mbr_rbCOD'),
      TSSo: v('mbr_TSS'), VSSo: v('mbr_VSS'), TKNo: v('mbr_TKN'),
      Fs: v('mbr_Fs'), NH4o: v('mbr_NH4'), Alko: v('mbr_Alk'), Tww: v('mbr_Tww'),
      bCOD_BOD: v('mbr_bCOD_BOD'),
      // Kinetics — Heterotrophic (Sheet 2, Sec II)
      Y: v('mbr_Y'), mu_m20: v('mbr_mu_m'), kd20: v('mbr_kd'), Ks20: v('mbr_Ks'),
      fd: v('mbr_fd'), th_mu: v('mbr_th_mu'), th_kd: v('mbr_th_kd'),
      // Kinetics — Nitrification (Sheet 2, Sec III)
      Yn: v('mbr_Yn'), mu_n20: v('mbr_mu_n'), kdn20: v('mbr_kdn'),
      Kn20: v('mbr_Kn'), Ko20: v('mbr_Ko'),
      th_mun: v('mbr_th_mun'), th_kdn: v('mbr_th_kdn'), th_Kn: v('mbr_th_Kn'),
      // Membrane (Sheet 3)
      f_pk: v('mbr_fpk'), SADM: v('mbr_SADM'),
      // Aer Tank (Sheet 4)
      MLSS: v('mbr_MLSS'), Xw: v('mbr_Xw'), DOo: v('mbr_DO'),
      Ntank: v('mbr_Ntank'), depth: v('mbr_depth'), LW: v('mbr_LW'),
      FB: v('mbr_FB'), shape: s('mbr_shape'),
      BODe: v('mbr_BODe'), TSSe: v('mbr_TSSe'), NH4e: v('mbr_NH4e'),
      // O2/Air (Sheet 4, Sec VI)
      SOTE: v('mbr_SOTE') / 100, Elev: v('mbr_Elev'), Tamb: v('mbr_Tamb'),
      alpha: v('mbr_alpha'), beta: v('mbr_beta'), F_foul: v('mbr_F_foul'),
      ddiff: v('mbr_ddiff'), DPdiff: v('mbr_DPdiff'),
      // Alkalinity (Sheet 4, Sec VIII)
      AlkEff: v('mbr_AlkEff'), AlkRate: v('mbr_AlkNitrif_rate'),
      // Denitrification (Sheet 5)
      Ne: v('mbr_Ne'), NRAS: v('mbr_NRAS'), th_SDNR: v('mbr_th_SDNR'),
      MixE: v('mbr_MixE'), ExNitrif: v('mbr_ExNitrif') / 100,
      Nan: v('mbr_Nan'), anDepth: v('mbr_anDepth'), anLW: v('mbr_anLW'),
      anFB: v('mbr_anFB'), anShape: s('mbr_anShape'),
    };
  },

  /* ═══ TEMPERATURE-CORRECTED KINETICS ═══ */
  kinetics(I) {
    const dT = I.Tww - 20;
    return {
      mu_m: I.mu_m20 * Math.pow(I.th_mu, dT),
      kd:   I.kd20   * Math.pow(I.th_kd, dT),
      mu_n: I.mu_n20 * Math.pow(I.th_mun, dT),
      kdn:  I.kdn20  * Math.pow(I.th_kdn, dT),
      Kn:   I.Kn20   * Math.pow(I.th_Kn, dT),
      Ko:   I.Ko20, // θ = 1.0
    };
  },

  /* ═══ MEMBRANE MODULE — Sheet 3 ═══ */
  calcMembrane(I) {
    const J = 0.73 * I.Tww + 7.25; // Sheet 6 trendline, L/m²/h
    const AM = (I.Qo * 1000 / 24) / J; // m²
    const VM = AM / I.f_pk;             // m³
    const scourM3 = I.SADM * AM;        // m³/hr actual
    
    // Calculate Patm for standard air conversion
    const Tamb_K = I.Tamb + 273.15;
    const Patm = 1.013 * Math.exp(-9.81 * this.C.MW_air * I.Elev / (this.C.R * Tamb_K));
    const scourNm3 = scourM3 * (273.15 / (I.Tww + 273.15)) * (Patm / this.C.Pstd);
    return { J, AM, VM, scourM3, scourNm3 };
  },

  /* ═══ SATURATION DO — Sheet 7 Polynomial ═══ */
  satDO(T) {
    return -0.00007044 * Math.pow(T, 3) + 0.00765 * Math.pow(T, 2) - 0.4006 * T + 14.6;
  },

  /* ═══ NOx ITERATIVE SOLVER — Sheet 4 Goal Seek ═══ */
  solveNOx(I, K) {
    const { Qo, Y, Yn, fd, Ks20, TKNo, NH4e, bCODo } = I;
    const { mu_m, kd, kdn } = K;
    const SRT = I._SRT;
    const S = Ks20 * (1 + kd * SRT) / (SRT * (mu_m - kd) - 1);
    let NOx = TKNo * 0.8; // 80% initial estimate per Excel instruction
    let Px_bio = 0;
    for (let i = 0; i < 200; i++) {
      const t1 = (Qo * Y * (bCODo - S) / 1000) / (1 + kd * SRT);
      const t2 = fd * kd * (Qo * Y * (bCODo - S) / 1000) * SRT / (1 + kd * SRT);
      const t3 = (Qo * Yn * NOx / 1000) / (1 + kdn * SRT);
      Px_bio = t1 + t2 + t3;
      const NOx_new = TKNo - NH4e - (0.12 * Px_bio * 1000 / Qo);
      if (Math.abs(NOx_new - NOx) < 1e-6) { NOx = NOx_new; break; }
      NOx = NOx_new;
    }
    return { NOx: Math.max(NOx, 0), Px_bio, S };
  },

  /* ═══ TAN ITERATIVE SOLVER — Sheet 5 Goal Seek ═══ */
  solveTan(I, bio) {
    const { Qo, BODo, Tww, th_SDNR, ExNitrif, rbCODo, NRAS } = I;
    const { bCODo, Xan_b, NOx_rate } = bio;
    const rbCOD_bCOD = rbCODo / bCODo;
    let tan_hr = 0.7;
    for (let i = 0; i < 200; i++) {
      const Van = Qo * tan_hr / 24;
      const FM_an = (Qo * BODo) / (Van * Xan_b);
      const SDNR_20 = this._calcSDNR20(rbCOD_bCOD, FM_an);
      const SDNR_T = SDNR_20 * Math.pow(th_SDNR, Tww - 20);
      const cap = Van * SDNR_T * Xan_b / 1000;
      const target = NOx_rate * (1 + ExNitrif);
      if (Math.abs(cap - target) < 0.01) break;
      tan_hr = tan_hr * target / cap;
      tan_hr = Math.max(0.01, Math.min(tan_hr, 10));
    }
    return tan_hr;
  },

  /* ═══ SDNR INTERPOLATION — M&E 5th Ed. ═══ */
  _calcSDNR20(ratio, FM) {
    const T = this.C.SDNR_TBL;
    // Compute SDNR for each table entry at this F:M, then interpolate by ratio
    let lo = 0, hi = T.length - 1;
    for (let i = 0; i < T.length; i++) {
      if (T[i][0] <= ratio) lo = i;
      if (T[i][0] >= ratio) { hi = i; break; }
    }
    const sdnrAt = (idx) => T[idx][1] + T[idx][2] * Math.log(FM);
    if (lo === hi) return sdnrAt(lo);
    const f = (ratio - T[lo][0]) / (T[hi][0] - T[lo][0]);
    return sdnrAt(lo) + f * (sdnrAt(hi) - sdnrAt(lo));
  },

  /* ═══ MASTER CALCULATION ENGINE ═══ */
  runSizing() {
    try {
      const el = document.getElementById('mbr-module');
      if (!el) return;
      const I = this.read();
      const K = this.kinetics(I);

      // ── Wastewater characterization ──
      const bCODo = I.bCOD_BOD * I.BODo;
      I.bCODo = bCODo;
    const bpCOD_pCOD = (I.bCOD_BOD * (I.BODo - I.sBODo)) / (I.CODo - I.sCODo);
    const nbVSS = (1 - bpCOD_pCOD) * I.VSSo;
    const iTSS = I.TSSo - I.VSSo;

    // ── Membrane (Sheet 3) ──
    const mem = this.calcMembrane(I);

    // ── Design SRT (Sheet 4, Sec II) ──
    const mn = (K.mu_n * I.NH4e / (K.Kn + I.NH4e)) * (I.DOo / (K.Ko + I.DOo)) - K.kdn;
    const SRT_theo = 1 / mn;
    const SRT = SRT_theo * I.Fs;
    I._SRT = SRT;

    // ── Substrate & NOx (Sheet 4, Sec III-IV) ──
    const S = I.Ks20 * (1 + K.kd * SRT) / (SRT * (K.mu_m - K.kd) - 1);
    const nox = this.solveNOx(I, K);

    // ── VSS/TSS production (Sheet 4, Sec IV) ──
    const Px_VSS = nox.Px_bio + (I.Qo * nbVSS / 1000);
    const Px_TSS = Px_VSS + (I.Qo * iTSS / 1000);
    const mass_MLVSS = Px_VSS * SRT;
    const mass_MLSS = Px_TSS * SRT;

    // ── Aeration tank (Sheet 4, Sec V) ──
    const Vaer_min = mass_MLSS * 1000 / I.MLSS;
    const VM_per_tank = mem.VM / I.Ntank;
    const Vtank = Vaer_min / I.Ntank;
    let tankW, tankL;
    if (I.shape === 'cylindrical') { tankW = Math.sqrt(4 * Vtank / (Math.PI * I.depth)); tankL = tankW; }
    else { tankW = Math.sqrt(Vtank / (I.depth * I.LW)); tankL = tankW * I.LW; }
    const actW = Math.ceil(tankW); const actL = Math.ceil(tankL);
    const Vaer_act = (I.shape === 'cylindrical') ? (Math.PI / 4 * actW * actW * I.depth) : (actW * actL * I.depth);
    const HRT = Vaer_act * I.Ntank * 24 / I.Qo;
    const MLVSS = I.MLSS * (mass_MLVSS / mass_MLSS);
    const VLR = (I.Qo * I.BODo / 1000) / (Vaer_act * I.Ntank);
    const FM = (I.Qo * I.BODo) / (MLVSS * Vaer_act * I.Ntank);
    const Qw = (I.Ntank * Vaer_act * I.MLSS) / (SRT * I.Xw);
    const wallH = I.depth + I.FB;

    // ── O₂ / Air / Blower (Sheet 4, Sec VI-VII) ──
    const Cs = this.satDO(I.Tww);
    const Tamb_K = I.Tamb + 273.15;
    const Patm = 1.013 * Math.exp(-9.81 * this.C.MW_air * I.Elev / (this.C.R * Tamb_K));
    const PD = Patm + (this.C.gamma_H2O * I.ddiff / 2) / 100;
    const rho_air = this.C.MW_air * this.C.Pstd * 100 / (8.314 * (this.C.Tstd + 273.15));
    const mO2 = I.Qo / 1000 * (I.BODo - I.BODe) / this.C.f_BOD5 - this.C.BODu_VSS * Px_VSS + 4.57 * I.Qo / 1000 * nox.NOx;
    const Cs_eff = I.beta * Cs * (PD / Patm) - I.DOo;
    const AOTE = I.SOTE * I.alpha * I.F_foul * (Cs_eff / this.C.Css20) * Math.pow(this.C.theta_O2, I.Tww - 20);
    const airNm3 = (mO2 / AOTE) * this.C.MW_air / (this.C.O2_mol * this.C.MW_O2 * rho_air * 24);
    const PB2 = Patm + I.DPdiff + this.C.gamma_H2O * I.ddiff / 100;
    const airM3 = airNm3 * (this.C.Pstd / PB2) * ((I.Tww + 273.15) / (this.C.Tstd + 273.15));

    // ── Alkalinity (Sheet 4, Sec VIII-IX) ──
    const AlkNitrif = I.AlkRate * nox.NOx;
    const AlkNeed = AlkNitrif + I.AlkEff - I.Alko;
    const AlkNeed_kgd = AlkNeed * I.Qo / 1000;
    const NaHCO3 = AlkNeed_kgd * 84 / 50;

    // ── Denitrification (Sheet 5) ──
    const RAS = (nox.NOx / I.NRAS) - 1;
    const Pxb = (I.Qo * I.Y * (bCODo - nox.S) / 1000) / (1 + K.kd * SRT);
    const MLSS_AN = (RAS / (RAS + 1)) * I.MLSS;
    const Xaer_b = Pxb / Px_VSS;
    const Xan_b = Xaer_b * MLSS_AN;
    const QAN = RAS * I.Qo;
    const NOx_rate = QAN * I.NRAS / 1000;

    // Solve anoxic detention time
    const bioForTan = { bCODo, Xan_b, NOx_rate };
    const tan_hr = this.solveTan(I, bioForTan);
    const Van = I.Qo * tan_hr / 24;
    const Van_per_tank = Van / I.Nan;
    let anW, anL;
    if (I.anShape === 'cylindrical') { anW = Math.sqrt(4 * Van_per_tank / (Math.PI * I.anDepth)); anL = anW; }
    else { anW = Math.sqrt(Van_per_tank / (I.anDepth * I.anLW)); anL = anW * I.anLW; }
    const anActW = Math.ceil(anW); const anActL = Math.ceil(anL);
    const Van_act = (I.anShape === 'cylindrical') ? (Math.PI / 4 * anActW * anActW * I.anDepth) : (anActW * anActL * I.anDepth);
    const tan_actual = Van_act * I.Nan * 24 / I.Qo;
    const anWallH = I.anDepth + I.anFB;

    // SDNR at final values
    const rbCOD_bCOD = I.rbCODo / bCODo;
    const FM_an = (I.Qo * I.BODo) / (Van * Xan_b);
    const SDNR_20 = this._calcSDNR20(rbCOD_bCOD, FM_an);
    const SDNR_T = SDNR_20 * Math.pow(I.th_SDNR, I.Tww - 20);

    // Final calcs with denitrification
    const O2_credit = 2.86 * I.Qo * (nox.NOx - I.Ne) / 1000;
    const mO2_rev = mO2 - O2_credit;
    const airNm3_rev = airNm3 * (mO2_rev / mO2);
    const airM3_rev = airM3 * (mO2_rev / mO2);
    const AlkProd = 3.57 * (nox.NOx - I.Ne);
    const AlkNeed_dn = AlkNitrif + I.AlkEff - I.Alko - AlkProd;
    const AlkNeed_dn_kgd = AlkNeed_dn * I.Qo / 1000;
    const NaHCO3_dn = AlkNeed_dn_kgd * 84 / 50;
    const MixPower = I.MixE * Van / 1000;
    const Qw_rev = ((I.Ntank * Vaer_act * I.MLSS) + (I.Nan * Van_act * MLSS_AN)) / (SRT * I.Xw);

    // ── Pack results ──
    const R = {
      // Characterization
      bCODo, bpCOD_pCOD, nbVSS, iTSS, rbCOD_bCOD,
      // Membrane
      ...mem,
      // SRT
      mn, SRT_theo, SRT, mu_n: K.mu_n, kdn: K.kdn, Kn: K.Kn,
      // Bio
      mu_m: K.mu_m, kd: K.kd, S: nox.S, NOx: nox.NOx, Px_bio: nox.Px_bio,
      Px_VSS, Px_TSS, mass_MLVSS, mass_MLSS,
      // Tank
      Vaer_min, Vaer_act, Vtank, actW, actL, wallH, HRT, VLR, MLVSS, FM, Qw,
      VM_per_tank,
      // O2/Air
      Cs, Patm, PD, rho_air, mO2, AOTE, airNm3, airM3, PB2,
      // Alk
      AlkNitrif, AlkNeed, AlkNeed_kgd, NaHCO3,
      // Denitrification
      RAS, Pxb, MLSS_AN, Xaer_b, Xan_b, QAN, NOx_rate,
      tan_hr, Van, Van_per_tank, anW: anActW, anL: anActL, Van_act, tan_actual, anWallH,
      FM_an, SDNR_20, SDNR_T,
      // Final
      O2_credit, mO2_rev, airNm3_rev, airM3_rev, AlkProd,
      AlkNeed_dn, AlkNeed_dn_kgd, NaHCO3_dn, MixPower, Qw_rev,
      // Pass-through
      Ntank: I.Ntank, Nan: I.Nan, Tww: I.Tww, Fs: I.Fs,
      f_pk: I.f_pk, SADM: I.SADM, Elev: I.Elev, ddiff: I.ddiff,
    };

    this.render(R);
    this.updateCharts(I.Tww);
    } catch(err) {
      console.error("MBR Calculation Error: ", err);
    }
  },

  /* ═══ RENDER RESULTS TO DOM ═══ */
  render(R) {
    const sv = (id, val) => {
      const e = document.getElementById(id);
      if (e) {
        if (e.textContent !== String(val)) {
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
            void cell.offsetWidth; // trigger reflow
            cell.classList.add('mbr-flash');
          }
        }
      }
    };
    const n = (v, d) => (typeof v === 'number' && isFinite(v)) ? (d !== undefined ? v.toFixed(d) : fi(Math.round(v))) : '—';

    // ── KPI CARDS ──
    sv('kpi_AM', n(R.AM));       sv('kpi_J', n(R.J, 1));
    sv('kpi_SRT', n(R.SRT, 1));  sv('kpi_NOx', n(R.NOx, 2));
    sv('kpi_airRev', n(R.airNm3_rev)); sv('kpi_NaHCO3', n(R.NaHCO3_dn));
    sv('kpi_Vaer', n(R.Vaer_act * R.Ntank)); sv('kpi_Van', n(R.Van));

    // ── Sheet 3: Membrane ──
    sv('r_J', n(R.J, 2));        sv('r_AM', n(R.AM));
    sv('r_VM', n(R.VM));         sv('r_scourM3', n(R.scourM3));
    sv('r_scourNm3', n(R.scourNm3)); sv('r_VMpt', n(R.VM_per_tank));

    // ── Sheet 4, Sec II: Design SRT ──
    sv('r_mun', n(R.mu_n, 4));   sv('r_kdn', n(R.kdn, 4));
    sv('r_Kn', n(R.Kn, 2));      sv('r_mn', n(R.mn, 4));
    sv('r_SRTtheo', n(R.SRT_theo, 2)); sv('r_SRT', n(R.SRT, 2));

    // ── Sheet 4, Sec III: Biomass ──
    sv('r_mum', n(R.mu_m, 2));   sv('r_kd', n(R.kd, 4));
    sv('r_bCODo', n(R.bCODo));   sv('r_S', n(R.S, 3));
    sv('r_Pxbio', n(R.Px_bio));  sv('r_NOx', n(R.NOx, 2));
    sv('r_bpCOD', n(R.bpCOD_pCOD, 3)); sv('r_nbVSS', n(R.nbVSS, 1));

    // ── Sheet 4, Sec V: VSS/TSS + Tank ──
    sv('r_PxVSS', n(R.Px_VSS));  sv('r_PxTSS', n(R.Px_TSS));
    sv('r_mMLVSS', n(R.mass_MLVSS)); sv('r_mMLSS', n(R.mass_MLSS));
    sv('r_Vmin', n(R.Vaer_min)); sv('r_Vact', n(R.Vaer_act));
    sv('r_tW', n(R.actW, 1));    sv('r_tL', n(R.actL, 1));
    sv('r_wallH', n(R.wallH, 1)); sv('r_HRT', n(R.HRT, 1));
    sv('r_VLR', n(R.VLR, 3));    sv('r_MLVSS', n(R.MLVSS));
    sv('r_FM', n(R.FM, 3));      sv('r_Qw', n(R.Qw));

    // ── Sheet 4, Sec VII: O2/Air ──
    sv('r_Cs', n(R.Cs, 1));      sv('r_Patm', n(R.Patm, 3));
    sv('r_PD', n(R.PD, 3));      sv('r_rhoAir', n(R.rho_air, 3));
    sv('r_mO2', n(R.mO2));       sv('r_AOTE', n(R.AOTE * 100, 2) + '%');
    sv('r_airNm3', n(R.airNm3)); sv('r_airM3', n(R.airM3));
    sv('r_PB2', n(R.PB2, 2));

    // ── Sheet 4, Sec IX: Alkalinity ──
    sv('r_AlkNit', n(R.AlkNitrif, 1)); sv('r_AlkNeed', n(R.AlkNeed, 1));
    sv('r_AlkKgd', n(R.AlkNeed_kgd)); sv('r_NaHCO3', n(R.NaHCO3));

    // ── Sheet 5: Denitrification ──
    sv('r_RAS', n(R.RAS, 2));    sv('r_Pxb', n(R.Pxb));
    sv('r_MLSSAN', n(R.MLSS_AN)); sv('r_Xaerb', n(R.Xaer_b, 4));
    sv('r_Xanb', n(R.Xan_b));   sv('r_QAN', n(R.QAN));
    sv('r_NOxRate', n(R.NOx_rate)); sv('r_FMan', n(R.FM_an, 3));
    sv('r_rbCOD', n(R.rbCOD_bCOD, 4)); sv('r_SDNR20', n(R.SDNR_20, 4));
    sv('r_SDNRT', n(R.SDNR_T, 4));
    sv('r_Van', n(R.Van));       sv('r_tanHr', n(R.tan_hr, 2));
    sv('r_VanPT', n(R.Van_per_tank)); sv('r_anW', n(R.anW, 1));
    sv('r_anL', n(R.anL, 1));    sv('r_anWallH', n(R.anWallH, 1));
    sv('r_VanAct', n(R.Van_act)); sv('r_tanAct', n(R.tan_actual, 2));

    // ── Sheet 5, Sec VI: Final Calcs ──
    sv('r_O2cr', n(R.O2_credit));  sv('r_mO2rev', n(R.mO2_rev));
    sv('r_mO2hr', n(R.mO2_rev / 24, 1));
    sv('r_airNrev', n(R.airNm3_rev)); sv('r_airMrev', n(R.airM3_rev));
    sv('r_AlkProd', n(R.AlkProd, 1)); sv('r_AlkDN', n(R.AlkNeed_dn, 1));
    sv('r_AlkDNkgd', n(R.AlkNeed_dn_kgd)); sv('r_NaHCO3dn', n(R.NaHCO3_dn));
    sv('r_MixPwr', n(R.MixPower, 1)); sv('r_QwRev', n(R.Qw_rev));

    // ── Checks ──
    const ckHtml = [
      this._ck(R.SRT >= 10 && R.SRT <= 30, 'Design SRT 10–30 days', n(R.SRT, 1) + ' d'),
      this._ck(R.HRT >= 3 && R.HRT <= 10, 'Aeration HRT 3–10 hr', n(R.HRT, 1) + ' hr'),
      this._ck(R.FM >= 0.05 && R.FM <= 0.25, 'F:M ratio 0.05–0.25', n(R.FM, 3)),
      this._ck(R.J >= 10 && R.J <= 35, 'Membrane flux 10–35 L/m²/h', n(R.J, 1)),
      this._ck(R.NOx > 0, 'NOx convergence positive', n(R.NOx, 2) + ' mg/L'),
      this._ck(R.mn > 0, 'Net nitrifier growth > 0', n(R.mn, 4)),
      this._ck(R.AOTE > 0.05, 'AOTE > 5%', n(R.AOTE * 100, 1) + '%'),
      this._ck(R.RAS >= 1 && R.RAS <= 10, 'RAS ratio 1–10', n(R.RAS, 2)),
      this._ck(R.tan_hr >= 0.3 && R.tan_hr <= 3, 'Anoxic HRT 0.3–3 hr', n(R.tan_hr, 2) + ' hr'),
    ].join('');
    sv('r_checks', ''); document.getElementById('r_checks').innerHTML = ckHtml;

    // Reactively update the graphs with the new temperature
    this.updateCharts(I.Tww);
  },

  _ck(ok, label, val) {
    const icon = ok ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    return `<div class="ck-card ${ok ? 'ok' : 'warn'}"><div class="ck-icon">${icon}</div><div class="ck-body"><div class="ck-label">${label}</div><div class="ck-val">${val}</div></div></div>`;
  },

  /* ═══ CHART.JS INITIALIZATION ═══ */
  initCharts() {
    if (typeof Chart === 'undefined') return;
    const ctx1 = document.getElementById('chart_flux');
    const ctx2 = document.getElementById('chart_satDO');
    if (!ctx1 || !ctx2) return;

    if (this.charts.flux) this.charts.flux.destroy();
    if (this.charts.satDO) this.charts.satDO.destroy();

    // Flux chart color scheme
    const amber = '#F5A623'; const teal = '#2ECDA7';
    const gridC = 'rgba(0,0,0,0.06)'; const txtC = '#666';

    // ── Chart 1: Membrane Flux vs Temperature ──
    const fluxData = this.C.FLUX_DATA;
    const trendX = []; const trendY = [];
    for (let t = 0; t <= 30; t++) { trendX.push(t); trendY.push(0.73 * t + 7.25); }

    this.charts.flux = new Chart(ctx1, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'M&E 5th Ed. Data Points', data: fluxData.map(p => ({ x: p[0], y: p[1] })),
            backgroundColor: amber, borderColor: amber, pointRadius: 6, pointHoverRadius: 9, showLine: false },
          { label: 'Trendline: J = 0.73T + 7.25', data: trendX.map((x, i) => ({ x, y: trendY[i] })),
            borderColor: teal, borderWidth: 2, pointRadius: 0, showLine: true, fill: false, borderDash: [6, 3] },
          { label: 'Design Point (Tww)', data: [{ x: 12, y: 0.73 * 12 + 7.25 }],
            backgroundColor: '#FF4444', borderColor: '#fff', pointRadius: 10, pointHoverRadius: 13, pointStyle: 'crossRot', borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Membrane Flux vs. Wastewater Temperature (Sheet 6)', color: '#111', font: { size: 13, weight: 700 } },
          legend: { labels: { color: txtC, font: { size: 10 } } },
          tooltip: { callbacks: { label: c => `T=${c.parsed.x}°C, J=${c.parsed.y.toFixed(1)} L/m²/h` } }
        },
        scales: {
          x: { title: { display: true, text: 'Wastewater Temperature, Tww (°C)', color: txtC }, grid: { color: gridC }, ticks: { color: txtC }, min: 0, max: 30 },
          y: { title: { display: true, text: 'Membrane Flux, J (L/m²/h)', color: txtC }, grid: { color: gridC }, ticks: { color: txtC }, min: 5, max: 30 }
        }
      }
    });

    // ── Chart 2: Saturation DO vs Temperature ──
    const doX = []; const doY = [];
    for (let t = 0; t <= 35; t++) { doX.push(t); doY.push(this.satDO(t)); }

    this.charts.satDO = new Chart(ctx2, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Sat. DO = -7.044e-5·T³ + 7.65e-3·T² - 0.4006·T + 14.6',
            data: doX.map((x, i) => ({ x, y: doY[i] })), borderColor: '#4FC3F7', borderWidth: 2.5, pointRadius: 0, fill: { target: 'origin', above: 'rgba(79,195,247,0.08)' }, showLine: true, tension: 0.4 },
          { label: 'Design Point (Tww)',
            data: [{ x: 12, y: this.satDO(12) }],
            backgroundColor: '#FF4444', borderColor: '#fff', pointRadius: 10, pointHoverRadius: 13, pointStyle: 'crossRot', borderWidth: 2, showLine: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Saturation D.O. vs. Wastewater Temperature (Sheet 7)', color: '#111', font: { size: 13, weight: 700 } },
          legend: { labels: { color: txtC, font: { size: 10 } } },
          tooltip: { callbacks: { label: c => c.parsed.y !== null ? `T=${c.parsed.x}°C, DO=${c.parsed.y.toFixed(2)} mg/L` : '' } }
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Temperature, T (°C)', color: txtC }, grid: { color: gridC }, ticks: { color: txtC }, min: 0, max: 35 },
          y: { title: { display: true, text: 'Saturation D.O. (mg/L)', color: txtC }, grid: { color: gridC }, ticks: { color: txtC }, min: 6, max: 15 }
        }
      }
    });
  },

  /* ═══ UPDATE CHART MARKERS ═══ */
  updateCharts(Tww) {
    if (!this.charts.flux || !this.charts.satDO) return;

    // Update flux chart design point
    const J_tww = 0.73 * Tww + 7.25;
    this.charts.flux.data.datasets[2].data = [{ x: Tww, y: J_tww }];
    this.charts.flux.data.datasets[2].label = `Design Point: T=${Tww.toFixed(1)}°C → J=${J_tww.toFixed(1)}`;
    this.charts.flux.update();

    // Update DO chart design point
    const Cs_tww = this.satDO(Tww);
    this.charts.satDO.data.datasets[1].data = [{ x: Tww, y: Cs_tww }];
    this.charts.satDO.data.datasets[1].label = `Design Point: T=${Tww.toFixed(1)}°C → Cs=${Cs_tww.toFixed(1)} mg/L`;
    this.charts.satDO.update();
  },

  /* ═══ INITIALIZE MODULE ═══ */
  init() {
    setTimeout(() => {
      this.initCharts();
      this.runSizing();
      // Bind reactive event listeners — input & change on all form elements
      const mod = document.getElementById('mbr-module');
      if (mod) {
        mod.addEventListener('input', () => this.runSizing());
        mod.addEventListener('change', () => this.runSizing());
      }
    }, 100);
  }
};


/* ══════════════════════════════════════════════════════════════════════════════
   HTML BUILDER — buildMBR()
   ══════════════════════════════════════════════════════════════════════════════ */
function buildMBR() {
  const Q = fi(G.Q);
  return `<div class="mwrap" id="mbr-module" oninput="if(typeof MBREngine !== 'undefined') MBREngine.runSizing();" onchange="if(typeof MBREngine !== 'undefined') MBREngine.runSizing();">
  <div class="mhdr"><div class="mh-left"><div class="mt-title">Membrane Bioreactor (MBR) Process Design<div class="mt-badge">MBR</div></div>
  <div class="mt-bread">MBR WW Treatment Process Design Calculations — S.I. Units · Ref: M&E 5th Ed. / WEF MOP 36 / WRRF 6th Ed.</div></div></div>

  <!-- ═══ KPI HIGHLIGHT CARDS ═══ -->
  <div class="mbr-kpi-row">
    ${_kpi('📐','Membrane Area','kpi_AM','m²','Total AM')}
    ${_kpi('🔵','Membrane Flux','kpi_J','L/m²/h','At design Tww')}
    ${_kpi('⏱️','Design SRT','kpi_SRT','days','Nitrification-controlled')}
    ${_kpi('🧪','NOx Converged','kpi_NOx','mg/L','Iterative solution')}
    ${_kpi('🌬️','Revised Air Flow','kpi_airRev','Nm³/hr','After denitrif. credit')}
    ${_kpi('⚖️','NaHCO₃ Dosing','kpi_NaHCO3','kg/d','With denitrification')}
    ${_kpi('🏗️','Aeration Volume','kpi_Vaer','m³','Total (all tanks)')}
    ${_kpi('↩️','Anoxic Volume','kpi_Van','m³','Pre-anoxic total')}
  </div>

  <!-- ═══ TAB BAR ═══ -->
  <div class="tab-bar">
    <div class="tab active" onclick="stab(this,'mbr-t2')">2. User Inputs & Constants</div>
    <div class="tab" onclick="stab(this,'mbr-t3')">3. Membrane Module</div>
    <div class="tab" onclick="stab(this,'mbr-t4')">4. BOD Removal - Nitrification</div>
    <div class="tab" onclick="stab(this,'mbr-t5')">5. Denitrification</div>
    <div class="tab" onclick="stab(this,'mbr-tG')">📊 Graphs</div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 2: USER INPUTS AND CONSTANTS                                    -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp active" id="mbr-t2">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">I. Wastewater Parameters / Characteristics</div><div class="card-hd-s">Enter values in yellow cells only</div></div><div class="card-body">
          <div class="g3">
            ${_inp('mbr_Q', 'Design WW Flow Rate, Qo', G.Q, 'm³/d')}
            ${_inp('mbr_BOD', 'Influent BOD, BODo', 140, 'mg/L')}
            ${_inp('mbr_sBOD', 'Influent sBOD, sBODo', 70, 'mg/L')}
            ${_inp('mbr_COD', 'Influent COD, CODo', 300, 'mg/L')}
            ${_inp('mbr_sCOD', 'Influent sCOD, sCODo', 132, 'mg/L')}
            ${_inp('mbr_rbCOD', 'Influent rbCOD, rbCODo', 80, 'mg/L')}
            ${_inp('mbr_TSS', 'Influent TSS, TSSo', 70, 'mg/L')}
            ${_inp('mbr_VSS', 'Influent VSS, VSSo', 60, 'mg/L')}
            ${_inp('mbr_TKN', 'Influent TKN, TKNo', 35, 'mg/L')}
            ${_inp('mbr_Fs', 'TKN peak/ave factor, FS', 1.5, '', 0.1)}
            ${_inp('mbr_NH4', 'Influent NH₄-N, NH₄-No', 25, 'mg/L')}
            ${_inp('mbr_Alk', 'Influent Alkalinity, Alko', 140, 'mg/L as CaCO₃')}
            ${_inp('mbr_Tww', 'Aeration WW Temp, Tww', 12, '°C', 1)}
            ${_inp('mbr_bCOD_BOD', 'ratio, bCOD/BOD', 1.6, '', 0.1)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">II. Biological Kinetic Coefficients — For BOD Removal</div></div><div class="card-body">
          <div class="g3">
            ${_inp('mbr_Y', 'Synth. Yield Coeff., Y', 0.45, 'kg VSS/kg bCOD', 0.01)}
            ${_inp('mbr_Ks', 'Half Veloc. Coeff., Ks', 8, 'mg/L', 0.5)}
            ${_inp('mbr_th_mu', 'Temp coeff., θ, for μₘ', 1.07, '', 0.001)}
            ${_inp('mbr_th_kd', 'Temp coeff., θ, for kd', 1.04, '', 0.001)}
            ${_inp('mbr_fd', 'Resid. biomass fract., fd', 0.15, '', 0.01)}
            ${_inp('mbr_mu_m', 'Max spec. gwth rate at 20°C, μₘ₂₀', 6, 'kg VSS/d/kg VSS', 0.1)}
            ${_inp('mbr_kd', 'Endog. Decay coeff. at 20°C, kd₂₀', 0.12, 'kg VSS/d/kg VSS', 0.01)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">III. Biological Kinetic Coefficients — For Nitrification</div></div><div class="card-body">
          <div class="g3">
            ${_inp('mbr_Yn', 'Synth. Yield Coeff., Yn', 0.15, 'kg VSS/kg NOx', 0.01)}
            ${_inp('mbr_th_mun', 'Temp coeff., θ, for μₘₙ', 1.072, '', 0.001)}
            ${_inp('mbr_th_kdn', 'Temp coeff., θ, for kdₙ', 1.029, '', 0.001)}
            ${_inp('mbr_th_Kn', 'Temp coeff., θ, for Kn', 1.0, '', 0.001)}
            ${_inp('mbr_Kn', 'Half Veloc. Coeff. at 20°C, Kn', 0.5, 'mg/L', 0.05)}
            ${_inp('mbr_Ko', 'Half Veloc. Coeff. at 20°C, Ko', 0.5, 'mg/L', 0.05)}
            ${_inp('mbr_mu_n', 'Max spec. gwth rate at 20°C, μₘₙ₂₀', 0.9, 'kg VSS/d/kg VSS', 0.01)}
            ${_inp('mbr_kdn', 'Endog. Decay coeff. at 20°C, kdₙ₂₀', 0.17, 'kg VSS/d/kg VSS', 0.01)}
          </div>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Discussion and References</div></div><div class="card-body mbr-ref">
          <p>For background information about Membrane Bioreactors (MBRs) see:</p>
          <ul>
            <li><em>Design of Water Resource Recovery Facilities</em>, 6th Ed., Sec. 12.6 Membrane Bioreactors</li>
            <li><em>Water and Wastewater Engineering: Design Principles and Practice</em>, Section 23.8, Membrane Bioreactor Design Practice</li>
            <li><em>Membrane Bioreactors</em>: WEF MOP No. 36, Chap. 4, Membrane Bioreactor Process Design</li>
            <li><em>Water Reuse: Issues, Technologies, and Applications</em>, Section 7.8, Analysis and Design of Membrane Bioreactor Processes</li>
          </ul>
          <p class="mbr-src">The source for the kinetic coefficient values in the tables at left is:<br><em>Introduction to Water Resource Recovery Facility Design</em>, 2nd Ed., Tables 6.1 and 6.2</p>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">IV. Constants Used in the Calculations</div></div><div class="card-body">
          <table class="mbr-tbl"><tbody>
            <tr><td>Ratio of BOD5 to BODu, f</td><td><b>0.68</b></td><td></td></tr>
            <tr><td>BODu equiv. of VSS</td><td><b>1.42</b></td><td>kg BODu/kg VSS</td></tr>
            <tr><td>Spec Wt. of water, γ_H₂O</td><td><b>9.79</b></td><td>kN/m³</td></tr>
            <tr><td>Mol. Wt. of Air</td><td><b>28.97</b></td><td></td></tr>
            <tr><td>Temp Coeff. for O₂ rate, θ</td><td><b>1.024</b></td><td></td></tr>
            <tr><td>Saturation D.O. at 20°C & 1 atm, Css</td><td><b>9.17</b></td><td>mg/L</td></tr>
            <tr><td>Normal Pressure</td><td><b>1.0</b></td><td>bar</td></tr>
            <tr><td>Normal Temperature</td><td><b>0.0</b></td><td>°C</td></tr>
            <tr><td>Mol. Wt. of Oxygen</td><td><b>32.0</b></td><td></td></tr>
            <tr><td>O₂ mole fraction in Air</td><td><b>0.209</b></td><td></td></tr>
          </tbody></table>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 3: MEMBRANE MODULE SIZING                                       -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="mbr-t3">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">I. Membrane / Membrane Module Parameters</div><div class="card-hd-s">Values typically available from membrane manufacturer or vendor — Enter values in yellow cells</div></div><div class="card-body">
          <div class="g2">
            ${_inp('mbr_fpk', 'Module packing density, f', 120, 'm²/m³', 10)}
            ${_inp('mbr_SADM', 'Specific Aer. Demand, SADM', 0.3, 'm³ air/hr/m² membrane', 0.05)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">II. Process Design Calculations</div><div class="card-hd-s">Done by worksheet — reactive</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_J', 'Membrane Flux, J', 'L/hr/m²')}
            ${_out('r_AM', 'Membrane Area, AM', 'm²')}
            ${_out('r_VM', 'Membrane Module Vol., VM', 'm³')}
            ${_out('r_scourM3', 'Scouring Air Flow Required', 'm³/hr')}
            ${_out('r_scourNm3', 'Scouring Air Flow (Std)', 'N m³/hr')}
            ${_out('r_VMpt', 'Module Vol. per Tank', 'm³/tank')}
          </div>
          <div class="alert al-i mt">This is the scouring air flow rate needed for the membrane module, typically provided by a coarse bubble diffuser system.</div>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Discussion and References</div></div><div class="card-body mbr-ref">
          <p>For background information about Membrane Bioreactors (MBRs) see:</p>
          <ul>
            <li><em>Design of Water Resource Recovery Facilities</em>, 6th Ed., Sec. 12.6</li>
            <li><em>Water and Wastewater Engineering</em>, Sec. 23.8</li>
            <li><em>Membrane Bioreactors</em>: WEF MOP No. 36, Chap. 4</li>
            <li><em>Water Reuse</em>, Sec. 7.8</li>
          </ul>
          <p>Values given for MBR specific area (module packing density) range from 150–334 m²/m³ in Table 8-35 of Metcalf & Eddy, <em>Wastewater Engineering Treatment and Resource Recovery</em>, 5th Ed., McGraw-Hill, 2014.</p>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">Equations Used in the Calculations</div></div><div class="card-body mbr-ref">
          <div class="eq-blk"><span class="eq-l">Membrane Flux, J</span><span class="eq-r">= 0.7300·T<sub>ww</sub> + 7.250 &nbsp; (L/hr/m², with T<sub>ww</sub> in °C)</span><div class="eq-where">(See Worksheet 6 for derivation of this equation)</div></div>
          <div class="eq-blk"><span class="eq-l">Membrane Area, A<sub>M</sub></span><span class="eq-r">= (Q<sub>o</sub> × 1000 / 24) / J</span></div>
          <div class="eq-blk"><span class="eq-l">Membrane Module Volume, V<sub>M</sub></span><span class="eq-r">= A<sub>M</sub> / f</span></div>
          <div class="eq-blk"><span class="eq-l">Scouring Air Flow</span><span class="eq-r">= (SADM)(A<sub>M</sub>) &nbsp; m³/hr</span></div>
          <div class="eq-blk"><span class="eq-l">Scouring Air (Std)</span><span class="eq-r">= (m³/hr)·[(T<sub>std</sub>+273.15)/(T<sub>ww</sub>+273.15)]·(P<sub>atm</sub>/P<sub>std</sub>) &nbsp; N m³/hr</span></div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 4: BOD REMOVAL & NITRIFICATION                                  -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="mbr-t4">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">I. User Inputs — Enter values in yellow cells only</div></div><div class="card-body">
          <div class="g3">
            ${_inp('mbr_MLSS', 'MLSS in Aer Tank, MLSS', 10000, 'mg/L', 500)}
            ${_inp('mbr_Xw', 'MLSS in Waste Sludge, Xw', 10000, 'mg/L', 500)}
            ${_inp('mbr_DO', 'DO in Aer. Tank, DOo', 2, 'mg/L', 0.5)}
            ${_inp('mbr_Ntank', 'Number of Aeration Tanks', 3, '', 1)}
            ${_inp('mbr_depth', 'Liquid Depth in Tank', 5, 'm', 0.5)}
            ${_inp('mbr_LW', 'Tank L:W ratio', 1, '', 0.5)}
            ${_inp('mbr_FB', 'Tank Freeboard', 0.5, 'm', 0.1)}
            <div class="f mbr-in"><label>Tank Shape</label><select id="mbr_shape"><option value="rectangular">Rectangular</option><option value="cylindrical">Cylindrical</option></select></div>
          </div>
          <div class="fg mt"><div class="fg-t">Target Effluent Concentrations</div>
          <div class="g3">
            ${_inp('mbr_BODe', 'BODe', 10, 'mg/L')}
            ${_inp('mbr_TSSe', 'TSSe', 10, 'mg/L')}
            ${_inp('mbr_NH4e', 'NH₄-Ne', 0.5, 'mg/L', 0.1)}
          </div></div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">VI. Air / Blower — Enter values in yellow cells only</div></div><div class="card-body">
          <div class="g3">
            ${_inp('mbr_SOTE', 'Std O₂ transf. Effic., SOTE', 25, '%', 1)}
            ${_inp('mbr_Elev', 'Design Elev. above Sea Level', 260, 'm', 10)}
            ${_inp('mbr_Tamb', 'Ambient air Temp., Tamb', 21, '°C', 1)}
            ${_inp('mbr_alpha', 'O₂ transfer ratio, α', 0.6, '', 0.05)}
            ${_inp('mbr_F_foul', 'Diffuser Fouling Factor, F', 0.8, '', 0.05)}
            ${_inp('mbr_beta', 'DO sat\'n ratio, β', 1.0, '', 0.05)}
            ${_inp('mbr_ddiff', 'Depth of Diffuser, ddiff', 4.8, 'm', 0.1)}
            ${_inp('mbr_DPdiff', 'Pressure drop, ΔPdiff', 0.030, 'bar', 0.005)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">VIII. Alkalinity — Enter value in yellow cell only</div></div><div class="card-body">
          <div class="g3">
            ${_inp('mbr_AlkEff', 'Target Effluent Alkalinity', 80, 'mg/L as CaCO₃', 5)}
            ${_inp('mbr_AlkNitrif_rate', 'Alk used for Nitrification', 7.14, 'g CaCO₃/g NH₃-N', 0.01)}
          </div>
          <div class="mbr-ref mt"><small>Equiv. Weight of CaCO₃ = 50 g/equiv. &nbsp;|&nbsp; Equiv. Weight of NaHCO₃ = 84 g/equiv.</small></div>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">II. Calculate Design SRT</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_mun', 'μₘₙ at Tww', 'kg VSS/d/kg VSS')}
            ${_out('r_kdn', 'kdₙ at Tww', 'kg VSS/d/kg VSS')}
            ${_out('r_Kn', 'Kn at Tww', 'mg/L')}
            ${_out('r_mn', 'μₙ (net growth rate)', 'kg VSS/d/kg VSS')}
            ${_out('r_SRTtheo', 'Theor. SRT', 'days')}
            ${_out('r_SRT', 'Design SRT', 'days', true)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">III. Biomass Production Rate &amp; IV. Nitrogen Oxidized</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_mum', 'μₘ at Tww', 'kg VSS/d/kg VSS')}
            ${_out('r_kd', 'kd at Tww', 'kg VSS/d/kg VSS')}
            ${_out('r_bCODo', 'bCODo', 'mg/L')}
            ${_out('r_S', 'Effluent bCOD, S', 'mg bCOD/L')}
            ${_out('r_Pxbio', 'Biomass Prod. Rate, Px,bio', 'kg VSS/day', true)}
            ${_out('r_bpCOD', 'bpCOD/pCOD', '')}
            ${_out('r_nbVSS', 'nbVSS', 'mg/L')}
            ${_out('r_NOx', 'NOx (converged iteratively)', 'mg/L', true)}
          </div>
          <div class="alert al-a mt">NOx solved via fixed-point iteration (Goal Seek equivalent). Initial estimate: 80% of TKNo. Convergence tolerance: 10⁻⁶ mg/L.</div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">V. Aeration Tank Calculations</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_PxVSS', 'Px,VSS', 'kg/d')}
            ${_out('r_PxTSS', 'Px,TSS', 'kg/d')}
            ${_out('r_mMLVSS', 'Mass of MLVSS', 'kg VSS')}
            ${_out('r_mMLSS', 'Mass of MLSS', 'kg TSS')}
            ${_out('r_Vmin', 'Req. Aeration Vol., Vaer,min', 'm³')}
            ${_out('r_Vact', 'Act. Aer. Vol., Vaer,act', 'm³/tank', true)}
            ${_out('r_tW', 'Tank Width', 'm')}
            ${_out('r_tL', 'Tank Length', 'm')}
            ${_out('r_wallH', 'Tank Wall Height', 'm')}
            ${_out('r_HRT', 'Aer. Detention Time, taer', 'hr')}
            ${_out('r_VLR', 'Vol. BOD Loading', 'kg BOD/d/m³')}
            ${_out('r_MLVSS', 'MLVSS in Tank', 'mg/L')}
            ${_out('r_FM', 'F:M ratio', 'kg BOD/d/kg MLVSS')}
            ${_out('r_Qw', 'Sludge Wasting Rate, Qw', 'm³/day')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">VII. Air Requirement / Blower Design Calculations</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_Cs', 'D.O. sat\'n at Tww, Cs', 'mg/L')}
            ${_out('r_Patm', 'Barom. Pressure, Patm', 'bar')}
            ${_out('r_PD', 'Pressure at Mid Depth, PD', 'bar')}
            ${_out('r_rhoAir', 'Standard Air Density, ρair', 'kg/m³')}
            ${_out('r_mO2', 'O₂ Utilization Rate, mO₂', 'kg/day', true)}
            ${_out('r_AOTE', 'Actual O₂ Transf. Effic., AOTE', '')}
            ${_out('r_airNm3', 'Des. Air Flow Rate', 'N m³/hr', true)}
            ${_out('r_airM3', 'Des. Air Flow Rate (delivery)', 'm³/hr')}
            ${_out('r_PB2', 'Blower Outlet Press., PB2', 'bar')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">IX. Calculation of Alkalinity Requirement</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_AlkNit', 'Alk. used for Nitrification', 'mg/L as CaCO₃')}
            ${_out('r_AlkNeed', 'Alkalinity needed', 'mg/L as CaCO₃')}
            ${_out('r_AlkKgd', 'Alkalinity needed', 'kg/day as CaCO₃')}
            ${_out('r_NaHCO3', 'Sodium Bicarbonate needed/day', 'kg/day NaHCO₃', true)}
          </div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB 5: PRE-ANOXIC DENITRIFICATION                                   -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="mbr-t5">
    <div class="mbr-split">
      <div class="mbr-left">
        <div class="card"><div class="card-hd"><div class="card-hd-t">Pre-Anoxic Denitrification — I. User Inputs</div><div class="card-hd-s">Enter values in yellow cells only. WW parameters from Worksheet 2 are also used.</div></div><div class="card-body">
          <div class="g3">
            ${_inp('mbr_Ne', 'Effluent Nitrate conc., Ne', 4.2, 'mg/L', 0.1)}
            ${_inp('mbr_NRAS', 'Nitrate conc. in RAS, NRAS', 4.2, 'mg/L', 0.1)}
            ${_inp('mbr_th_SDNR', 'Temp. Coeff. for SDNR', 1.026, '', 0.001)}
            ${_inp('mbr_MixE', 'Mixing Energy for Anoxic', 10, 'kW/10³ m³', 1)}
            ${_inp('mbr_ExNitrif', 'Design % Excess Nitrif. Capacity', 2, '%', 1)}
            ${_inp('mbr_Nan', 'No. of Anoxic Tanks, Nan', 3, '', 1)}
            ${_inp('mbr_anDepth', 'Liquid Depth in Tank', 5, 'm', 0.5)}
            ${_inp('mbr_anLW', 'Tank L:W ratio', 1, '', 0.5)}
            ${_inp('mbr_anFB', 'Tank Freeboard', 0.5, 'm', 0.1)}
            <div class="f mbr-in"><label>Anoxic Tank Shape</label><select id="mbr_anShape"><option value="rectangular">Rectangular</option><option value="cylindrical">Cylindrical</option></select></div>
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">SDNR Coefficient Lookup Table</div><div class="card-hd-s">Metcalf &amp; Eddy, 5th Ed.</div></div><div class="card-body">
          <table class="mbr-tbl"><thead><tr><th>rbCOD/bCOD</th><th>b₀</th><th>b₁</th></tr></thead><tbody>
            <tr><td>0.1</td><td>0.186</td><td>0.078</td></tr>
            <tr><td>0.2</td><td>0.213</td><td>0.118</td></tr>
            <tr><td>0.3</td><td>0.235</td><td>0.141</td></tr>
            <tr><td>0.4</td><td>0.242</td><td>0.152</td></tr>
            <tr><td>0.5</td><td>0.270</td><td>0.162</td></tr>
          </tbody></table>
          <div class="mbr-ref mt"><small>SDNR = b₀ + b₁·ln(F:M) &nbsp;|&nbsp; For F:M &lt; 0.5: SDNR₂₀ = 0.24·F:M</small><br><small>SDNR at Tww = (SDNR at 20°C)·θ<sub>SDNR</sub><sup>(Tww−20)</sup></small></div>
        </div></div>
      </div>

      <div class="mbr-right">
        <div class="card"><div class="card-hd"><div class="card-hd-t">II. RAS Ratio &amp; Active Biomass &nbsp;|&nbsp; III. NOx Feed Rate</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_RAS', 'RAS ratio, RAS', '')}
            ${_out('r_Pxb', 'Aer. Tank Active Biomass, Pxb', 'kg/d')}
            ${_out('r_MLSSAN', 'An. Tank MLSS, MLSS_AN', 'mg/L')}
            ${_out('r_Xaerb', 'Active Biomass Fraction, Xaer,b', '')}
            ${_out('r_Xanb', 'Anoxic Active Biomass, Xan,b', 'mg/L')}
            ${_out('r_QAN', 'Flow rate to Anoxic Tank', 'm³/d')}
            ${_out('r_NOxRate', 'NOx rate to Anoxic Tank', 'kg/day')}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">IV. SDNR Calculation</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_FMan', 'Anoxic Tank F/M ratio', 'kg BOD/d/kg MLVSS')}
            ${_out('r_rbCOD', 'rbCODo/bCODo ratio', '')}
            ${_out('r_SDNR20', 'SDNR at 20°C', 'kg NO₃-N/d/kg bio')}
            ${_out('r_SDNRT', 'SDNR at Tww', 'kg NO₃-N/d/kg bio', true)}
          </div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">V. Anoxic Tank Volume, Dimensions &amp; Detention Time</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_Van', 'Anoxic Tank min. Vol, Van', 'm³', true)}
            ${_out('r_tanHr', 'Min. Anoxic Det\'n Time, tan', 'hr')}
            ${_out('r_VanPT', 'Min. Vol. per tank, Vtank', 'm³')}
            ${_out('r_anW', 'Tank Width', 'm')}
            ${_out('r_anL', 'Tank Length', 'm')}
            ${_out('r_anWallH', 'Tank Wall Height', 'm')}
            ${_out('r_VanAct', 'Act. Tank Liq. Vol.', 'm³/tank')}
            ${_out('r_tanAct', 'Anoxic Detention Time, tan', 'hr')}
          </div>
          <div class="alert al-a mt">Anoxic detention time solved via iterative convergence (Goal Seek equivalent) until calculated % Excess Nitrification Capacity matches the design target.</div>
        </div></div>

        <div class="card"><div class="card-hd"><div class="card-hd-t">VI. Final Calculations — Revised Air, Alkalinity, Sludge</div></div><div class="card-body">
          <div class="mbr-res-grid">
            ${_out('r_O2cr', 'Oxygen Credit (nitrate reduction)', 'kg/day')}
            ${_out('r_mO2rev', 'Revised O₂ Utilization Rate', 'kg/day')}
            ${_out('r_mO2hr', 'Revised O₂ Rate', 'kg/hr')}
            ${_out('r_airNrev', 'Req\'d Air Flow Rate (Aer. Tank)', 'N m³/hr', true)}
            ${_out('r_airMrev', 'Req\'d Air Flow Rate (delivery)', 'm³/hr')}
            ${_out('r_AlkProd', 'Alkalinity Produced (denitrif.)', 'mg/L as CaCO₃')}
            ${_out('r_AlkDN', 'Alkalinity Needed', 'mg/L as CaCO₃')}
            ${_out('r_AlkDNkgd', 'Alkalinity Needed', 'kg/day as CaCO₃')}
            ${_out('r_NaHCO3dn', 'NaHCO₃ Needed/day', 'kg/day NaHCO₃', true)}
            ${_out('r_MixPwr', 'Req\'d Anoxic Mixing Power', 'kW')}
            ${_out('r_QwRev', 'Sludge Wasting Rate', 'm³/day')}
          </div>
        </div></div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <!-- TAB G: INTERACTIVE GRAPHS                                            -->
  <!-- ═════════════════════════════════════════════════════════════════════ -->
  <div class="tp" id="mbr-tG">
    <div class="g2">
      <div class="card"><div class="card-hd"><div class="card-hd-t">Membrane Flux vs. Temperature — Sheet 6</div><div class="card-hd-s">Derivation from M&E 5th Ed., Fig. 8-57. Trendline: J = 0.7300·T<sub>ww</sub> + 7.250</div></div><div class="card-body">
        <div class="mbr-chart-wrap"><canvas id="chart_flux"></canvas></div>
      </div></div>
      <div class="card"><div class="card-hd"><div class="card-hd-t">Saturation D.O. vs. Temperature — Sheet 7</div><div class="card-hd-s">Source: USGS DOTABLES. Polynomial: Cs = −7.044×10⁻⁵·T³ + 7.65×10⁻³·T² − 0.4006·T + 14.6</div></div><div class="card-body">
        <div class="mbr-chart-wrap"><canvas id="chart_satDO"></canvas></div>
      </div></div>
    </div>

    <div class="card mt"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div></div><div class="card-body"><div id="r_checks" class="ck-list"></div></div></div>
  </div>

</div>`;
}

/* ═══ HTML HELPER FUNCTIONS ═══ */
function _kpi(icon, label, id, unit, sub) {
  return `<div class="mbr-kpi"><div class="mbr-kpi-icon">${icon}</div><div class="mbr-kpi-val" id="${id}">—</div><div class="mbr-kpi-unit">${unit}</div><div class="mbr-kpi-label">${label}</div>${sub ? `<div class="mbr-kpi-sub">${sub}</div>` : ''}</div>`;
}

function _inp(id, label, val, unit, step) {
  return `<div class="f mbr-in"><label>${label}</label><div class="fuw"><input type="number" id="${id}" value="${val}"${step ? ' step="' + step + '"' : ''}>${unit ? '<div class="fu">' + unit + '</div>' : ''}</div></div>`;
}

function _out(id, label, unit, highlight) {
  return `<div class="mbr-res-cell${highlight ? ' mbr-res-hl' : ''}"><div class="mbr-res-label">${label}</div><div class="mbr-res-val"><span id="${id}">—</span>${unit ? ' <small>' + unit + '</small>' : ''}</div></div>`;
}
