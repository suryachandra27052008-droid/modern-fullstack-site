'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => reduced.matches || document.documentElement.hasAttribute('data-motion-paused');
  const cards = new Set();
  let point = null, frame = 0, touchedCard = null, touchingMarquee = false;

  function drawSpotlight() {
    frame = 0;
    if (!point || motionOff()) return;
    const {card,x,y} = point;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${Math.max(0,Math.min(rect.width,x-rect.left))}px`);
    card.style.setProperty('--mouse-y', `${Math.max(0,Math.min(rect.height,y-rect.top))}px`);
  }
  function follow(card, event) {
    if (motionOff()) return;
    point = {card,x:event.clientX,y:event.clientY};
    if (!frame) frame = requestAnimationFrame(drawSpotlight);
  }
  function clearTouch() {
    touchedCard?.classList.remove('is-spotlit');
    touchedCard = null;
  }
  document.querySelectorAll('.service-card,.process-card,.glass-card,.glass,.scope-card,.case-card,.process-grid>article').forEach(card => {
    cards.add(card);
    card.classList.add('spotlight-card');
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    // Preserve the process timeline dot while its former pseudo-element lights the card.
    if (card.parentElement.classList.contains('process-grid')) {
      const dot = document.createElement('span');
      dot.className = 'spotlight-timeline-dot'; dot.setAttribute('aria-hidden','true'); card.append(dot);
    }
    card.addEventListener('pointermove', event => follow(card,event), {passive:true});
    card.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' && !motionOff()) {
        clearTouch(); touchedCard = card; card.classList.add('is-spotlit');
      }
      follow(card,event);
    }, {passive:true});
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-spotlit');
      if (point?.card === card) point = null;
    }, {passive:true});
  });

  const marquees = [...document.querySelectorAll('.tool-marquee')].map(element => ({element,button:element.parentElement.querySelector('.marquee-toggle')}));
  function updateControls() {
    const off = motionOff();
    for (const {element,button} of marquees) {
      const paused = element.hasAttribute('data-user-paused');
      const label = off ? 'Tool marquee motion is off' : paused ? 'Resume tool marquee' : 'Pause tool marquee';
      button.disabled = off;
      button.setAttribute('aria-label',label); button.title = label;
      button.setAttribute('aria-pressed',String(off || paused));
      button.querySelector('span').textContent = off ? '―' : paused ? '▶' : 'Ⅱ';
    }
    if (off) {
      cancelAnimationFrame(frame); frame = 0; point = null; clearTouch();
      cards.forEach(card => { card.style.removeProperty('--mouse-x'); card.style.removeProperty('--mouse-y'); });
    }
  }
  for (const {element,button} of marquees) {
    element.classList.add('is-marquee-ready'); button.hidden = false;
    button.addEventListener('click', () => { element.toggleAttribute('data-user-paused'); updateControls(); });
    element.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse') element.setAttribute('data-touch-paused','');
    }, {passive:true});
    element.addEventListener('touchstart', () => {
      touchingMarquee = true; element.setAttribute('data-touch-paused','');
    }, {passive:true});
  }
  function releasePointer() {
    clearTouch();
    if (!touchingMarquee) marquees.forEach(({element}) => element.removeAttribute('data-touch-paused'));
  }
  window.addEventListener('pointerup',releasePointer,{passive:true});
  window.addEventListener('pointercancel',releasePointer,{passive:true});
  const releaseTouch = event => { if (!event.touches.length) { touchingMarquee = false; releasePointer(); } };
  window.addEventListener('touchend',releaseTouch,{passive:true});
  window.addEventListener('touchcancel',releaseTouch,{passive:true});
  window.addEventListener('blur',() => { touchingMarquee = false; releasePointer(); });
  window.addEventListener('autixai:motionchange',updateControls);
  reduced.addEventListener('change',updateControls);

  const motionElements = [...document.querySelectorAll('.tool-marquee,.cta-beam')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.toggleAttribute('data-inview',entry.isIntersecting));
  }, {threshold:0.1});
  const observeMotion = () => motionElements.forEach(element => observer.observe(element));
  const visibility = () => motionElements.forEach(element => element.toggleAttribute('data-ui-hidden',document.hidden));
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; observer.disconnect(); touchingMarquee = false; releasePointer(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { observeMotion(); visibility(); updateControls(); } });
  observeMotion(); visibility(); updateControls();
})();
