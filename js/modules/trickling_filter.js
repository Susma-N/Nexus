/* ══════ TRICKLING FILTER ══════ */
function buildTrickling(){return`<div class="mwrap"><div class="mhdr"><div class="mh-left"><div class="mt-title">Trickling Filter Design<div class="mt-badge">FIXED FILM</div></div><div class="mt-bread">NRC Formula · 1-Stage and 2-Stage · M&E 5th Ed. Section 9-3</div></div></div>
  <div class="tab-bar"><div class="tab active" onclick="stab(this,'tf-inp')">📋 Inputs</div><div class="tab" onclick="stab(this,'tf-res')">📊 Results</div><div class="tab" onclick="stab(this,'tf-chk')">✅ Checks</div></div>
  <div class="tp active" id="tf-inp">
    <div class="card"><div class="card-hd"><div class="card-hd-t">🏔️ Trickling Filter — NRC Formula</div></div><div class="card-body"><div class="g4">
      <div class="f"><label>Prim. Effluent Flow Q</label><div class="fuw"><input type="number" id="tf_Q" value="${G.Q}"><div class="fu">m³/d</div></div></div>
      <div class="f"><label>Influent BOD</label><div class="fuw"><input type="number" id="tf_BOD" value="${Math.round(G.BOD*(1-G.primaryBODrem/100))}"><div class="fu">mg/L</div></div></div>
      <div class="f"><label>Target Eff. BOD</label><div class="fuw"><input type="number" id="tf_BODe" value="${G.BODe}"><div class="fu">mg/L</div></div></div>
      <div class="f"><label>Media Depth H</label><div class="fuw"><input type="number" id="tf_H" value="2" step="0.5"><div class="fu">m</div></div></div>
      <div class="f"><label>Recirculation Ratio R</label><input type="number" id="tf_R" value="2" step="0.5"><div class="h">Recirculated/Raw flow</div></div>
      <div class="f"><label>No. of Filters</label><input type="number" id="tf_N" value="1" min="1" max="4"></div>
    </div></div></div>
    <div class="btn-row mt"><button class="btn btn-a" onclick="calcTrickling()">⚙️ Calculate Trickling Filter</button></div>
  </div>
  <div class="tp" id="tf-res"><div id="tf-ra"><div class="alert al-i">Calculate first.</div></div></div>
  <div class="tp" id="tf-chk"><div class="card"><div class="card-hd"><div class="card-hd-t">✅ Checks</div></div><div class="card-body" id="tf-ckb"><div class="alert al-i">Calculate.</div></div></div></div>
</div>`}
function calcTrickling(){
  const Q=vv('tf_Q'),BOD=vv('tf_BOD'),BODe=vv('tf_BODe'),H=vv('tf_H'),R=vv('tf_R'),N=vv('tf_N');
  const E=(BOD-BODe)/BOD;
  const F=(1+R)/Math.pow(1+0.1*R,2);
  const wV=(BOD*Q/1000);
  const w_over_VF=Math.pow((1-E)/(0.4432*E),2);
  const V=wV/w_over_VF/F;const VN=V/N;
  const D=Math.sqrt(4*VN/(Math.PI*H));
  const BODload=wV/1000/V;
  const HydLoad=Q*(1+R)/(Math.PI*D*D/4*N);
  document.getElementById('tf-ra').innerHTML=
    rs('📐 Filter Dimensions ('+N+' filters)',rg([rc(f2(V,0),'Total Media Volume','m³'),rc(f2(VN,0),'Volume per Filter','m³','amb'),rc(f2(D,2),'Filter Diameter','m','amb'),rc(f2(H,1),'Media Depth','m'),rc(f2(E*100,1),'BOD Efficiency','%','ok'),rc(f2(F,3),'Recirculation Factor F','—'),rc(f2(BODload,3),'BOD Loading','kg BOD/d/m³'),rc(f2(HydLoad,2),'Hydraulic Loading','m³/d/m²')]));
  document.getElementById('tf-ckb').innerHTML=`<div class="ck-list">${[ck(BODload<=0.4,'BOD loading ≤0.4 kg/d/m³',f2(BODload,3)),ck(HydLoad>=1&&HydLoad<=30,'Hydraulic loading 1–30 m³/d/m²',f2(HydLoad,2))].join('')}</div>`;
  const mc=document.getElementById('mod-content');mc.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));mc.querySelectorAll('.tp').forEach(p=>p.classList.remove('active'));mc.querySelectorAll('.tab')[1]?.classList.add('active');mc.querySelector('#tf-res')?.classList.add('active');
}
