'use strict';
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  const close = () => {
    nav.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      nav.hidden = open;
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !nav.hidden) { close(); toggle.focus(); }
    });
  }
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
