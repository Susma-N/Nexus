/* ════ POPULATE GLOBALS INTO MODULES ════ */
function populateGlobals(id){
  if(id==='screen'||id==='screen-select'){const e=document.getElementById('sc_Qd');if(e)e.textContent=fi(G.Q);const e2=document.getElementById('sc_Qpd');if(e2)e2.textContent=fi(G.Q*G.PF)}
  if(id==='aerated-grit'){const e=document.getElementById('ag_Q');if(e)e.value=G.Q;}
  if(id==='grit-horizontal'){const e=document.getElementById('gh_Q');if(e)e.value=G.Q;}
  if(id==='primary'){const e=document.getElementById('pc_Qd');if(e)e.textContent=fi(G.Q)}
  if(id==='secondary'||id==='secondary-cmas'||id==='secondary-select'){if(typeof buildSecInputs==='function')buildSecInputs();}
  if(id==='clarifier'){
    const m = {
      cl_p_Q:G.Q, cl_p_PF:G.PF, cl_p_TSS:G.TSS, cl_p_BOD:G.BOD,
      cl_s_Q:G.Q, cl_s_PF:G.PF
    };
    for(const[k,v]of Object.entries(m)){const e=document.getElementById(k);if(e)e.value=v}
    if(typeof ClarEngine!=='undefined')ClarEngine.init();
  }
  if(id==='mbr'){const m={mbr_Q:G.Q,mbr_BOD:G.BOD,mbr_sBOD:G.sBOD,mbr_COD:G.COD,mbr_sCOD:G.sCOD,mbr_rbCOD:G.rbCOD,mbr_TSS:G.TSS,mbr_VSS:G.VSS,mbr_TKN:G.TKN,mbr_NH4:G.NH4,mbr_Alk:G.Alk,mbr_Tww:G.T,mbr_Fs:G.TKNfs,mbr_BODe:G.BODe,mbr_TSSe:G.TSSe,mbr_NH4e:G.NH4e};for(const[k,v]of Object.entries(m)){const e=document.getElementById(k);if(e)e.value=v}const qd=document.getElementById('mbr_Qdisp');if(qd)qd.textContent=fi(G.Q);if(typeof MBREngine!=='undefined')MBREngine.init();}
  if(id==='uasb'){const e=document.getElementById('ub_Q');if(e)e.value=G.Q;const e2=document.getElementById('ub_COD');if(e2)e2.value=G.COD;const e3=document.getElementById('ub_T');if(e3)e3.value=G.T}
  if(id==='sbr'){const e=document.getElementById('sbr_Q');if(e)e.value=G.Q;const e2=document.getElementById('sbr_BOD');if(e2)e2.value=G.BOD;const e3=document.getElementById('sbr_TKN');if(e3)e3.value=G.TKN;const e4=document.getElementById('sbr_T');if(e4)e4.value=G.T}
  if(id==='mbbr'||id==='mbbr-select'){/* selection screen — no pre-fill needed */}
  if(id==='mbbr-bod'){const e=document.getElementById('mb1_Q');if(e)e.value=G.Q;const e2=document.getElementById('mb1_TKN');if(e2)e2.value=G.TKN;const e3=document.getElementById('mb1_T');if(e3)e3.value=G.T}
  if(id==='mbbr-bnr'){const m={mbb_Qo:G.Q,mbb_So:G.BOD,mbb_TKNo:G.TKN,mbb_NO3Ne:G.TNe,mbb_Alk:G.Alk,mbb_T:G.T,mbb_NH4Ne:G.NH4e};for(const[k,v]of Object.entries(m)){const e=document.getElementById(k);if(e)e.value=v} if(typeof MBBR_BNREngine!=='undefined')MBBR_BNREngine.init();}
  if(id==='daf'){const e=document.getElementById('daf_Q');if(e)e.value=G.Q;const e2=document.getElementById('daf_T');if(e2)e2.value=G.T;if(typeof DAFEngine!=='undefined')DAFEngine.init();}
  if(id==='digester'){const e=document.getElementById('dig_Qi');if(e)e.value=G.Q;if(typeof DigesterEngine!=='undefined')DigesterEngine.init();}
  if(id==='trickling'){const e=document.getElementById('tf_Q');if(e)e.value=G.Q;const e2=document.getElementById('tf_BOD');if(e2)e2.value=Math.round(G.BOD*(1-G.primaryBODrem/100))}
  if(id==='oxditch'){const e=document.getElementById('oxd_Q');if(e)e.value=G.Q;const e2=document.getElementById('oxd_BOD');if(e2)e2.value=G.BOD;const e3=document.getElementById('oxd_TKN');if(e3)e3.value=G.TKN;const e4=document.getElementById('oxd_T');if(e4)e4.value=G.T}
  if(id==='tertiary-denitrif'){const e=document.getElementById('tdn_Q');if(e)e.value=G.Q;const e2=document.getElementById('tdn_T');if(e2)e2.value=G.T;if(typeof TDNEngine!=='undefined')TDNEngine.init();}
  if(id==='aeration'){const e=document.getElementById('aer_T');if(e)e.value=G.T}
  if(id==='aeration-blower'){const e=document.getElementById('ab_Qo');if(e)e.value=G.Q;const e2=document.getElementById('ab_So');if(e2)e2.value=G.BOD;const e3=document.getElementById('ab_TKNo');if(e3)e3.value=G.TKN;const e4=document.getElementById('ab_Se');if(e4)e4.value=G.BODe; if(typeof ABEngine!=='undefined')ABEngine.init();}
  if(id==='cmas-ebpr'){if(typeof CMAS_EbprEngine!=='undefined')CMAS_EbprEngine.init();}
}


/* ════ MODULE BUILDER ════ */
function buildMod(id){
  const cs=(icon,t,d)=>`<div class="mwrap"><div class="cs"><div class="cs-icon">${icon}</div><div class="cs-t">${t}</div><div class="cs-d">${d}</div></div></div>`;
  switch(id){
    /* ── Core ── */
    case 'train':return buildTrain();
    /* ── Pretreatment — selection screen + sub-modules ── */
    case 'screen-select':return (typeof buildScreenSelect==='function'?buildScreenSelect():cs('🔲','Screening + Grit','Select a configuration.'));
    case 'screen':return buildScreen();
    case 'grit-horizontal':return (typeof buildGritHorizontal==='function'?buildGritHorizontal():cs('🔲','Horizontal Flow Grit Chamber','Module loading...'));
    case 'aerated-grit':return (typeof buildAeratedGrit==='function'?buildAeratedGrit():cs('💨','Aerated Grit Chamber','Module loading…'));
    /* ── Clarification ── */
    case 'primary':
    case 'sec-clar':
    case 'clarifier':return (typeof buildClarifier==='function'?buildClarifier():cs('🚧',`Waste Water Clarifier Design`,'Coming soon.'));
    /* ── Secondary — selection screen + sub-modules ── */
    case 'secondary-select':return (typeof buildSecondarySelect==='function'?buildSecondarySelect():cs('🧬','Secondary Biological','Select a configuration.'));
    case 'secondary':
    case 'secondary-cmas':return (typeof buildSecondary==='function'?buildSecondary():cs('🚧',`Module: ${id}`,'Coming soon.'));
    case 'tertiary-denitrif':return (typeof buildTertiaryDenitrif==='function'?buildTertiaryDenitrif():cs('🌿','Tertiary Denitrification','Module loading…'));
    case 'cmas-ebpr':return (typeof buildCmasEbpr==='function'?buildCmasEbpr():cs('🔄','A2O EBPR','Module loading…'));
    case 'oxditch':return (typeof buildOxDitch==='function'?buildOxDitch():cs('🔄','Oxidation Ditch','Module loading…'));
    /* ── MBR ── */
    case 'mbr':return (typeof buildMBR==='function'?buildMBR():cs('🚧',`Module: ${id}`,'Coming soon.'));
    /* ── SBR ── */
    case 'sbr':return (typeof buildSBR==='function'?buildSBR():cs('🚧',`Module: ${id}`,'Coming soon.'));
    /* ── MBBR — selection screen + sub-modules ── */
    case 'mbbr-select':return (typeof buildMBBRSelect==='function'?buildMBBRSelect():cs('🟡','MBBR System','Select a configuration.'));
    case 'mbbr':
    case 'mbbr-select-entry':return (typeof buildMBBRSelect==='function'?buildMBBRSelect():cs('🟡','MBBR System','Select a configuration.'));
    case 'mbbr-bod':return (typeof buildMBBRBOD==='function'?buildMBBRBOD():cs('🟡','MBBR BOD+Nitrif','Module loading…'));
    case 'mbbr-bnr':return (typeof buildMBBRBNR==='function'?buildMBBRBNR():cs('♻️','MBBR BNR','Module loading…'));
    /* ── Trickling Filter ── */
    case 'trickling':return (typeof buildTrickling==='function'?buildTrickling():cs('🚧',`Module: ${id}`,'Coming soon.'));

    /* ── Anaerobic / Industrial ── */
    case 'uasb':return (typeof buildUASB==='function'?buildUASB():cs('🚧',`Module: ${id}`,'Coming soon.'));
    case 'daf':return (typeof buildDAFDesign==='function'?buildDAFDesign():cs('🚧',`Module: ${id}`,'Coming soon.'));
    /* ── Solids Handling ── */
    case 'digester':return (typeof buildDigester==='function'?buildDigester():cs('🚧',`Module: ${id}`,'Coming soon.'));
    case 'mass-balance':return (typeof buildMassBalance==='function'?buildMassBalance():cs('🚧',`Module: ${id}`,'Coming soon.'));
    /* ── Utilities ── */
    case 'aeration':return (typeof buildAeration==='function'?buildAeration():cs('🌬️','Aeration System','Module loading…'));
    case 'aeration-blower':return (typeof buildAerationBlower==='function'?buildAerationBlower():cs('🌬️','Aeration Tank Blower','Module loading…'));
    /* ── Natural / Tertiary ── */
    case 'lagoon':return (typeof buildLagoon==='function'?buildLagoon():cs('🚧',`Module: ${id}`,'Coming soon.'));
    case 'tertiary':return (typeof buildTertiary==='function'?buildTertiary():cs('🚧',`Module: ${id}`,'Coming soon.'));
    case 'metal':return (typeof buildMetal==='function'?buildMetal():cs('🚧',`Module: ${id}`,'Coming soon.'));
    case 'subsurface':return cs('💧','Subsurface WW Distribution','Land-application drip distribution design. Coming in next update — covers emitter spacing, pipe sizing, and soil hydraulic loading.');
    default:return cs('🚧',`Module: ${id}`,'Coming soon in the next release.');
  }
}

/* ══════ TREATMENT TRAIN ══════ */
function buildTrain(){
  const tc=(TECHS[G.systemType]||TECHS.conventional)[G.tech];
  let steps=[];
  if(G.tech==='mbr')steps=[{n:'Influent',i:'🚰',s:'Raw Sewage'},{n:'Screen+Grit',i:'🔲',s:'Pretreatment',m:'screen'},{n:'Fine Screen',i:'🔲',s:'MBR Pretreat',m:'screen'},{n:'Pre-Anoxic',i:'↩️',s:'Denitrif.',m:'secondary'},{n:'MBR Basin',i:'🔵',s:'Aer+Membrane',m:'mbr'},{n:'UV Disinfect',i:'💎',s:'Pathogen Kill'},{n:'Effluent',i:'✅',s:'Reuse Quality'},{n:'Final Treated Water',i:'🌊',s:'Ready for Reuse'}];
  else if(G.tech==='sbr')steps=[{n:'Influent',i:'🚰',s:'Raw Sewage'},{n:'Screen+Grit',i:'🔲',s:'Pretreatment',m:'screen'},{n:'Equalization',i:'⚖️',s:'Flow Buffer'},{n:'SBR Basins',i:'🔄',s:'Fill/React/Settle',m:'sbr'},{n:'Sludge Tank',i:'🟤',s:'Holding'},{n:'Disinfection',i:'💎',s:'Cl₂ / UV',m:'tertiary'},{n:'Effluent',i:'✅',s:'Treated Water'},{n:'Final Treated Water',i:'🌊',s:'Ready for Reuse'}];
  else if(G.tech==='mbbr')steps=[{n:'Influent',i:'🚰',s:'Raw Sewage'},{n:'Screen+Grit',i:'🔲',s:'Pretreatment',m:'screen'},{n:'Primary Clar.',i:'⊙',s:'~30% BOD',m:'primary'},{n:'MBBR',i:'🟡',s:'Biofilm+Suspended',m:'mbbr'},{n:'Secondary Clarifier',i:'⊛',s:'Final Settling',m:'sec-clar'},{n:'Tertiary+UV',i:'💎',s:'Disinfection'},{n:'Effluent',i:'✅',s:'Treated'},{n:'Final Treated Water',i:'🌊',s:'Ready for Reuse'}];
  else if(G.tech==='uasb_asp')steps=[{n:'Influent',i:'🚰',s:'Raw Sewage'},{n:'Screen+Grit',i:'🔲',s:'Pretreatment',m:'screen'},{n:'UASB',i:'🌱',s:'Anaerobic+Biogas',m:'uasb'},{n:'Aeration',i:'💧',s:'Aerobic Polish',m:'secondary'},{n:'Secondary Clarifier',i:'⊛',s:'Settling',m:'sec-clar'},{n:'Tertiary+UV',i:'💎',s:'Disinfection'},{n:'Effluent',i:'✅',s:'Treated'},{n:'Final Treated Water',i:'🌊',s:'Ready for Reuse'}];
  else if(G.tech==='trickle')steps=[{n:'Influent',i:'🚰',s:'Raw Sewage'},{n:'Screen+Grit',i:'🔲',s:'Pretreatment',m:'screen'},{n:'Primary Clar.',i:'⊙',s:'~30% BOD',m:'primary'},{n:'Trickling Filter',i:'🏔️',s:'Fixed-Film BOD',m:'trickling'},{n:'Secondary Clarifier',i:'⊛',s:'Final Settling',m:'sec-clar'},{n:'Tertiary+UV',i:'💎',s:'Disinfection',m:'tertiary'},{n:'Effluent',i:'✅',s:'Treated Water'},{n:'Final Treated Water',i:'🌊',s:'Ready for Reuse'}];
  else steps=[{n:'Influent',i:'🚰',s:'Raw Sewage'},{n:'Screen+Grit',i:'🔲',s:'Pretreatment',m:'screen'},{n:'Primary Clar.',i:'⊙',s:'~30% BOD rem.',m:'primary'},{n:'Aeration Tank',i:'💧',s:'BOD+Nitrif+Denitrif',m:'secondary'},{n:'Secondary Clarifier',i:'⊛',s:'Final Settling',m:'sec-clar'},{n:'Tertiary+UV',i:'💎',s:'Disinfection',m:'tertiary'},{n:'Effluent',i:'✅',s:'Treated Water'},{n:'Final Treated Water',i:'🌊',s:'Ready for Reuse'}];
  let flowHtml = `<div class="train-grid">`;
  for(let i=0; i<steps.length; i++){
    let row = Math.floor(i / 4);
    let col = row === 0 ? (i * 2 + 1) : (7 - ((i % 4) * 2));
    let cssRow = row * 2 + 1;
    let gridPos = `grid-column: ${col}; grid-row: ${cssRow}; z-index: 2;`;
    flowHtml += `<div class="tfn${steps[i].m?' clickable':''}" style="${gridPos}"${steps[i].m?` onclick="gm('${steps[i].m}')" title="Design ${steps[i].n}"`:''}><div class="tfn-icon">${steps[i].i}</div><div class="tfn-name">${steps[i].n}</div><div class="tfn-sub">${steps[i].s}</div></div>`;
    
    if (i < steps.length - 1) {
      if (row === 0 && (i + 1) % 4 === 0) {
        flowHtml += `<div class="tfarr down" style="grid-column: 7; grid-row: 2; z-index: 1;"><div class="tf-line down"></div></div>`;
      } else {
        let arrowCol = row === 0 ? (i * 2 + 2) : (7 - ((i % 4) * 2) - 1);
        let revClass = row === 1 ? ' rev' : '';
        flowHtml += `<div class="tfarr${revClass}" style="grid-column: ${arrowCol}; grid-row: ${cssRow}; z-index: 1;"><div class="tf-line${revClass}"></div></div>`;
      }
    }
  }
  flowHtml += `</div>`;
  const params=[{v:fi(G.Q),l:'Avg Q (m³/d)'},{v:f2(G.Q*G.PF/1000,2),l:'Peak (MLD)'},{v:G.BOD,l:'BOD₅ In (mg/L)'},{v:G.COD,l:'COD In (mg/L)'},{v:G.TKN,l:'TKN In (mg/L)'},{v:G.TSS,l:'TSS In (mg/L)'},{v:G.BODe,l:'BOD₅ Target (mg/L)'},{v:G.NH4e,l:'NH₄-N Target (mg/L)'},{v:G.T,l:'Temp (°C)'}].map(p=>`<div class="pb-i"><div class="pb-v">${p.v}</div><div class="pb-l">${p.l}</div></div>`).join('');
  return`<div class="mwrap">
    <div class="mhdr"><div class="mh-left"><div class="mt-title">Treatment Train Overview<div class="mt-badge">${tc?tc.abbr:'ASP'}</div></div><div class="mt-bread">Technology: <b>${tc?tc.name:'—'}</b> · Q: <b>${fi(G.Q)} m³/d</b></div></div><button class="btn btn-o btn-sm" onclick="showWiz()">← Change Technology</button></div>
    <div class="params-bar">${params}</div>
    <div class="train-box"><div class="tb-label">Complete Treatment Train — Click active units to design</div>${flowHtml}</div>
    <div class="card"><div class="card-hd"><div class="card-hd-t">📊 Process Summary (populates as you design each unit)</div></div><div class="card-body"><div class="alert al-i">Design each unit process using the sidebar. Results auto-accumulate here.</div></div></div>
  </div>`;
}
