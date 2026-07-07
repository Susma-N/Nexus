/* ══════ CALCULATION: SCREENING ══════ */
function calcScreen(){
  const Qp=G.Q*G.PF/86400;
  const W=vv('sc_W'),d=vv('sc_d'),bm=vv('sc_b')/1000,t=vv('sc_t')/1000;
  const vel=vv('sc_v'),ang=vv('sc_ang'),ns=vv('sc_ns'),beta=vv('sc_beta');
  const dp=vv('sc_dp')/1000,sg=vv('sc_sg'),ng=vv('sc_ng'),vc=vv('sc_vc');
  const dt=vv('sc_dt'),ladd=vv('sc_ladd')/100,gd=vv('sc_gd'),fb=vv('sc_fb');
  // Bar screen
  const A_open=bm/(bm+t)*W*d;
  const v_thru=Qp/A_open;
  const hl_c=beta*Math.pow(t/bm,4/3)*Math.pow(vel,2)/(2*9.81)*Math.sin(ang*Math.PI/180);
  const hl_cl=hl_c*3.5;
  const scrArea=Qp/vel;
  // Grit — Stokes
  const rho=1000,mu=0.001;
  const vs_stk=9.81*(sg*rho-rho)*dp*dp/(18*mu);
  const vs_d=vs_stk*0.30;
  const Qch=G.Q*G.PF/ng/86400;
  const A_ch=Qch/vc;
  const gW=Math.sqrt(A_ch/1.5),gD=1.5*gW;
  const gLf=vc*dt;
  const gL=gLf*(1+ladd);
  const gWall=gD+gd+fb;
  const gVol=gW*gL*gD;
  // Results
  document.getElementById('sc_Qd').textContent=fi(G.Q);
  document.getElementById('sc_Qpd').textContent=fi(G.Q*G.PF);
  const html=
    rs('⚡ Flow Parameters',rg([rc(f2(Qp*1000,1),'Peak Flow','L/s'),rc(fi(G.Q*G.PF),'Peak Daily','m³/d'),rc(f2(G.PF,2),'Peak Factor','—')])) +
    rs(`🔲 Bar Screen (${ns} units incl. standby)`,rg([
      rc(f2(v_thru,2),'Velocity thru Screen','m/s',v_thru>=0.3&&v_thru<=0.9?'ok':'warn'),
      rc(f2(hl_c*1000,1),'Headloss (clean)','mm',hl_c*1000<150?'ok':'warn'),
      rc(f2(hl_cl*1000,1),'Headloss (clogged ×3.5)','mm'),
      rc(f2(A_open*10000,1),'Net Open Area','cm²'),
      rc(f2(scrArea,3),'Gross Screen Area','m²'),
      rc(f2(t/(bm+t)*100,1),'Bar Coverage',`%`),
    ])) +
    rs(`🪨 Grit Chamber — Horizontal Flow (${ng} channels)`,rg([
      rc(f2(vs_stk*1000,3),'Stokes Settling Vel.','mm/s','amb'),
      rc(f2(vs_d*1000,3),'Design Settling Vel. (×0.3)','mm/s'),
      rc(f2(gL,2),'Channel Length L','m','amb'),
      rc(f2(gW,2),'Channel Width W','m'),
      rc(f2(gD,2),'Flow Depth D','m'),
      rc(f2(gL/gW,2),'L:W Ratio','—',gL/gW>=3&&gL/gW<=5?'ok':'warn'),
      rc(f2(gW/gD,2),'W:D Ratio','—',gW/gD>=1&&gW/gD<=5?'ok':'warn'),
      rc(f2(gWall,2),'Total Wall Depth','m'),
      rc(f2(gVol,1),'Volume per Channel','m³'),
      rc(ng,'No. of Channels','(incl. standby)'),
    ]));
  document.getElementById('sc-res-area').innerHTML=html;
  const checks=[
    ck(v_thru>=0.3&&v_thru<=0.9,'Screen velocity 0.3–0.9 m/s',f2(v_thru,2)+' m/s','M&E Table 5-3'),
    ck(hl_c*1000<150,'Headloss clean <150 mm',f2(hl_c*1000,1)+' mm'),
    ck(ns>=2,'Min 2 screens (duty + standby)',ns+' units'),
    ck(vs_d*1000>0.05,'Design settling vel. adequate',f2(vs_d*1000,3)+' mm/s','Stokes @ dp=0.2mm'),
    ck(gL/gW>=3&&gL/gW<=5,'L:W ratio 3:1–5:1',f2(gL/gW,2)+':1','M&E Table 5-16'),
    ck(gW/gD>=1&&gW/gD<=5,'W:D ratio 1:1–5:1',f2(gW/gD,2)+':1','M&E Table 5-16'),
    ck(ng>=2,'Min 2 grit channels',ng+' channels'),
    ck(dt>=45&&dt<=90,'Detention time 45–90 sec',dt+' sec','M&E Table 5-16'),
  ];
  document.getElementById('sc-chk-body').innerHTML=`<div class="ck-list">${checks.join('')}</div>`;
  // DRAW
  drawScreening({W,d,bm,t,vel,ang,ns,scrArea,gL,gW,gD,gWall,gVol,ng,vc,vs_d,vs_stk,dt,gd,fb});
  // Switch to drawing tab
  const tabs=document.querySelectorAll('#sc-drw');
  document.querySelector('.tp#sc-res').classList.add('active');
  document.querySelector('.tp#sc-res').previousElementSibling?.classList.add('active');
}

function drawScreening(d){
  const svgW=1100,svgH=580,bY=62;
  const scrX=50,scrW=Math.min(Math.max(d.W*130,190),280),scrH=155;
  const gW2=Math.min(Math.max(d.gL*46,220),380),gH2=Math.min(Math.max(d.gD*55,100),155);
  const gX=scrX+scrW+75;
  let s=`<defs>${mkArr('ar','#f5a623')}${mkArr('arb','#3a9bd4')}${mkArr('arg','#1a9454')}${mkArr('arr','#8b7355')}</defs>`;
  s+=`<rect width="${svgW}" height="${svgH}" fill="#f6f5f0"/>`;
  // ── TITLE
  s+=`<text x="14" y="24" font-size="11.5" font-weight="800" fill="#080808" font-family="Space Grotesk,Inter,sans-serif">SCREENING + GRIT CHAMBER — COMBINED PLAN VIEW</text>`;
  s+=`<text x="${svgW-14}" y="24" text-anchor="end" font-size="9.5" fill="#888" font-family="Inter,sans-serif">Q = ${fi(G.Q)} m³/d  |  Qp = ${fi(G.Q*G.PF)} m³/d  |  Design Temp = ${G.T}°C</text>`;
  s+=`<line x1="14" y1="30" x2="${svgW-14}" y2="30" stroke="#e9e6dc" stroke-width="1"/>`;
  // ── INFLUENT
  s+=`<line x1="0" y1="${bY+scrH/2}" x2="${scrX}" y2="${bY+scrH/2}" stroke="#f5a623" stroke-width="2.8" marker-end="url(#ar)"/>`;
  s+=`<text x="4" y="${bY+scrH/2-10}" font-size="9.5" font-weight="700" fill="#c4820d" font-family="Inter,sans-serif">INFLUENT</text>`;
  s+=`<text x="4" y="${bY+scrH/2+8}" font-size="8.5" fill="#888" font-family="Inter,sans-serif">Q=${fi(G.Q)} m³/d</text>`;
  s+=`<text x="4" y="${bY+scrH/2+20}" font-size="8.5" fill="#888" font-family="Inter,sans-serif">Qp=${fi(G.Q*G.PF)} m³/d</text>`;
  // ── BAR SCREEN CHANNEL
  s+=`<rect x="${scrX}" y="${bY}" width="${scrW}" height="${scrH}" rx="5" fill="#fffae8" stroke="#f5a623" stroke-width="2.5"/>`;
  s+=`<text x="${scrX+scrW/2}" y="${bY+17}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#080808" font-family="Space Grotesk,Inter,sans-serif">BAR SCREEN CHANNEL</text>`;
  // Bar screen bars (vertical)
  const nBars=Math.min(12,Math.round(scrW/22));
  const barsX=scrX+20;const barsW=scrW-40;
  for(let i=0;i<nBars;i++){const bx=barsX+i*(barsW/(nBars-1));s+=`<rect x="${bx-2}" y="${bY+25}" width="4" height="${scrH-40}" rx="1" fill="#c4820d" opacity=".9"/>`}
  s+=`<line x1="${scrX+10}" y1="${bY+25}" x2="${scrX+scrW-10}" y2="${bY+25}" stroke="#c4820d" stroke-width="1" stroke-dasharray="4 2"/>`;
  s+=`<line x1="${scrX+10}" y1="${bY+scrH-14}" x2="${scrX+scrW-10}" y2="${bY+scrH-14}" stroke="#c4820d" stroke-width="1" stroke-dasharray="4 2"/>`;
  s+=`<text x="${scrX+scrW/2}" y="${bY+scrH-30}" text-anchor="middle" font-size="9" fill="#888" font-family="Inter,sans-serif">${d.ns} screens | W=${d.W}m | D=${d.d}m</text>`;
  s+=`<text x="${scrX+scrW/2}" y="${bY+scrH-18}" text-anchor="middle" font-size="9" fill="#888" font-family="Inter,sans-serif">Bar ${(d.t*1000).toFixed(0)}mm | Clear ${(d.bm*1000).toFixed(0)}mm | θ=${d.ang}°</text>`;
  s+=`<text x="${scrX+scrW/2}" y="${bY+scrH-6}" text-anchor="middle" font-size="9" fill="#888" font-family="Inter,sans-serif">v_thru = ${f2(G.Q*G.PF/86400/(d.bm/(d.bm+d.t)*d.W*d.d),2)} m/s</text>`;
  // Screenings discharge
  s+=`<line x1="${scrX+scrW*0.45}" y1="${bY+scrH}" x2="${scrX+scrW*0.45}" y2="${bY+scrH+68}" stroke="#8b7355" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arr)"/>`;
  s+=`<rect x="${scrX+scrW*0.45-32}" y="${bY+scrH+55}" width="64" height="18" rx="3" fill="#f5edd8" stroke="#c8a96e" stroke-width="1"/>`;
  s+=`<text x="${scrX+scrW*0.45}" y="${bY+scrH+68}" text-anchor="middle" font-size="8.5" fill="#5a4a2e" font-family="Inter,sans-serif" font-weight="600">Screenings</text>`;
  // Screen → Grit
  s+=`<line x1="${scrX+scrW}" y1="${bY+scrH/2}" x2="${gX}" y2="${bY+scrH/2}" stroke="#f5a623" stroke-width="2.8" marker-end="url(#ar)"/>`;
  // ── GRIT CHAMBER
  s+=`<rect x="${gX}" y="${bY}" width="${gW2}" height="${gH2+34}" rx="5" fill="#f5edd8" stroke="#8b7355" stroke-width="2.5"/>`;
  s+=`<text x="${gX+gW2/2}" y="${bY+17}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#080808" font-family="Space Grotesk,Inter,sans-serif">HORIZONTAL FLOW GRIT CHAMBER</text>`;
  // Flow direction arrow inside grit chamber
  s+=`<line x1="${gX+20}" y1="${bY+gH2*0.4}" x2="${gX+gW2-20}" y2="${bY+gH2*0.4}" stroke="#f5a623" stroke-width="1.8" marker-end="url(#ar)" stroke-dasharray="7 4"/>`;
  s+=`<text x="${gX+gW2/2}" y="${bY+gH2*0.4-8}" text-anchor="middle" font-size="9" fill="#c4820d" font-family="Inter,sans-serif">vc = ${d.vc} m/s → (Horizontal control velocity)</text>`;
  // Stokes settling arrows
  for(let i=0;i<5;i++){const ax=gX+gW2*0.14+i*(gW2*0.72/4);s+=`<line x1="${ax}" y1="${bY+gH2*0.4+14}" x2="${ax}" y2="${bY+gH2-22}" stroke="#3a9bd4" stroke-width="1.5" marker-end="url(#arb)" stroke-dasharray="5 3"/>`;s+=`<circle cx="${ax}" cy="${bY+gH2*0.4+10}" r="3" fill="#3a9bd4" opacity=".6"/>`}
  s+=`<text x="${gX+gW2/2}" y="${bY+gH2*0.7}" text-anchor="middle" font-size="8.5" fill="#1565c0" font-family="Inter,sans-serif">↓ Grit settling  vs_design = ${f2(d.vs_d*1000,3)} mm/s  [Stokes Law]</text>`;
  // Grit collection hopper
  s+=`<rect x="${gX+4}" y="${bY+gH2-18}" width="${gW2-8}" height="18" rx="2" fill="#c8a96e" opacity=".65" stroke="#8b7355" stroke-width="1"/>`;
  s+=`<text x="${gX+gW2/2}" y="${bY+gH2-6}" text-anchor="middle" font-size="8.5" fill="#3a2010" font-family="Inter,sans-serif" font-weight="600">Grit Collection Hopper</text>`;
  // Grit chamber dimensions text
  s+=`<text x="${gX+gW2/2}" y="${bY+gH2+16}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#5a5a5a" font-family="Inter,sans-serif">L = ${f2(d.gL,2)} m × W = ${f2(d.gW,2)} m × D = ${f2(d.gD,2)} m | ${d.ng} channels | V = ${f2(d.gVol,1)} m³</text>`;
  s+=`<text x="${gX+gW2/2}" y="${bY+gH2+30}" text-anchor="middle" font-size="8.5" fill="#888" font-family="Inter,sans-serif">Wall depth = ${f2(d.gWall,2)} m | L:W = ${f2(d.gL/d.gW,1)}:1 | W:D = ${f2(d.gW/d.gD,1)}:1</text>`;
  // ── DIMENSION LINES
  s+=DL(gX,bY+gH2+50,gX+gW2,bY+gH2+50,`L = ${f2(d.gL,2)} m`,false,'#1a9454');
  s+=DL(gX+gW2+14,bY,gX+gW2+14,bY+gH2,`D = ${f2(d.gD,2)} m (flow)`,true,'#1a9454');
  s+=DL(scrX,bY-20,scrX+scrW,bY-20,`W = ${d.W} m`,true,'#1a9454');
  // Grit discharge
  s+=`<line x1="${gX+gW2*0.3}" y1="${bY+gH2+34}" x2="${gX+gW2*0.3}" y2="${bY+gH2+84}" stroke="#8b7355" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arr)"/>`;
  s+=`<rect x="${gX+gW2*0.3-35}" y="${bY+gH2+70}" width="70" height="18" rx="3" fill="#f5edd8" stroke="#c8a96e" stroke-width="1"/>`;
  s+=`<text x="${gX+gW2*0.3}" y="${bY+gH2+83}" text-anchor="middle" font-size="8.5" fill="#5a4a2e" font-family="Inter,sans-serif" font-weight="600">Grit Discharge</text>`;
  // Effluent
  const efX=gX+gW2+12;
  s+=`<line x1="${efX}" y1="${bY+gH2/2}" x2="${efX+80}" y2="${bY+gH2/2}" stroke="#1a9454" stroke-width="2.8" marker-end="url(#arg)"/>`;
  s+=`<text x="${efX+84}" y="${bY+gH2/2-8}" font-size="9.5" font-weight="700" fill="#1a9454" font-family="Inter,sans-serif">To Primary</text>`;
  s+=`<text x="${efX+84}" y="${bY+gH2/2+7}" font-size="8.5" fill="#888" font-family="Inter,sans-serif">Clarifier →</text>`;
  // ── CROSS-SECTION (inset)
  const csX=gX+gW2+130,csY=bY,csW=130,csH=gH2+34;
  s+=`<text x="${csX+csW/2}" y="${csY-5}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#080808" font-family="Inter,sans-serif">CROSS-SECTION A-A</text>`;
  s+=`<rect x="${csX}" y="${csY}" width="${csW}" height="${csH}" rx="4" fill="#f5edd8" stroke="#8b7355" stroke-width="2"/>`;
  const flowH=Math.min(csH*0.52,80);
  s+=`<rect x="${csX+3}" y="${csY+csH-flowH-18}" width="${csW-6}" height="${flowH}" rx="2" fill="#3a9bd4" opacity=".18"/>`;
  s+=`<line x1="${csX+3}" y1="${csY+csH-flowH-18}" x2="${csX+csW-3}" y2="${csY+csH-flowH-18}" stroke="#3a9bd4" stroke-width="1.5" stroke-dasharray="5 3"/>`;
  s+=`<text x="${csX+csW/2}" y="${csY+csH-flowH-22}" text-anchor="middle" font-size="8" fill="#1565c0" font-family="Inter,sans-serif">Water Surface</text>`;
  s+=`<rect x="${csX+3}" y="${csY+csH-18}" width="${csW-6}" height="18" rx="2" fill="#c8a96e" opacity=".6"/>`;
  s+=`<text x="${csX+csW/2}" y="${csY+csH-6}" text-anchor="middle" font-size="7.5" fill="#3a2010" font-family="Inter,sans-serif">Grit Zone</text>`;
  s+=DL(csX,csY+csH+12,csX+csW,csY+csH+12,`W=${f2(d.gW,2)}m`,false,'#1a9454');
  s+=DL(csX+csW+10,csY,csX+csW+10,csY+csH-18,`D=${f2(d.gD,2)}m`,true,'#1a9454');
  s+=DL(csX+csW+10,csY+csH-18,csX+csW+10,csY+csH,`grit=${d.gd}m`,true,'#1a9454');
  // Section cut marker
  s+=`<line x1="${gX}" y1="${bY+gH2/2}" x2="${gX-16}" y2="${bY+gH2/2}" stroke="#080808" stroke-width="1.5" stroke-dasharray="3 2"/>`;
  s+=`<text x="${gX-18}" y="${bY+gH2/2+4}" text-anchor="end" font-size="8.5" fill="#080808" font-family="Inter,sans-serif" font-weight="700">A</text>`;
  s+=`<line x1="${gX+gW2}" y1="${bY+gH2/2}" x2="${gX+gW2+12}" y2="${bY+gH2/2}" stroke="#080808" stroke-width="1.5" stroke-dasharray="3 2"/>`;
  s+=`<text x="${gX+gW2+14}" y="${bY+gH2/2+4}" font-size="8.5" fill="#080808" font-family="Inter,sans-serif" font-weight="700">A</text>`;
  s+=TB(svgW,svgH,'Screening + Grit Removal — Plan View','M&E 5th Ed. Eq. 5-2 (Kirschmer) + Table 5-16 (Stokes) · '+vs('p_name'),'NTS','1 of 15');
  document.getElementById('sc-svg').setAttribute('viewBox',`0 0 ${svgW} ${svgH}`);
  document.getElementById('sc-svg').innerHTML=s;
  // switch to drawing tab
  const mc=document.getElementById('mod-content');
  mc.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  mc.querySelectorAll('.tp').forEach(p=>p.classList.remove('active'));
  const drwTab=mc.querySelectorAll('.tab')[3];if(drwTab){drwTab.classList.add('active');mc.querySelector('#sc-drw').classList.add('active')}
}

function buildScreen(){
  return`<div class="mwrap">
  <div class="mhdr"><div class="mh-left"><div class="mt-title">Screening &amp; Grit Removal<div class="mt-badge">PRETREATMENT</div></div><div class="mt-bread">Feed: <b id="sc_Qd">${fi(G.Q)}</b> m³/d · Peak: <b id="sc_Qpd">${fi(G.Q*G.PF)}</b> m³/d</div></div></div>
  <div class="tab-bar"><div class="tab active" onclick="stab(this,'sc-inp')">📋 Inputs</div><div class="tab" onclick="stab(this,'sc-bas')">📐 Design Basis</div><div class="tab" onclick="stab(this,'sc-res')">📊 Results</div><div class="tab" onclick="stab(this,'sc-drw')">🖼 2D Drawing</div><div class="tab" onclick="stab(this,'sc-chk')">✅ Checks</div></div>
  <div class="tp active" id="sc-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">🔲 Bar Screen — Kirschmer Headloss Equation</div><div class="card-hd-s">M&E 5th Ed. Eq. 5-2 · Table 5-3</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Channel Width (b)</label><div class="fuw"><input type="number" id="sc_W" value="0.9" step="0.1"><div class="fu">m</div></div><div class="h">Approach channel width</div></div>
        <div class="f"><label>Water Depth (y)</label><div class="fuw"><input type="number" id="sc_d" value="0.55" step="0.05"><div class="fu">m</div></div><div class="h">Normal flow depth in channel</div></div>
        <div class="f"><label>Bar Spacing — Clear (w)</label><div class="fuw"><input type="number" id="sc_b" value="20" step="5"><div class="fu">mm</div></div><div class="h">Fine: 6–20mm · Coarse: 25–50mm</div></div>
        <div class="f"><label>Bar Width / Thickness (t)</label><div class="fuw"><input type="number" id="sc_t" value="10" step="2"><div class="fu">mm</div></div><div class="h">Rectangular bar section</div></div>
        <div class="f"><label>Approach Velocity (v)</label><div class="fuw"><input type="number" id="sc_v" value="0.6" step="0.05"><div class="fu">m/s</div></div><div class="h">Typical: 0.3–0.9 m/s</div></div>
        <div class="f"><label>Screen Angle (θ)</label><div class="fuw"><input type="number" id="sc_ang" value="60" step="5"><div class="fu">°</div></div><div class="h">From horizontal (45–80°)</div></div>
        <div class="f"><label>β — Bar Shape Factor</label><input type="number" id="sc_beta" value="1.79" step="0.01"><div class="h">Sharp-edge rectangular = 1.79</div><div class="ref">M&E 5th Table 5-3</div></div>
        <div class="f"><label>No. of Screens (incl. standby)</label><input type="number" id="sc_ns" value="2" min="1" max="6"><div class="h">Min 2: 1 duty + 1 standby</div></div>
      </div>
    </div></div>
    <div class="card"><div class="card-hd"><div class="card-hd-t">🪨 Horizontal Flow Grit Chamber — Stokes' Law Settling</div><div class="card-hd-s">M&E 5th Ed. Section 5-3 · Table 5-16</div></div><div class="card-body">
      <div class="g4">
        <div class="f"><label>Design Grit Particle Dia. (dp)</label><div class="fuw"><input type="number" id="sc_dp" value="0.2" step="0.05"><div class="fu">mm</div></div><div class="h">Design minimum 0.2mm · Stokes applies</div><div class="ref">M&E 5th: 0.2mm minimum</div></div>
        <div class="f"><label>Grit Specific Gravity (Sg)</label><input type="number" id="sc_sg" value="2.65" step="0.05"><div class="h">Sand = 2.65 · Grit = 2.5–2.7</div></div>
        <div class="f"><label>Horizontal Control Velocity</label><div class="fuw"><input type="number" id="sc_vc" value="0.3" step="0.05"><div class="fu">m/s</div></div><div class="h">M&E typical: 0.3 m/s</div></div>
        <div class="f"><label>Detention Time at Peak Q</label><div class="fuw"><input type="number" id="sc_dt" value="60" step="10"><div class="fu">sec</div></div><div class="h">M&E range: 45–90 sec</div></div>
        <div class="f"><label>Added Length for I+O (%)</label><div class="fuw"><input type="number" id="sc_ladd" value="30" step="5"><div class="fu">%</div></div><div class="h">Inlet + outlet transition zone</div></div>
        <div class="f"><label>Grit Storage Depth</label><div class="fuw"><input type="number" id="sc_gd" value="0.25" step="0.05"><div class="fu">m</div></div></div>
        <div class="f"><label>Freeboard</label><div class="fuw"><input type="number" id="sc_fb" value="0.30" step="0.05"><div class="fu">m</div></div></div>
        <div class="f"><label>No. of Grit Channels</label><input type="number" id="sc_ng" value="2" min="1" max="6"><div class="h">Min 2 recommended</div></div>
      </div>
    </div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcScreen()">⚙️ Calculate Screening &amp; Grit</button></div>
  </div>
  <div class="tp" id="sc-bas">
    <div class="card"><div class="card-hd"><div class="card-hd-t">📐 Design Equations</div></div><div class="card-body">
      <div class="eq-blk"><div class="eq-t">Kirschmer Bar Screen Headloss — M&E Eq. 5-2</div><span class="eq-l">hL</span> = <span class="eq-r">β × (t/b)^(4/3) × v² / (2g) × sin(θ)</span><div class="eq-where">β = bar shape factor (1.79 sharp-edge) · t = bar width · b = clear spacing · v = approach vel. · θ = angle from horizontal<br>Clogged estimate: hL_clogged ≈ 3.5 × hL_clean</div></div>
      <div class="eq-blk"><div class="eq-t">Stokes' Law — Grit Particle Settling Velocity</div><span class="eq-l">vs</span> = <span class="eq-r">g × (ρs − ρw) × dp² / (18μ)</span><div class="eq-where">g = 9.81 m/s² · ρs = particle density (2650 kg/m³ for sand) · ρw = 1000 kg/m³ · dp = particle dia (m) · μ = 0.001 Pa·s at 20°C<br>Design settling vel. = 0.30 × vs (30% safety factor per M&E)</div></div>
      <div class="eq-blk"><div class="eq-t">Grit Chamber Length — Detention Time Basis</div><span class="eq-l">A</span> = <span class="eq-r">Qpeak / (n × vc)  [cross-sectional area per channel]</span><br><span class="eq-l">Lflow</span> = <span class="eq-r">vc × t  [length for flow]</span><br><span class="eq-l">Ltotal</span> = <span class="eq-r">Lflow × (1 + added%/100)</span><div class="eq-where">M&E Table 5-16: L:W ratio 3:1–5:1 · W:D ratio 1:1–5:1 · min 2 channels</div></div>
    </div></div>
    <div class="card-a card"><div class="card-hd"><div class="card-hd-t">📚 Reference Table — M&E 5th Ed. Table 5-16</div></div><div class="card-body" style="padding:0">
      <table class="rtable"><thead><tr><th>Parameter</th><th>Units</th><th>Range</th><th>Typical</th></tr></thead><tbody>
        <tr><td>Detention time</td><td>sec</td><td>45–90</td><td class="mono">60</td></tr>
        <tr><td>Horizontal velocity</td><td>m/s</td><td>0.25–0.40</td><td class="mono">0.30</td></tr>
        <tr><td>Added length for I+O</td><td>%</td><td>25–50</td><td class="mono">30</td></tr>
        <tr><td>L:W ratio</td><td>—</td><td>3:1–5:1</td><td class="mono">4:1</td></tr>
        <tr><td>W:D ratio</td><td>—</td><td>1:1–5:1</td><td class="mono">1.5:1</td></tr>
        <tr><td>Grit storage depth</td><td>m</td><td>0.2–0.5</td><td class="mono">0.25</td></tr>
      </tbody></table>
    </div></div>
  </div>
  <div class="tp" id="sc-res"><div id="sc-res-area"><div class="alert al-i">Click Calculate to see results.</div></div></div>
  <div class="tp" id="sc-drw">
    <div class="dwg-toolbar"><span>SCREENING + GRIT — PLAN + SECTION VIEW (NTS)</span><button class="btn btn-xs btn-dk" onclick="dlSVG('sc-svg','screening-grit-plan')">⬇ Export SVG</button></div>
    <div class="dwg-wrap"><svg id="sc-svg" viewBox="0 0 1100 580" xmlns="http://www.w3.org/2000/svg"><text x="550" y="290" text-anchor="middle" font-size="14" fill="#aaa" font-family="Inter,sans-serif">Calculate to generate detailed 2D engineering drawing</text></svg></div>
    <div class="dwg-legend"><div class="leg-i"><div class="leg-sw" style="background:#f5a623"></div>Bar Screen Channel</div><div class="leg-i"><div class="leg-sw" style="background:#f5edd8"></div>Grit Chamber</div><div class="leg-i"><div class="leg-sw" style="background:#c8a96e"></div>Grit Collection Hopper</div><div class="leg-i"><div class="leg-sw" style="background:#3a9bd4"></div>Flow Direction</div><div class="leg-i"><div class="leg-sw" style="background:#1a9454"></div>Effluent / Dimensions</div></div>
  </div>
  <div class="tp" id="sc-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Design Verification Checks</div><div class="card-hd-s">Per M&E 5th Ed. standards</div></div><div class="card-body" id="sc-chk-body"><div class="alert al-i">Calculate first.</div></div></div></div>
</div>`;
}
