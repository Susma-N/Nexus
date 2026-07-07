/* CMAS Nitrification-Denitrification-EBPR Module (Professional Tabbed UI) */
const CEB_STATE = {};

const CMAS_EbprEngine = {
  init() {
    this.bind();
    this.calc();
    this.initChart();
  },
  bind() {
    const inputs = document.querySelectorAll('#ceb-module input, #ceb-module select');
    inputs.forEach(i => i.addEventListener('input', () => this.calc()));
  },
  
  calc() {
    const get = (id, def=0) => {
        let v = parseFloat(document.getElementById(id)?.value);
        return isNaN(v) ? def : v;
    };
    const set = (id, val, dec=2) => { 
      const e = document.getElementById(id); 
      if(e) e.textContent = isNaN(val) ? '0' : val.toLocaleString(undefined, {minimumFractionDigits:dec, maximumFractionDigits:dec}); 
    };

    // --- TAB 2: User Inputs ---
    let Qo = get('ceb_Qo', 4000);
    let TSSo = get('ceb_TSSo', 70);
    let VSSo = get('ceb_VSSo', 60);
    let BODo = get('ceb_BODo', 160);
    let sBODo = get('ceb_sBODo', 70);
    let VFAo = get('ceb_VFAo', 15);
    let TKNo = get('ceb_TKNo', 35);
    let CODo = get('ceb_CODo', 300);
    let FS = get('ceb_FS', 1.5);
    let sCODo = get('ceb_sCODo', 132);
    let NH4No = get('ceb_NH4No', 25);
    let rbCODo = get('ceb_rbCODo', 75);
    let TPo = get('ceb_TPo', 6);
    let bCODoverBOD = get('ceb_bCODoverBOD', 1.6);
    let ALKo = get('ceb_ALKo', 140);
    let XTSS = get('ceb_XTSS', 3000);
    let Tww = get('ceb_Tww', 12);

    let fd = get('ceb_fd', 0.15);
    let Y = get('ceb_Y', 0.45);
    let Ks = get('ceb_Ks', 8.0);
    let Thetamum = get('ceb_Thetamum', 1.07);
    let MUM20 = get('ceb_MUM20', 6.0);
    let Thetakd = get('ceb_Thetakd', 1.04);
    let KD20 = get('ceb_KD20', 0.12);

    let mumn20 = get('ceb_mumn20', 0.9);
    let Yn = get('ceb_Yn', 0.15);
    let Thetamumn = get('ceb_Thetamumn', 1.072);
    let Thetakdn = get('ceb_Thetakdn', 1.029);
    let kdn20 = get('ceb_kdn20', 0.17);
    let ThetaKsn = get('ceb_ThetaKsn', 1.0);
    let KSN20 = get('ceb_KSN20', 0.5);

    let Ratio_f = get('ceb_Ratio_f', 0.67);
    let BODe = get('ceb_BODe', 15);
    let TSSe = get('ceb_TSSe', 15);
    let NH4Ne = get('ceb_NH4Ne', 0.5);
    let TSSw_Nitrif = get('ceb_TSSw_Nitrif', 6500);

    let TankDepth_Nitrif = get('ceb_TankDepth_Nitrif', 5.0);
    let TankLW_Nitrif = get('ceb_TankLW_Nitrif', 1.0);
    let TankNumber_Nitrif = get('ceb_TankNumber_Nitrif', 3);

    // --- TAB 3: Nitrification ---
    let mumnatTww = mumn20 * Math.pow(Thetamumn, Tww - 20);
    let KsnatTww = KSN20 * Math.pow(ThetaKsn, Tww - 20);
    let kdnatTww = kdn20 * Math.pow(Thetakdn, Tww - 20);
    let mumatTww = MUM20 * Math.pow(Thetamum, Tww - 20);
    let kdatTww = KD20 * Math.pow(Thetakd, Tww - 20);

    let NOX = TKNo * 0.8;
    let Pxbio = 0;
    
    let DO = 2.0; 
    let mn = (mumnatTww * NH4Ne / (KsnatTww + NH4Ne)) * (DO / (0.5 + DO)) - kdnatTww;
    let TheoSRT = 1 / mn;
    let SRT = FS * TheoSRT;
    
    let bCODo = bCODoverBOD * BODo;
    let S = Ks * (1 + (kdatTww * SRT)) / (SRT * (mumatTww - kdatTww) - 1);
    
    let diff = 100; let iter = 0;
    while(Math.abs(diff) > 0.001 && iter < 500) {
        Pxbio = (Qo * Y * (bCODo - S) * (1/1000) / (1 + (kdatTww * SRT))) +
                (fd * kdatTww * Qo * Y * (bCODo - S) * SRT * (1/1000) / (1 + (kdatTww * SRT))) +
                (Qo * Yn * NOX * (1/1000) / (1 + (kdnatTww * SRT)));
        let calc_NOX = TKNo - NH4Ne - (0.12 * Pxbio * 1000 / Qo);
        diff = NOX - calc_NOX;
        NOX -= diff * 0.5;
        iter++;
    }

    let bpCOD_pCOD = bCODoverBOD * (BODo - sBODo) / (CODo - sCODo);
    let nbVSSo = (1 - bpCOD_pCOD) * VSSo;
    let PxVSS = Pxbio + (Qo * nbVSSo / 1000);
    let PxTSS = (Pxbio / 0.85) + (Qo * nbVSSo / 1000) + (Qo * (TSSo - VSSo) / 1000);
    let Mass_MLVSS = PxVSS * SRT;
    let Mass_MLSS = PxTSS * SRT;
    let V_aer = Mass_MLSS * 1000 / XTSS;
    let V_tank_nitrif = V_aer / TankNumber_Nitrif;
    let Actual_W = Math.pow((V_tank_nitrif / TankDepth_Nitrif) / TankLW_Nitrif, 0.5);
    let Actual_L = (V_tank_nitrif / TankDepth_Nitrif) / Actual_W;
    let V_actual_nitrif = TankDepth_Nitrif * Actual_W * Actual_L;
    let t_aer = V_actual_nitrif * TankNumber_Nitrif * 24 / Qo;
    let MLVSS_Nitrif = XTSS * Mass_MLVSS / Mass_MLSS;
    let FM_Nitrif = Qo * BODo / (MLVSS_Nitrif * V_aer);
    
    let Qr_Nitrif = Qo * (XTSS - TSSo) / (TSSw_Nitrif - XTSS);
    let Qw_Nitrif = ((TankNumber_Nitrif * V_actual_nitrif * XTSS / SRT) - (Qo * TSSe)) / (TSSw_Nitrif - TSSe);
    let RASRatio = Qr_Nitrif / Qo;



    let DiffuserDepth = get('ceb_DiffDepth', 4.5);
    let SOTE = get('ceb_SOTE', 0.28);
    let Alphanitrif = get('ceb_Alpha', 0.60);
    let Factor_F = get('ceb_Factor_F', 0.90);
    let Beta = get('ceb_Beta', 0.95);
    let AtmosPress = get('ceb_AtmosPress', 1.01325);
    let CL = get('ceb_CL', 2.0);

    let PD = AtmosPress + (9.81 * (DiffuserDepth / 2) / 100);
    let Cs_20 = 9.08;
    let Cs_Tww = (-0.00007044*Math.pow(Tww,3)) + (0.00765*Math.pow(Tww,2)) - (0.4006*Tww) + 14.6;
    let Yobs = Y / (1 + (kdatTww * SRT));
    
    let sBODe = BODe - (Ratio_f * 1.42 * (Mass_MLVSS/Mass_MLSS) * TSSe);


    // --- TAB 4: Pre-Anoxic Denitrification ---
    let IR = get('ceb_IR', 3.0);
    let Xb = Qo * SRT * Y * bCODo / (V_aer * (1 + (kdatTww * SRT)));
    let NOX_rate = ((IR * Qo) + (RASRatio * Qo)) * NOX;
    
    let t_anox = get('ceb_tanox', 1.5);
    let Vanox = Qo * t_anox / 24;
    let FM_anox = Qo * BODo / (Vanox * Xb);
    let rbCOD_bCOD = rbCODo / bCODo;
    
    let SDNR20 = (0.24 * FM_anox);
    if(FM_anox >= 0.5) {
        SDNR20 = 0.05 + 0.1 * Math.log(FM_anox); 
    }
    let SDNR_Tww = SDNR20 * Math.pow(1.026, Tww - 20);
    let SDNR = SDNR_Tww - (0.029 * Math.log(FM_anox)) - 0.012; // IR=3 approx
    let NO3_red_cap = Vanox * SDNR * Xb; // g/d

    // Alkalinity calculation (moved here because it depends on NO3_red_cap)
    let AlkUsed = 7.14 * NOX - 3.57 * (Math.min(NOX_rate, NO3_red_cap) / 1000) * 1000 / Qo;
    // Note: Post-anoxic NO3 removal also recovers alkalinity, but is often small
    let AlkRes = get('ceb_AlkRes', 80);
    let NaHCO3 = (Qo * (AlkUsed + AlkRes - ALKo) / 1000) * 84 / 50;
    if(NaHCO3 < 0) NaHCO3 = 0;

    // O2 Calculation (moved here because it depends on NO3_red_cap)
    let O2_d = (Qo * (bCODo - S) / 1000) - 1.42 * Pxbio + 4.33 * (Qo * NOX / 1000);
    let NO3_reduced = Math.min(NOX_rate, NO3_red_cap) / 1000;
    O2_d -= 2.86 * NO3_reduced;
    let O2_Util = Math.max(0, O2_d / 24);
    let AOTE = SOTE * Alphanitrif * Factor_F * ((Beta * (PD/AtmosPress) * Cs_Tww - CL) / Cs_20) * Math.pow(Thetakd, Tww-20);
    
    let AirReq_Nm3 = (O2_Util / AOTE) * 28.97 / (0.209 * 32 * 1.2);

    // --- TAB 5: A2O EBPR Process ---
    let t_ana = get('ceb_tana', 1.0);
    let Vana = Qo * t_ana / 24;
    let rbCOD_infl = Qo * rbCODo;
    
    let NO3_RAS = get('ceb_NO3_RAS', 6.0);
    let rbCOD_NO3 = get('ceb_rbCOD_NO3', 5.2);
    let rbCOD_nitrate = NO3_RAS * RASRatio * Qo * rbCOD_NO3;
    let rbCOD_avail = Math.max(0, rbCOD_infl - rbCOD_nitrate);
    
    let vfa_rbCOD = VFAo / rbCODo;
    let rbCOD_P = (-65.53*Math.pow(vfa_rbCOD, 3)) + (125.22*Math.pow(vfa_rbCOD, 2)) - (82.644*vfa_rbCOD) + 27.393;
    let P_rem_EBPR = rbCOD_avail / rbCOD_P;
    let P_rem_conc = P_rem_EBPR / Qo;
    let P_rem_Synth = 0.015 * (Pxbio * 1000) / Qo;
    let Effl_P = TPo - P_rem_conc - P_rem_Synth;

    // --- TAB 6: Post-Anoxic ---
    let t_post = get('ceb_tpost', 2.0);
    let Vpost = Qo * t_post / 24;
    let YD = 0.17 + (0.08 - 0.17) * ((Tww - 10) / 10);
    let kdD = 0.02 + (0.04 - 0.02) * ((Tww - 10) / 10);
    let KsD = 0.5 + (0.5 - 0.5) * ((Tww - 10) / 10);
    let kD = 0.5 + (1.2 - 0.5) * ((Tww - 10) / 10);
    
    let S_meth = KsD * (1 + (kdD * SRT)) / (SRT * ((YD * kD) - kdD) - 1);
    let Yn_meth = YD / (1 + (kdD * SRT));
    let NO3_removed_post = Math.max(0, NOX - NO3_RAS);
    let MethanolDose = ((2.86 / (1 - (1.43 * Yn_meth))) * NO3_removed_post) + S_meth;

    // Output bindings
    set('ceb_NOx', NOX);
    set('ceb_TheoSRT', TheoSRT);
    set('ceb_SRT_out', SRT);
    set('ceb_bCODo_out', bCODo);
    set('ceb_S', S);
    set('ceb_Pxbio', Pxbio);
    set('ceb_PxVSS', PxVSS);
    set('ceb_PxTSS', PxTSS);
    set('ceb_Vaer', V_aer);
    set('ceb_taer', t_aer);
    set('ceb_MLVSS', MLVSS_Nitrif);
    set('ceb_FM', FM_Nitrif);
    set('ceb_Qr', Qr_Nitrif);
    set('ceb_Qw', Qw_Nitrif);
    set('ceb_NaHCO3', NaHCO3);
    set('ceb_O2', O2_Util);
    set('ceb_AOTE', AOTE, 4);
    set('ceb_Air', AirReq_Nm3);
    set('ceb_Xb', Xb);
    set('ceb_Vanox', Vanox);
    set('ceb_NOxRate', NOX_rate/1000);
    set('ceb_FManox', FM_anox);
    set('ceb_SDNR', SDNR, 4);
    set('ceb_NO3red', NO3_red_cap/1000);
    set('ceb_Vana', Vana);
    set('ceb_rbCOD_infl_out', rbCOD_infl/1000);
    set('ceb_rbCOD_NO3_out', rbCOD_nitrate/1000);
    set('ceb_rbCOD_avail', rbCOD_avail/1000);
    set('ceb_VFA_rbCOD', vfa_rbCOD);
    set('ceb_rbCOD_P', rbCOD_P);
    set('ceb_Prem', P_rem_EBPR/1000);
    set('ceb_Psynth', (P_rem_Synth*Qo)/1000);
    set('ceb_EfflP', Math.max(0, Effl_P), 3);
    set('ceb_Vpost', Vpost);
    set('ceb_YD', YD, 4);
    set('ceb_kdD', kdD, 4);
    set('ceb_Smeth', S_meth);
    set('ceb_Methanol', MethanolDose);
    
    this.updateChart(vfa_rbCOD, rbCOD_P);
  },

  updateChart(x_val, y_val) {
    if(!this.chart) return;
    this.chart.data.datasets[1].data = [{x: x_val, y: y_val}];
    this.chart.update();
  },

  initChart() {
    const ctx = document.getElementById('ebpr-chart');
    if(!ctx || !window.Chart) return;
    const pts = [];
    for(let x=0; x<=0.6; x+=0.02) {
      let y = (-65.53*Math.pow(x, 3)) + (125.22*Math.pow(x, 2)) - (82.644*x) + 27.393;
      pts.push({x, y});
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Correlation Curve',
          data: pts,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 3,
          fill: true,
          pointRadius: 0,
          tension: 0.4
        }, {
          label: 'Current Design Point',
          data: [],
          backgroundColor: '#ef4444',
          borderColor: '#b91c1c',
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 10,
          showLine: false,
          type: 'line'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            type: 'linear', 
            title: { display: true, text: 'VFA / rbCOD Ratio', color: '#334155', font: { weight: 'bold', size: 14 } },
            ticks: { color: '#475569', font: { size: 13 } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y: { 
            title: { display: true, text: 'rbCOD / P Removal (g/g)', color: '#334155', font: { weight: 'bold', size: 14 } },
            ticks: { color: '#475569', font: { size: 13 } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        },
        plugins: { 
          legend: { 
            labels: { 
              color: '#334155',
              font: { size: 13, weight: 'bold' },
              usePointStyle: true,
              padding: 20
            } 
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 14 },
            bodyFont: { size: 14 },
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `VFA/rbCOD: ${context.parsed.x.toFixed(3)}, rbCOD/P: ${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }
};

function buildCmasEbpr() {
  const _i = typeof _inp !== 'undefined' ? _inp : (id, l, v, u, step=0.1) => `<div class="mbr-in"><label>${l}</label><div class="fuw"><input type="number" id="${id}" value="${v}" step="${step}"><div class="fu">${u}</div></div></div>`;
  const _out = (id, label, unit, bold) =>
    `<div class="mbr-res-cell${bold ? ' mbr-res-bold' : ''}">
      <div class="mbr-res-label">${label}</div>
      <div class="mbr-res-val"><span id="${id}">—</span> <span class="mbr-res-unit">${unit}</span></div>
    </div>`;
  const _kpi = (icon, title, id, unit, sub) =>
    `<div class="mbr-kpi" style="display:flex; align-items:center; background:var(--bg-card-alt); border:1px solid var(--border-color); padding:15px; border-radius:8px; margin-bottom:15px;">
      <div class="mbr-kpi-icon" style="font-size:24px; margin-right:15px; background:var(--bg-body); width:48px; height:48px; display:flex; align-items:center; justify-content:center; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.05);">${icon}</div>
      <div class="mbr-kpi-info" style="flex:1;">
        <div class="mbr-kpi-t" style="font-size:12px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">${title}</div>
        <div class="mbr-kpi-v" style="font-size:24px; font-weight:700; color:var(--text-main); font-family:var(--fm);"><span id="${id}">—</span> <small style="font-size:14px; color:var(--text-muted); font-weight:normal;">${unit}</small></div>
        ${sub ? `<div class="mbr-kpi-sub" style="font-size:11px; color:var(--text-muted); margin-top:2px;">${sub}</div>` : ''}
      </div>
    </div>`;

  return `
    <div id="ceb-module" class="fade-in">
      <div class="mwrap">
        <div class="mhdr">
          <div class="mh-left">
            <div class="mt-title">CMAS Nitrification-Denitrification-EBPR Design</div>
            <div class="mt-bread">Unit Processes / A2O Process / Detailed Workbook</div>
          </div>
        </div>
        
        <div class="tab-bar" style="gap: 8px;">
          <div class="tab active" onclick="stab(this,'ceb-t2')">⚙️ Inputs</div>
          <div class="tab" onclick="stab(this,'ceb-t3')">🦠 Nitrification</div>
          <div class="tab" onclick="stab(this,'ceb-t4')">🔄 Pre-Anoxic</div>
          <div class="tab" onclick="stab(this,'ceb-t5')">🧪 A2O EBPR</div>
          <div class="tab" onclick="stab(this,'ceb-t6')">💧 Post-Anoxic</div>
          <div class="tab" onclick="stab(this,'ceb-t7')">📈 P Curve</div>
          <div class="tab" onclick="stab(this,'ceb-drw')">🖼️ Process Schematic</div>
        </div>
        
        <!-- Tab 2: Inputs -->
        <div class="tp active" id="ceb-t2">
          <div class="mbr-split">
            <div class="mbr-left">
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">Wastewater Parameters</div></div>
                <div class="card-body g3">
                  ${_i('ceb_Qo', 'Design Flow, Q<sub>o</sub>', 4000, 'm³/d', 100)}
                  ${_i('ceb_BODo', 'Infl. BOD<sub>o</sub>', 160, 'mg/L')}
                  ${_i('ceb_TKNo', 'Infl. TKN<sub>o</sub>', 35, 'mg/L')}
                  ${_i('ceb_TSSo', 'Infl. TSS<sub>o</sub>', 70, 'mg/L')}
                  ${_i('ceb_VSSo', 'Infl. VSS<sub>o</sub>', 60, 'mg/L')}
                  ${_i('ceb_sBODo', 'Infl. sBOD<sub>o</sub>', 70, 'mg/L')}
                  ${_i('ceb_CODo', 'Infl. COD<sub>o</sub>', 300, 'mg/L')}
                  ${_i('ceb_sCODo', 'Infl. sCOD<sub>o</sub>', 132, 'mg/L')}
                  ${_i('ceb_VFAo', 'Infl. Acetate, VFA<sub>o</sub>', 15, 'mg/L')}
                  ${_i('ceb_NH4No', 'Infl. NH4-N<sub>o</sub>', 25, 'mg/L')}
                  ${_i('ceb_rbCODo', 'Infl. rbCOD<sub>o</sub>', 75, 'mg/L')}
                  ${_i('ceb_TPo', 'Infl. TP<sub>o</sub>', 6.0, 'mg/L')}
                  ${_i('ceb_ALKo', 'Infl. Alkalinity', 140, 'mg/L')}
                  ${_i('ceb_Tww', 'Temperature, T<sub>ww</sub>', 12, '°C')}
                  ${_i('ceb_FS', 'Safety Factor, SF', 1.5, '')}
                  ${_i('ceb_bCODoverBOD', 'Ratio bCOD/BOD', 1.6, '')}
                  ${_i('ceb_Ratio_f', 'BOD5/BODu', 0.67, '')}
                  ${_i('ceb_AlkRes', 'Res. Alkalinity', 80, 'mg/L')}
                  ${_i('ceb_BODe', 'Effl. BOD', 15, 'mg/L')}
                  ${_i('ceb_TSSe', 'Effl. TSS', 15, 'mg/L')}
                  ${_i('ceb_NH4Ne', 'Effl. NH4-N', 0.5, 'mg/L')}
                </div>
              </div>
            </div>
            <div class="mbr-right">
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">Kinetic Coefficients</div></div>
                <div class="card-body g3">
                  ${_i('ceb_Y', 'Synth. Yield, Y', 0.45, 'g/g')}
                  ${_i('ceb_KD20', 'Endog Decay, k<sub>d</sub>', 0.12, '1/d', 0.01)}
                  ${_i('ceb_MUM20', 'Max Growth, μ<sub>m</sub>', 6.0, '1/d')}
                  ${_i('ceb_Ks', 'Half-Veloc, K<sub>s</sub>', 8.0, 'mg/L')}
                  ${_i('ceb_fd', 'Non-biodeg fract, f<sub>d</sub>', 0.15, 'g/g', 0.01)}
                  ${_i('ceb_Yn', 'Nitrif Yield, Y<sub>n</sub>', 0.15, 'g/g', 0.01)}
                  ${_i('ceb_kdn20', 'Nitrif Decay, k<sub>dn</sub>', 0.17, '1/d', 0.01)}
                  ${_i('ceb_mumn20', 'Nitrif Growth, μ<sub>mn</sub>', 0.9, '1/d', 0.01)}
                  ${_i('ceb_KSN20', 'Nitrif Half-Veloc, K<sub>n</sub>', 0.5, 'mg/L')}
                </div>
              </div>
              <div class="card" style="margin-top: 15px;">
                <div class="card-hd"><div class="card-hd-t">Design Assumptions</div></div>
                <div class="card-body g3">
                  ${_i('ceb_IR', 'Internal Recycle, IR', 3.0, 'Q')}
                  ${_i('ceb_tanox', 'Pre-Anoxic t', 1.5, 'hr')}
                  ${_i('ceb_tana', 'Anaerobic t', 1.0, 'hr')}
                  ${_i('ceb_tpost', 'Post-Anoxic t', 2.0, 'hr')}
                  ${_i('ceb_NO3_RAS', 'Effl. NO3 target', 6.0, 'mg/L')}
                  ${_i('ceb_rbCOD_NO3', 'rbCOD/NO3 ratio', 5.2, 'g/g')}
                  ${_i('ceb_XTSS', 'Design MLSS', 3000, 'mg/L', 100)}
                  ${_i('ceb_TSSw_Nitrif', 'WAS TSS', 6500, 'mg/L', 100)}
                  ${_i('ceb_SOTE', 'SOTE', 0.28, '', 0.01)}
                  ${_i('ceb_Alpha', 'Alpha (Nitrif)', 0.60, '', 0.01)}
                  ${_i('ceb_DiffDepth', 'Diffuser Depth', 4.5, 'm', 0.1)}
                  ${_i('ceb_Factor_F', 'Fouling Factor', 0.90, '', 0.01)}
                  ${_i('ceb_Beta', 'Beta Factor', 0.95, '', 0.01)}
                  ${_i('ceb_CL', 'DO Target', 2.0, 'mg/L', 0.1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Nitrification -->
        <div class="tp" id="ceb-t3">
          <div class="mbr-split">
            <div class="mbr-left">
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                ${_kpi('⏱️', 'Design SRT', 'ceb_SRT_out', 'days', 'Required sludge retention time')}
                ${_kpi('📐', 'Aerobic Volume', 'ceb_Vaer', 'm³', 'Total required aerobic tank volume')}
              </div>

              <div class="card" style="margin-top:5px;">
                <div class="card-hd"><div class="card-hd-t">Nitrification & SRT</div></div>
                <div class="card-body">
                  <div class="mbr-res-grid">
                    ${_out('ceb_NOx', 'Goal Seek: NO<sub>x</sub> Oxidized', 'mg/L', true)}
                    ${_out('ceb_TheoSRT', 'Theoretical SRT<sub>min</sub>', 'days')}
                    ${_out('ceb_FM', 'F/M Ratio', 'd⁻¹')}
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-hd"><div class="card-hd-t">Biological Sludge Production</div></div>
                <div class="card-body">
                  <div class="mbr-res-grid">
                    ${_out('ceb_bCODo_out', 'Influent bCOD<sub>o</sub>', 'mg/L')}
                    ${_out('ceb_S', 'Effl. Soluble BOD, S', 'mg/L')}
                    ${_out('ceb_Pxbio', 'Biomass Prod, P<sub>x,bio</sub>', 'kg/d', true)}
                    ${_out('ceb_PxTSS', 'Total Sludge Prod, P<sub>x,TSS</sub>', 'kg/d', true)}
                    ${_out('ceb_MLVSS', 'MLVSS Concentration', 'mg/L')}
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-hd"><div class="card-hd-t">Aeration & Pumping</div></div>
                <div class="card-body">
                  <div class="mbr-res-grid">
                    ${_out('ceb_taer', 'Aerobic HRT', 'hr')}
                    ${_out('ceb_O2', 'Oxygen Req.', 'kg/hr', true)}
                    ${_out('ceb_AOTE', 'Efficiency, AOTE', '')}
                    ${_out('ceb_Air', 'Air Requirement', 'Nm³/hr', true)}
                    ${_out('ceb_Qr', 'RAS Rate, Q<sub>r</sub>', 'm³/d')}
                    ${_out('ceb_Qw', 'WAS Rate, Q<sub>w</sub>', 'm³/d')}
                    ${_out('ceb_NaHCO3', 'Req. NaHCO<sub>3</sub>', 'kg/d')}
                  </div>
                </div>
              </div>

            </div>
            <div class="mbr-right">
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">Nitrification Equations</div></div>
                <div class="card-body mbr-ref">
                  <div class="eq-blk"><span class="eq-l">NO<sub>x</sub></span><span class="eq-r">= TKN<sub>o</sub> - NH4<sub>Ne</sub> - (0.12 * P<sub>x,bio</sub> * 1000 / Q<sub>o</sub>) <small>mg/L</small></span></div>
                  <div class="eq-blk"><span class="eq-l">SRT<sub>theo</sub></span><span class="eq-r">= 1 / (μ<sub>mn</sub> * (NH4<sub>Ne</sub> / (K<sub>n</sub> + NH4<sub>Ne</sub>)) * DO<sub>f</sub> - k<sub>dn</sub>) <small>days</small></span></div>
                  <div class="eq-blk"><span class="eq-l">SRT</span><span class="eq-r">= FS * SRT<sub>theo</sub> <small>days</small></span></div>
                  <div class="eq-blk"><span class="eq-l">bCOD<sub>o</sub></span><span class="eq-r">= BOD<sub>o</sub> * (bCOD/BOD) <small>mg/L</small></span></div>
                  <div class="eq-blk"><span class="eq-l">S</span><span class="eq-r">= K<sub>s</sub> * (1 + k<sub>d</sub>*SRT) / (SRT*(μ<sub>m</sub> - k<sub>d</sub>) - 1) <small>mg/L</small></span></div>
                  <div class="eq-blk"><span class="eq-l">P<sub>x,bio</sub></span><span class="eq-r">= (Q*Y(bCOD<sub>o</sub>-S)/(1+k<sub>d</sub>*SRT)) + (f<sub>d</sub>*k<sub>d</sub>*Q*Y(bCOD<sub>o</sub>-S)*SRT/(1+k<sub>d</sub>*SRT)) + (Q*Y<sub>n</sub>*NO<sub>x</sub>/(1+k<sub>dn</sub>*SRT)) <small>kg/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">P<sub>x,TSS</sub></span><span class="eq-r">= (P<sub>x,bio</sub> / 0.85) + Q*nbVSS<sub>o</sub> + Q*(TSS<sub>o</sub> - VSS<sub>o</sub>) <small>kg/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">V<sub>aer</sub></span><span class="eq-r">= Mass<sub>MLSS</sub> / XTSS <small>m³</small></span></div>
                  <div class="eq-blk"><span class="eq-l">O<sub>2</sub></span><span class="eq-r">= ((Q<sub>o</sub>/24)*(BOD<sub>o</sub>-sBOD<sub>e</sub>)*O<sub>2,yield</sub>) + (4.57*(Q<sub>o</sub>/24)*(TKN<sub>o</sub>-NH4<sub>Ne</sub>)) <small>kg/hr</small></span></div>
                  <div class="eq-blk"><span class="eq-l">Air</span><span class="eq-r">= (O<sub>2</sub> / AOTE) * 28.97 / (0.209 * 32 * 1.2) <small>Nm³/hr</small></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Pre-Anoxic -->
        <div class="tp" id="ceb-t4">
          <div class="mbr-split">
            <div class="mbr-left">
              ${_kpi('↩️', 'Pre-Anoxic Volume', 'ceb_Vanox', 'm³', 'Required volume for pre-anoxic denitrification')}
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">CMAS Pre-Anoxic Denitrification</div></div>
                <div class="card-body">
                  <div class="mbr-res-grid">
                    ${_out('ceb_Xb', 'Active Biomass, X<sub>b</sub>', 'mg/L', true)}
                    ${_out('ceb_NOxRate', 'NO<sub>x</sub> to Anoxic', 'kg/d')}
                    ${_out('ceb_FManox', 'Anoxic F/M Ratio', 'd⁻¹')}
                    ${_out('ceb_SDNR', 'Interpolated SDNR', 'd⁻¹', true)}
                    ${_out('ceb_NO3red', 'NO3-N Reduct. Cap.', 'kg/d', true)}
                  </div>
                </div>
              </div>
            </div>
            <div class="mbr-right">
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">Anoxic Equations</div></div>
                <div class="card-body mbr-ref">
                  <div class="eq-blk"><span class="eq-l">X<sub>b</sub></span><span class="eq-r">= Q<sub>o</sub> * SRT * Y * bCOD<sub>o</sub> / (V<sub>aer</sub> * (1 + k<sub>d</sub> * SRT)) <small>mg/L</small></span></div>
                  <div class="eq-blk"><span class="eq-l">NO<sub>x</sub> Rate</span><span class="eq-r">= ((IR * Q<sub>o</sub>) + (RAS * Q<sub>o</sub>)) * NO<sub>x</sub> <small>kg/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">V<sub>anox</sub></span><span class="eq-r">= Q<sub>o</sub> * t<sub>anox</sub> / 24 <small>m³</small></span></div>
                  <div class="eq-blk"><span class="eq-l">F/M<sub>anox</sub></span><span class="eq-r">= Q<sub>o</sub> * BOD<sub>o</sub> / (V<sub>anox</sub> * X<sub>b</sub>) <small>d⁻¹</small></span></div>
                  <div class="eq-blk"><span class="eq-l">SDNR</span><span class="eq-r">= Lookup f(F/M, IR) at T<sub>ww</sub> <small>d⁻¹</small></span></div>
                  <div class="eq-blk"><span class="eq-l">NO<sub>3,red</sub></span><span class="eq-r">= V<sub>anox</sub> * SDNR * X<sub>b</sub> <small>kg/d</small></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 5: EBPR Process -->
        <div class="tp" id="ceb-t5">
          <div class="mbr-split">
            <div class="mbr-left">
              ${_kpi('🧪', 'Final Effluent Phosphorus', 'ceb_EfflP', 'mg/L P', 'Based on EBPR + Synthesis Removal')}
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">A2O EBPR Process</div></div>
                <div class="card-body">
                  <div class="mbr-res-grid">
                    ${_out('ceb_Vana', 'Anaerobic Volume', 'm³', true)}
                    ${_out('ceb_rbCOD_infl_out', 'Infl. rbCOD', 'kg/d')}
                    ${_out('ceb_rbCOD_NO3_out', 'rbCOD used by NO<sub>3</sub>', 'kg/d')}
                    ${_out('ceb_rbCOD_avail', 'rbCOD Available', 'kg/d', true)}
                    ${_out('ceb_VFA_rbCOD', 'VFA / rbCOD', '')}
                    ${_out('ceb_rbCOD_P', 'rbCOD / P Removal', 'g/g', true)}
                    ${_out('ceb_Prem', 'P Removal (EBPR)', 'kg/d', true)}
                    ${_out('ceb_Psynth', 'P Removal (Synth)', 'kg/d')}
                  </div>
                </div>
              </div>
            </div>
            <div class="mbr-right">
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">EBPR Equations</div></div>
                <div class="card-body mbr-ref">
                  <div class="eq-blk"><span class="eq-l">V<sub>ana</sub></span><span class="eq-r">= Q<sub>o</sub> * t<sub>ana</sub> / 24 <small>m³</small></span></div>
                  <div class="eq-blk"><span class="eq-l">rbCOD<sub>infl</sub></span><span class="eq-r">= Q<sub>o</sub> * rbCOD<sub>o</sub> <small>kg/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">rbCOD<sub>NO3</sub></span><span class="eq-r">= NO3<sub>RAS</sub> * RAS * Q<sub>o</sub> * (rbCOD/NO3) <small>kg/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">rbCOD<sub>avail</sub></span><span class="eq-r">= Infl. rbCOD - rbCOD used by NO<sub>3</sub> <small>kg/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">VFA/rbCOD</span><span class="eq-r">= VFA<sub>o</sub> / rbCOD<sub>o</sub></span></div>
                  <div class="eq-blk"><span class="eq-l">rbCOD/P</span><span class="eq-r">= f(VFA/rbCOD) Polynomial Curve <small>g/g</small></span></div>
                  <div class="eq-blk"><span class="eq-l">P<sub>rem</sub></span><span class="eq-r">= rbCOD Available / (rbCOD/P) <small>kg/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">P<sub>synth</sub></span><span class="eq-r">= 0.015 * P<sub>x,bio</sub> <small>kg/d</small></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 6: Post-Anoxic -->
        <div class="tp" id="ceb-t6">
          <div class="mbr-split">
            <div class="mbr-left">
              ${_kpi('💧', 'Methanol Dose', 'ceb_Methanol', 'mg/L', 'Required dose for post-anoxic denitrification')}
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">CMAS Post-Anoxic Denitrification</div></div>
                <div class="card-body">
                  <div class="mbr-res-grid">
                    ${_out('ceb_Vpost', 'Post-Anoxic Vol', 'm³', true)}
                    ${_out('ceb_YD', 'Synth. Yield, Y<sub>D</sub>', 'g/g')}
                    ${_out('ceb_kdD', 'Endog. Decay, k<sub>dD</sub>', '1/d')}
                    ${_out('ceb_Smeth', 'Residual Methanol, S', 'mg/L')}
                  </div>
                </div>
              </div>
            </div>
            <div class="mbr-right">
              <div class="card">
                <div class="card-hd"><div class="card-hd-t">Post-Anoxic Equations</div></div>
                <div class="card-body mbr-ref">
                  <div class="eq-blk"><span class="eq-l">V<sub>post</sub></span><span class="eq-r">= Q<sub>o</sub> * t<sub>post</sub> / 24 <small>m³</small></span></div>
                  <div class="eq-blk"><span class="eq-l">Y<sub>D</sub></span><span class="eq-r">= f(T<sub>ww</sub>) <small>g/g</small></span></div>
                  <div class="eq-blk"><span class="eq-l">k<sub>dD</sub></span><span class="eq-r">= f(T<sub>ww</sub>) <small>1/d</small></span></div>
                  <div class="eq-blk"><span class="eq-l">S<sub>meth</sub></span><span class="eq-r">= K<sub>sD</sub>*(1+k<sub>dD</sub>*SRT)/(SRT*(Y<sub>D</sub>*k<sub>D</sub> - k<sub>dD</sub>)-1) <small>mg/L</small></span></div>
                  <div class="eq-blk"><span class="eq-l">Methanol</span><span class="eq-r">= (2.86/(1 - 1.43*Y<sub>n,meth</sub>))*NO<sub>3</sub> + S <small>mg/L</small></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 7: Phosphorus Curve -->
        <div class="tp" id="ceb-t7">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">Phosphorus Correlation Curve</div><div class="card-hd-s">rbCOD / P vs VFA / rbCOD</div></div>
            <div class="card-body" style="height:350px;">
              <canvas id="ebpr-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Tab Drw: Process Schematic -->
        <div class="tp" id="ceb-drw">
          <div class="card">
            <div class="card-hd"><div class="card-hd-t">A2O Process Schematic</div></div>
            <div class="card-body" style="background:#ffffff; padding:30px; border-radius:8px; text-align:center;">
               <svg width="100%" height="350" viewBox="0 0 1000 350" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:1000px; font-family:var(--fm); margin: 0 auto; display: block;">
                  
                  <!-- Main Flow Line -->
                  <path d="M 20 180 L 960 180" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
                  <polygon points="950,172 965,180 950,188" fill="#94a3b8"/>
                  
                  <text x="30" y="170" fill="#64748b" font-size="14" font-weight="bold">Influent</text>
                  <text x="890" y="170" fill="#64748b" font-size="14" font-weight="bold">Effluent</text>

                  <!-- IR Line (Aerobic to Pre-Anoxic) -->
                  <path d="M 480 140 L 480 60 L 320 60 L 320 135" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,6" stroke-linecap="round" fill="none"/>
                  <polygon points="320,140 315,130 325,130" fill="#ef4444"/>
                  <text x="400" y="50" fill="#ef4444" font-size="14" font-weight="bold" text-anchor="middle">Internal Recycle (IR)</text>

                  <!-- RAS Line (Clarifier to Anaerobic) -->
                  <path d="M 800 220 L 800 300 L 160 300 L 160 225" stroke="#10b981" stroke-width="2" stroke-dasharray="6,6" stroke-linecap="round" fill="none"/>
                  <polygon points="160,220 155,230 165,230" fill="#10b981"/>
                  <text x="480" y="320" fill="#10b981" font-size="14" font-weight="bold" text-anchor="middle">Return Activated Sludge (RAS)</text>

                  <!-- Tanks -->
                  <!-- Anaerobic -->
                  <rect x="100" y="140" width="120" height="80" rx="6" fill="#6366f1" stroke="#4f46e5" stroke-width="2"/>
                  <text x="160" y="185" fill="#ffffff" font-size="15" font-weight="bold" text-anchor="middle">Anaerobic</text>
                  
                  <!-- Pre-Anoxic -->
                  <rect x="260" y="140" width="120" height="80" rx="6" fill="#14b8a6" stroke="#0d9488" stroke-width="2"/>
                  <text x="320" y="185" fill="#ffffff" font-size="15" font-weight="bold" text-anchor="middle">Pre-Anoxic</text>
                  
                  <!-- Aerobic -->
                  <rect x="420" y="140" width="120" height="80" rx="6" fill="#0ea5e9" stroke="#0284c7" stroke-width="2"/>
                  <text x="480" y="185" fill="#ffffff" font-size="15" font-weight="bold" text-anchor="middle">Aerobic</text>

                  <!-- Post-Anoxic -->
                  <rect x="580" y="140" width="120" height="80" rx="6" fill="#14b8a6" stroke="#0d9488" stroke-width="2"/>
                  <text x="640" y="175" fill="#ffffff" font-size="15" font-weight="bold" text-anchor="middle">Post-Anoxic</text>
                  <text x="640" y="195" fill="#ccfbf1" font-size="12" font-weight="bold" text-anchor="middle">+ Methanol</text>
                  
                  <!-- Clarifier -->
                  <polygon points="740,140 860,140 830,220 770,220" fill="#64748b" stroke="#475569" stroke-width="2" stroke-linejoin="round"/>
                  <text x="800" y="185" fill="#ffffff" font-size="15" font-weight="bold" text-anchor="middle">Clarifier</text>
               </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
