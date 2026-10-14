'use strict';
(() => {
  const dialog = document.getElementById('brand-intro');
  const video = document.getElementById('intro-video');
  const skip = document.getElementById('intro-skip');
  const symbol = document.getElementById('intro-symbol');
  const wordmark = document.getElementById('intro-wordmark');
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
  let merging = false;
  let logosReady = false;
  let frameToken;
  let animations = [];
  let startupTimer;
  let endTimer;
  let stallTimer;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(startupTimer);
    clearTimeout(endTimer);
    clearTimeout(stallTimer);
    if (frameToken !== undefined) video.cancelVideoFrameCallback?.(frameToken);
    animations.forEach(animation => animation.cancel());
    animations = [];
    listeners.abort();
    video.pause();
    video.removeAttribute('src');
    video.load();
    const close = () => {
      if (dialog.open) dialog.close();
      document.documentElement.removeAttribute('data-intro-open');
      document.documentElement.removeAttribute('data-intro-merging');
      document.documentElement.removeAttribute('data-intro-preparing');
      document.documentElement.style.removeProperty('--intro-gutter');
      if (opened) {
        window.dispatchEvent(new Event('autixai:introchange'));
        const target = previousFocus?.isConnected && previousFocus !== document.body
          ? previousFocus : document.getElementById('main');
        target?.focus({preventScroll: true});
      }
    };
    if (opened && !merging && !motionOff()) {
      // Early Skip/error exits reveal the actual page during the fade too.
      document.documentElement.setAttribute('data-intro-preparing','');
      dialog.classList.add('is-leaving');
      setTimeout(close, 300);
    } else close();
  };

  function preparePage() {
    if (!finished && !document.documentElement.hasAttribute('data-intro-preparing')) document.documentElement.setAttribute('data-intro-preparing','');
  }

  function sourceRect(x,y,width,height) {
    const rect = video.getBoundingClientRect();
    const contain = getComputedStyle(video).objectFit === 'contain';
    const ratio = (contain ? Math.min : Math.max)(rect.width/1920,rect.height/1080);
    return {left:rect.left+(rect.width-1920*ratio)/2+x*ratio,
      top:rect.top+(rect.height-1080*ratio)/2+y*ratio,width:width*ratio,height:height*ratio};
  }

  function travel(image,origin,target) {
    Object.assign(image.style,{left:origin.left+'px',top:origin.top+'px',width:origin.width+'px',height:origin.height+'px'});
    return image.animate([
      {transform:'translate3d(0,0,0) scale(1,1)'},
      {transform:`translate3d(${target.left-origin.left}px,${target.top-origin.top}px,0) scale(${target.width/origin.width},${target.height/origin.height})`}
    ],{duration:2100,delay:160,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  }

  function merge() {
    if (!opened || finished || merging || !logosReady || motionOff()) return;
    const iconTarget = document.querySelector('.site-header .brand-icon');
    const wordTarget = document.querySelector('.site-header .brand-wordmark');
    if (!iconTarget || !wordTarget || typeof symbol.animate !== 'function') return;
    const iconRect = iconTarget.getBoundingClientRect();
    const wordRect = wordTarget.getBoundingClientRect();
    if (!iconRect.width || !wordRect.width) return;
    merging = true;
    preparePage();
    clearTimeout(stallTimer);
    if (frameToken !== undefined) video.cancelVideoFrameCallback?.(frameToken);
    video.pause();
    try {
      animations.push(travel(symbol,sourceRect(765.3,210.475,389.4,257.4),iconRect));
      animations.push(travel(wordmark,sourceRect(733.95,669.175,442.2,108.9),wordRect));
      dialog.classList.add('is-merging');
      document.documentElement.setAttribute('data-intro-merging','');
      // A bounded exit also covers missing animation completion events.
      clearTimeout(endTimer);
      endTimer = setTimeout(finish,2280);
    } catch { finish(); }
  }

  const checkFrame = () => {
    if (finished || merging) return;
    if (video.currentTime >= 7.6) preparePage();
    if (video.currentTime >= 8.3) merge();
    if (!finished && !merging && video.requestVideoFrameCallback) frameToken = video.requestVideoFrameCallback(checkFrame);
  };

  video.addEventListener('playing', () => {
    if (finished) return;
    clearTimeout(stallTimer);
    if (opened) return;
    if (motionOff() || document.querySelector('dialog[open]')) { finish(); return; }
    clearTimeout(startupTimer);
    // Keep the page's original width while the cover uses the full viewport.
    document.documentElement.style.setProperty('--intro-gutter',Math.max(0,window.innerWidth-document.documentElement.clientWidth)+'px');
    dialog.style.width = window.innerWidth+'px';
    try { dialog.showModal(); } catch { finish(); return; }
    opened = true;
    document.documentElement.setAttribute('data-intro-open', '');
    window.dispatchEvent(new Event('autixai:introchange'));
    endTimer = setTimeout(finish, 12000);
    if (video.requestVideoFrameCallback) frameToken = video.requestVideoFrameCallback(checkFrame);
  }, options);
  // Media events support old browsers without a continuous JS animation loop.
  video.addEventListener('timeupdate', () => {
    if (!video.requestVideoFrameCallback) {
      if (video.currentTime >= 7.6) preparePage();
      if (video.currentTime >= 8.3) merge();
    }
  }, options);
  video.addEventListener('ended', finish, options);
  video.addEventListener('error', finish, options);
  video.addEventListener('waiting', () => {
    if (opened && !merging) { clearTimeout(stallTimer); stallTimer = setTimeout(finish, 2000); }
  }, options);
  skip.addEventListener('click', finish, options);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); }, options);
  // If someone starts using the site before playback is ready, keep them there.
  document.addEventListener('pointerdown', () => { if (!opened) finish(); }, {...options, passive: true});
  document.addEventListener('keydown', () => { if (!opened) finish(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);
  window.addEventListener('pagehide', finish, options);
  // Rotation changes the destination; return directly to the new layout.
  window.addEventListener('resize', () => {
    if (merging) finish();
    else if (opened) dialog.style.width = window.innerWidth+'px';
  }, options);
  window.addEventListener('autixai:motionchange', () => { if (motionOff()) finish(); }, options);
  reduced.addEventListener('change', () => { if (motionOff()) finish(); }, options);

  // A single functional tab-session flag; no visitor identifiers or enquiry data.
  try { sessionStorage.setItem(key, '1'); } catch { /* Playback still works without storage. */ }
  video.defaultMuted = true;
  video.muted = true;
  if (symbol && wordmark) {
    for (const image of [symbol,wordmark]) image.src = image.dataset.src;
    Promise.all([symbol.decode(),wordmark.decode()]).then(() => { logosReady = true; }).catch(() => { /* Normal video fade remains available. */ });
  }
  video.src = matchMedia('(max-width: 800px)').matches ? video.dataset.mobileSrc : video.dataset.src;
  // CDN delivery can take a few seconds on a fresh visit. The homepage stays
  // usable during this window, and any interaction cancels the delayed intro.
  startupTimer = setTimeout(finish, 8000);
  try { video.play().catch(finish); } catch { finish(); }
})();
