/* ════ NAV & UI ════ */
function goHome(){showScr('home');nt('nt-home')}
function showWiz(){showScr('wizard');nt('nt-wizard');wz(wizCur)}
function showModules(){showScr('modules');nt('nt-modules')}
function showScr(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show'));
  document.getElementById('screen-'+id)?.classList.add('show');
  window.scrollTo(0, 0);
  setTimeout(() => {
    if(window.lenis) {
      window.lenis.resize();
      window.lenis.scrollTo(0, {immediate: true});
    }
    if(typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }, 100);
}
function nt(id){document.querySelectorAll('.nt').forEach(t=>t.classList.remove('active'));document.getElementById(id)?.classList.add('active')}
function gm(id, el){
  showModules();
  const mc=document.getElementById('mod-content');
  if(mc)mc.innerHTML=buildMod(id);
  document.querySelectorAll('.si').forEach(s=>s.classList.remove('active'));
  if(el) {
    el.classList.add('active');
  } else {
    let target = document.getElementById('msb-'+id);
    if (!target) {
      target = document.querySelector(`.si[data-mod="${id}"]`);
    }
    if(target) target.classList.add('active');
  }
  populateGlobals(id);
  
  const isSameModule = window._currentModule === id;
  window._currentModule = id;
  
  if (!isSameModule) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const panel = document.getElementById('mod-content');
      if (panel) {
        // Fallback for browsers that don't support smooth scrolling behavior on elements
        try { panel.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) { panel.scrollTop = 0; }
      }
    }, 10);
  }
}

window.toggleCat = function(headEl) {
  const cat = headEl.closest('.sb-cat');
  if(cat) {
    cat.classList.toggle('expanded');
  }
};

/* ══════ TAB SWITCH ══════ */
function stab(el,panelId){
  const wrap=el.closest('.mwrap')||el.closest('[id^="screen-"]')||el.closest('.panel-main');
  if(!wrap)return;
  wrap.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  wrap.querySelectorAll('.tp').forEach(p=>p.classList.remove('active'));
  const p=wrap.querySelector('#'+panelId);if(p)p.classList.add('active');
}

/* ════ FORM LABEL CLICK HANDLER ════ */
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'LABEL') {
    const fWrapper = e.target.closest('.f');
    if (fWrapper) {
      const input = fWrapper.querySelector('input, select, textarea');
      if (input) input.focus();
    }
  }
});

/* ════ DIGITAL TWIN INTERACTIVITY ════ */
document.addEventListener('DOMContentLoaded', () => {
  const dtNodes = document.querySelectorAll('.dt-node');
  const modCards = document.querySelectorAll('.mgc');

  const catMap = {
    'pretreat': 'pretreat',
    'primary': 'primary',
    'secondary': 'biological',
    'membrane': 'biological',
    'batch': 'biological',
    'biofilm': 'biological',
    'anaerobic': 'biological',
    'flotation': 'primary',
    'fixedfilm': 'biological',
    'solids': 'biological',
    'clarifier': 'clarifier',
    'tertiary': 'tertiary',
    'natural': 'biological',
    'industrial': 'pretreat'
  };

  modCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const cat = card.getAttribute('data-cat');
      const dtLink = catMap[cat];
      if(dtLink) {
        dtNodes.forEach(n => n.classList.remove('active'));
        const targetNode = document.querySelector(`.dt-node[data-link="${dtLink}"]`);
        if(targetNode) targetNode.classList.add('active');
      }
    });
    card.addEventListener('mouseleave', () => {
      dtNodes.forEach(n => n.classList.remove('active'));
    });
  });
  
  initCountUp();
});

/* ════ ANIMATED STATISTICS ════ */
function initCountUp() {
  const counters = document.querySelectorAll('.count-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        const target = parseFloat(entry.target.getAttribute('data-target'));
        const isDecimal = target % 1 !== 0;
        const decimals = isDecimal ? (target.toString().split('.')[1]?.length || 1) : 0;
        animateValue(entry.target, 0, target, 1800, decimals);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  counters.forEach(c => observer.observe(c));
}

window.animateValue = function(obj, start, end, duration, decimals = 0) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
    const current = start + easeProgress * (end - start);
    
    // Check if the end has a specific string format
    let displayVal = current.toFixed(decimals);
    if(obj.hasAttribute('data-prefix')) displayVal = obj.getAttribute('data-prefix') + displayVal;
    if(obj.hasAttribute('data-suffix')) displayVal = displayVal + obj.getAttribute('data-suffix');
    
    obj.innerHTML = displayVal;
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      let finalVal = end.toFixed(decimals);
      if(obj.hasAttribute('data-prefix')) finalVal = obj.getAttribute('data-prefix') + finalVal;
      if(obj.hasAttribute('data-suffix')) finalVal = finalVal + obj.getAttribute('data-suffix');
      obj.innerHTML = finalVal;
    }
  };
  window.requestAnimationFrame(step);
};
