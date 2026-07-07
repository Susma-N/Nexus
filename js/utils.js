/* ════ HELPERS ════ */
const f2=(v,d=2)=>(!isFinite(v)||isNaN(v))?'—':(+v).toFixed(d);
const fi=v=>(!isFinite(v)||isNaN(v))?'—':Math.round(v).toLocaleString();
const vv=id=>{const e=document.getElementById(id);return e?+(e.value)||0:0}
const vs=id=>{const e=document.getElementById(id);return e?e.value:''}
const set=v=>{const e=document.getElementById(v[0]);if(e)e.textContent=v[1]}
function rc(val,lbl,unit,cls=''){return`<div class="rc ${cls}"><div class="rv">${val}</div><div class="rl">${lbl}</div><div class="ru">${unit}</div></div>`}
function rs(title,content){return`<div class="rs"><div class="rs-t">${title}</div>${content}</div>`}
function rg(cards){return`<div class="rg">${Array.isArray(cards)?cards.join(''):cards}</div>`}
function ck(ok,label,val,ref=''){const cls=ok===true?'pass':ok===false?'fail':'warn';return`<div class="ck ${cls}"><div class="ck-d"></div><span>${label}</span><span class="ck-v">${val}</span>${ref?`<span class="ck-ref">${ref}</span>`:''}</div>`}
function mkArr(id='ar',col='#f5a623'){return`<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M2 2L8 5L2 8" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/></marker>`}
function dlSVG(svgId,fn){const sv=document.getElementById(svgId);if(!sv)return;const b=new Blob([sv.outerHTML],{type:'image/svg+xml'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(fn||'drawing')+'.svg';a.click()}
/* SVG title block */
function TB(W,H,title,sub,scale,sheet){const y=H-52;return`
<rect x="0" y="${y}" width="${W}" height="52" fill="#080808"/>
<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#f5a623" stroke-width="1.5"/>
<text x="14" y="${y+14}" font-size="9" font-weight="900" fill="#f5a623" font-family="Inter,sans-serif" letter-spacing="2">AAPAAVANI NEXUS</text>
<text x="14" y="${y+30}" font-size="12.5" font-weight="700" fill="#fff" font-family="Space Grotesk,Inter,sans-serif">${title}</text>
<text x="14" y="${y+45}" font-size="9" fill="rgba(255,255,255,.38)" font-family="Inter,sans-serif">${sub}</text>
<text x="${W-14}" y="${y+14}" text-anchor="end" font-size="9" fill="rgba(255,255,255,.4)" font-family="Inter,sans-serif">Scale: ${scale}</text>
<text x="${W-14}" y="${y+28}" text-anchor="end" font-size="9" fill="rgba(255,255,255,.4)" font-family="Inter,sans-serif">Sheet: ${sheet}</text>
<text x="${W-14}" y="${y+44}" text-anchor="end" font-size="8.5" fill="rgba(255,255,255,.24)" font-family="Inter,sans-serif">${new Date().toLocaleDateString('en-IN')}</text>`}
/* Dimension line */
function DL(x1,y1,x2,y2,label,above=true,col='#1a9454'){const mx=(x1+x2)/2,my=(y1+y2)/2,off=above?-11:13;
return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width=".8" stroke-dasharray="4 2"/>
<line x1="${x1}" y1="${y1-5}" x2="${x1}" y2="${y1+5}" stroke="${col}" stroke-width="1"/>
<line x1="${x2}" y1="${y2-5}" x2="${x2}" y2="${y2+5}" stroke="${col}" stroke-width="1"/>
<text x="${mx}" y="${my+off}" text-anchor="middle" font-size="9.5" fill="${col}" font-family="Inter,sans-serif" font-weight="700">${label}</text>`}
