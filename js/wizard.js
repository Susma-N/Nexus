/* ════ WIZARD ════ */
function wz(n){
  for(let i=1;i<=5;i++){const el=document.getElementById('ws'+i);if(el)el.style.display=(i===n?'block':'none')}
  wizCur=n;updateWizUI(n);if(n===5)buildTechGrid();
  if(n>=2)readFeed();if(n>=3)readEff();
}
function updateWizUI(n){
  for(let i=1;i<=5;i++){
    const sn=document.getElementById('sn'+i),sl=document.getElementById('sl'+i),wsb=document.getElementById('wsb'+i);
    if(sn){sn.className='sn-item'+(i===n?' active':i<n?' done':'')}
    if(sl&&i<5){sl.className='sn-line'+(i<n?' done':'')}
    if(wsb){wsb.className='si'+(i===n?' active':i<n?' done':'')}
  }
  const pb=document.getElementById('wiz-bar');if(pb)pb.style.width=((n/5)*100)+'%';
  const pt=document.getElementById('wiz-pg-txt');if(pt)pt.textContent=`Step ${n} of 5`;
}
function readFeed(){
  G.Q=vv('w_Q')||5000;G.PF=vv('w_PF')||2.5;G.PMF=vv('w_PMF')||1.2;
  G.BOD=vv('w_BOD')||250;G.sBOD=vv('w_sBOD')||125;G.COD=vv('w_COD')||450;G.sCOD=vv('w_sCOD')||200;G.rbCOD=vv('w_rbCOD')||80;
  G.TSS=vv('w_TSS')||220;G.VSS=vv('w_VSS')||185;G.nbVSS=vv('w_nbVSS')||40;
  G.TKN=vv('w_TKN')||40;G.NH4=vv('w_NH4')||28;G.NO3=vv('w_NO3')||1;G.TP=vv('w_TP')||6;G.VFA=vv('w_VFA')||15;
  G.Alk=vv('w_Alk')||200;G.T=vv('w_T')||20;G.Tmax=vv('w_Tmax')||32;G.elev=vv('w_elev')||100;G.TKNfs=vv('w_TKNfs')||1.5;
}
function readEff(){
  G.BODe=vv('w_BODe')||10;G.CODe=vv('w_CODe')||50;G.TSSe=vv('w_TSSe')||10;G.NH4e=vv('w_NH4e')||5;G.TNe=vv('w_TNe')||10;G.TPe=vv('w_TPe')||2;
}
const STDS={inland:{BODe:10,CODe:50,TSSe:10,NH4e:5,TNe:10,TPe:2},land:{BODe:30,CODe:100,TSSe:30,NH4e:10,TNe:30,TPe:5},reuse:{BODe:5,CODe:20,TSSe:5,NH4e:1,TNe:5,TPe:0.5},marine:{BODe:20,CODe:75,TSSe:20,NH4e:10,TNe:15,TPe:3},mld:{BODe:5,CODe:30,TSSe:5,NH4e:2,TNe:8,TPe:1},custom:null};
function setStd(s){
  document.querySelectorAll('.std-p').forEach(b=>b.classList.remove('on'));
  document.getElementById('sp-'+s)?.classList.add('on');
  const t=STDS[s];if(!t)return;
  ['BODe','CODe','TSSe','NH4e','TNe','TPe'].forEach(k=>{const el=document.getElementById('w_'+k);if(el)el.value=t[k]});
}
function selSys(type){sysType=type;document.getElementById('sc-conv').className='sc'+(type==='conventional'?' on':'');document.getElementById('sc-spec').className='sc'+(type==='specific'?' on':'')}
const TECHS={
  conventional:{
    asp:{icon:'💧',name:'Activated Sludge (CMAS)',abbr:'ASP',desc:'Complete-mix with nitrification, denitrification, optional EBPR.',tags:['BOD','N+P','Proven']},
    mbr:{icon:'🔵',name:'Membrane Bioreactor',abbr:'MBR',desc:'Membrane replaces clarifier. Compact, reuse-quality effluent.',tags:['BOD<5','TSS<2','Reuse']},
    sbr:{icon:'🔄',name:'Sequencing Batch Reactor',abbr:'SBR',desc:'Single basin fill-react-settle cycle. No secondary clarifier.',tags:['BOD','N+P','Flexible']},
    mbbr:{icon:'🟡',name:'MBBR — Moving Bed Biofilm',abbr:'MBBR',desc:'Plastic carriers. High loading, easy upgrade, low footprint.',tags:['BOD','N','High Rate']},
    eal:{icon:'🌿',name:'Extended Aeration',abbr:'EAL',desc:'Long SRT>15d, very low sludge. Simple for small plants.',tags:['BOD','<5MLD','Simple']},
  },
  specific:{
    mbr:{icon:'🔵',name:'MBR — Full System',abbr:'MBR',desc:'Pre-anoxic + MBR basin + hollow-fibre membrane module design.',tags:['BOD<5','Reuse','Full']},
    sbr:{icon:'🔄',name:'SBR — Full System',abbr:'SBR',desc:'BOD+Nitrif, Pre-anoxic, Post-anoxic configurations with cycle design.',tags:['BOD','N','3 configs']},
    mbbr:{icon:'🟡',name:'MBBR — Full System',abbr:'MBBR',desc:'SALR/SARR carrier sizing, nitrification kinetics, denitrification.',tags:['BOD','N','SALR']},
    uasb_asp:{icon:'🌱',name:'UASB + Aerobic Polish',abbr:'UASB+ASP',desc:'Anaerobic pre-treatment with biogas energy recovery + polishing.',tags:['COD','Biogas','Energy']},
    trickle:{icon:'🏔️',name:'Trickling Filter (NRC)',abbr:'TF',desc:'Fixed-film NRC formula, 1-stage and 2-stage BOD removal.',tags:['BOD','Low Energy','Low Maint.']},
  }
};
function buildTechGrid(){
  const techs=TECHS[sysType]||TECHS.conventional;
  let html='';
  for(const[k,t]of Object.entries(techs)){
    const rec=(G.BODe<=5&&k==='mbr')||(G.Q>2000&&G.BODe<=10&&k==='asp')||(sysType==='specific'&&k==='uasb_asp'&&G.COD>400);
    html+=`<div class="tc${selTech===k?' on':''}" onclick="selTech_('${k}')">${rec?'<div class="tc-rec">⭐ Recommended</div>':''}<div class="tc-icon">${t.icon}</div><div class="tc-name">${t.name}</div><div class="tc-abbr">${t.abbr}</div><div class="tc-desc">${t.desc}</div><div class="tc-tags">${t.tags.map(x=>`<span class="tc-tag">${x}</span>`).join('')}</div></div>`;
  }
  document.getElementById('tech-grid').innerHTML=html;showRec();
}
function selTech_(k){selTech=k;buildTechGrid()}
function showRec(){
  const el=document.getElementById('rec-box');if(!el)return;
  const msgs={
    mbr:`✅ MBR is ideal for your effluent BOD target ≤${G.BODe} mg/L. Consistent membrane-quality effluent suitable for reuse. Plan for membrane replacement every 10–12 years.`,
    sbr:`ℹ️ SBR: minimum 2 basins for continuous flow. Nitrification and denitrification achievable in a single basin through cycle control (fill/anoxic/aerate/settle/decant).`,
    mbbr:`ℹ️ MBBR: plastic carriers (Kaldnes type) move freely in aerated reactor. 40–50% fill fraction recommended. Easily upgradeable — add carriers rather than new tanks.`,
    uasb_asp:`✅ UASB + Aerobic polish: anaerobic pre-treatment recovers 0.35 L CH₄/g COD removed, reducing aerobic power by ~40–60%. Best for influent COD >${G.COD} mg/L.`,
    asp:`✅ ASP (CMAS): globally proven, flexible for N+P removal, well-documented design criteria. Recommended for Q >${fi(G.Q)} m³/d with good operator training.`,
    eal:`ℹ️ Extended Aeration: SRT 20–30 days, minimal excess sludge (<0.1 kg/kg BOD). Best for Q <5 MLD. No primary clarifier needed.`,
    trickle:`ℹ️ Trickling Filter: NRC formula. Very low energy, no moving parts except distributor. Consider 2-stage for BOD targets <30 mg/L.`
  };
  const m=msgs[selTech];
  if(m){el.style.display='flex';el.innerHTML=`<span>💡</span><span>${m}</span>`}else el.style.display='none';
  const sv=document.getElementById('sb-tech-v');if(sv){const t=(TECHS[sysType]||TECHS.conventional)[selTech];if(t)sv.textContent=t.abbr+' — '+t.name.split('(')[0].trim()}
}
function launchDesign(){
  readFeed();readEff();G.tech=selTech;G.systemType=sysType;
  const tc=(TECHS[sysType]||TECHS.conventional)[selTech];
  const chip=document.getElementById('top-chip');if(chip&&tc){chip.textContent=tc.abbr+' Plant';chip.style.display='block'}
  gm('train');
}
