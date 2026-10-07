'use strict';
(() => {
  const selector = '.service-card,.portfolio-card,.case-card,.scope-card,.time-calculator,.team-note,.security-note,.workflow-panel,.floating-note,.process-grid>article,.industry-ideas,.inquiry-form,.privacy-request-form,.ax-workflow';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const phone = matchMedia('(max-width: 800px)');
  const cards = new Set(), visible = new Set();
  let frame = 0, pointerCard = null, point = null;
  const off = () => reduced.matches || document.documentElement.hasAttribute('data-motion-paused');
  const reset = card => { for (const key of ['--card-axis-x','--card-axis-y','--card-angle','--card-lift','--shine-x','--shine-y','--shine-alpha']) card.style.removeProperty(key); };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) { if (entry.isIntersecting) visible.add(entry.target); else { visible.delete(entry.target); reset(entry.target); } }
    queue();
  }, {rootMargin:'40px',threshold:0.05});
  function register(card) {
    if (!card || cards.has(card)) return;
    cards.add(card); card.classList.add('card-3d');
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    const sheen = document.createElement('span'); sheen.className = 'card-sheen'; sheen.setAttribute('aria-hidden','true'); card.append(sheen);
    observer.observe(card);
  }
  function queue() { if (!frame) frame = requestAnimationFrame(render); }
  function render() {
    frame = 0;
    if (off()) { cards.forEach(reset); return; }
    if (finePointer.matches && pointerCard && point && !pointerCard.matches(':focus-within')) {
      const rect = pointerCard.getBoundingClientRect();
      const x = Math.max(-0.5,Math.min(0.5,(point.x-rect.left)/rect.width-0.5));
      const y = Math.max(-0.5,Math.min(0.5,(point.y-rect.top)/rect.height-0.5));
      pointerCard.style.setProperty('--card-axis-x', String(-y));
      pointerCard.style.setProperty('--card-axis-y', String(x));
      pointerCard.style.setProperty('--card-angle', `${Math.hypot(x,y)*7}deg`);
      pointerCard.style.setProperty('--card-lift','-4px');
      pointerCard.style.setProperty('--shine-x', `${(x+0.5)*100}%`);
      pointerCard.style.setProperty('--shine-y', `${(y+0.5)*100}%`);
      pointerCard.style.setProperty('--shine-alpha','.38');
    } else if (phone.matches) {
      for (const card of visible) {
        // The service rail owns its continuous, position-driven 3D movement.
        if (card.classList.contains('service-card')) continue;
        if (card.matches(':focus-within')) { reset(card); continue; }
        const rect = card.getBoundingClientRect();
        const horizontal = card.classList.contains('service-card');
        const relative = horizontal ? (rect.left+rect.width/2-innerWidth/2)/innerWidth : (rect.top+rect.height/2-innerHeight/2)/innerHeight;
        card.style.setProperty('--card-axis-x',horizontal ? '0' : '1');
        card.style.setProperty('--card-axis-y',horizontal ? '1' : '0');
        card.style.setProperty('--card-angle',`${Math.max(-2.5,Math.min(2.5,relative*4))}deg`);
        card.style.setProperty('--shine-x',horizontal ? `${50-relative*30}%` : '50%');
        card.style.setProperty('--shine-y',horizontal ? '35%' : `${50-relative*30}%`);
        card.style.setProperty('--shine-alpha','.22');
      }
    }
  }
  document.querySelectorAll(selector).forEach(register);
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || off() || event.pointerType !== 'mouse') return;
    const target = event.target.closest(selector);
    const card = target?.classList.contains('service-card') ? null : target;
    if (card !== pointerCard) { if (pointerCard) reset(pointerCard); pointerCard = card; }
    if (card) { register(card); point = {x:event.clientX,y:event.clientY}; queue(); }
  }, {passive:true});
  document.addEventListener('pointerout', event => {
    if (pointerCard && !pointerCard.contains(event.relatedTarget)) { reset(pointerCard); pointerCard = null; point = null; }
  }, {passive:true});
  document.addEventListener('focusin', event => { const card = event.target.closest(selector); if (card) { register(card); reset(card); } });
  document.addEventListener('scroll', () => { if (phone.matches) queue(); }, {passive:true,capture:true});
  window.addEventListener('resize', () => { cards.forEach(reset); queue(); }, {passive:true});
  window.addEventListener('autixai:motionchange', () => { cards.forEach(reset); queue(); });
  reduced.addEventListener('change', () => { cards.forEach(reset); queue(); });
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; observer.disconnect(); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { cards.forEach(card => observer.observe(card)); queue(); }
  });
})();
