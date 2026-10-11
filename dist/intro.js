'use strict';
(() => {
  const dialog = document.getElementById('brand-intro');
  const video = document.getElementById('intro-video');
  const skip = document.getElementById('intro-skip');
  if (!dialog || !video || !skip || typeof dialog.showModal !== 'function') return;

  const key = 'autixai-intro-seen-v1';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => reduced.matches || document.documentElement.hasAttribute('data-motion-paused');
  let seen = false;
  try { seen = sessionStorage.getItem(key) === '1'; } catch { /* Storage is optional. */ }
  const url = new URL(location.href);
  const navigation = performance.getEntriesByType('navigation')[0];
  if (seen || motionOff() || url.hash || url.searchParams.has('intent') ||
      navigation?.type === 'back_forward' || navigator.connection?.saveData ||
      ['slow-2g', '2g'].includes(navigator.connection?.effectiveType)) return;

  const listeners = new AbortController();
  const options = {signal: listeners.signal};
  const previousFocus = document.activeElement;
  let opened = false;
  let finished = false;
  let startupTimer;
  let endTimer;
  let stallTimer;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(startupTimer);
    clearTimeout(endTimer);
    clearTimeout(stallTimer);
    listeners.abort();
    video.pause();
    video.removeAttribute('src');
    video.load();
    const close = () => {
      if (dialog.open) dialog.close();
      document.documentElement.removeAttribute('data-intro-open');
      if (opened) {
        const target = previousFocus?.isConnected && previousFocus !== document.body
          ? previousFocus : document.getElementById('main');
        target?.focus({preventScroll: true});
      }
    };
    if (opened && !motionOff()) {
      dialog.classList.add('is-leaving');
      setTimeout(close, 300);
    } else close();
  };

  video.addEventListener('playing', () => {
    if (finished) return;
    clearTimeout(stallTimer);
    if (opened) return;
    if (motionOff() || document.querySelector('dialog[open]')) { finish(); return; }
    clearTimeout(startupTimer);
    try { dialog.showModal(); } catch { finish(); return; }
    opened = true;
    document.documentElement.setAttribute('data-intro-open', '');
    endTimer = setTimeout(finish, 12000);
  }, options);
  video.addEventListener('ended', finish, options);
  video.addEventListener('error', finish, options);
  video.addEventListener('waiting', () => {
    if (opened) { clearTimeout(stallTimer); stallTimer = setTimeout(finish, 2000); }
  }, options);
  skip.addEventListener('click', finish, options);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); }, options);
  // If someone starts using the site before playback is ready, keep them there.
  document.addEventListener('pointerdown', () => { if (!opened) finish(); }, {...options, passive: true});
  document.addEventListener('keydown', () => { if (!opened) finish(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);
  window.addEventListener('pagehide', finish, options);
  window.addEventListener('autixai:motionchange', () => { if (motionOff()) finish(); }, options);
  reduced.addEventListener('change', () => { if (motionOff()) finish(); }, options);

  // A single functional tab-session flag; no visitor identifiers or enquiry data.
  try { sessionStorage.setItem(key, '1'); } catch { /* Playback still works without storage. */ }
  video.defaultMuted = true;
  video.muted = true;
  video.src = matchMedia('(max-width: 800px)').matches ? video.dataset.mobileSrc : video.dataset.src;
  startupTimer = setTimeout(finish, 2000);
  try { video.play().catch(finish); } catch { finish(); }
})();
