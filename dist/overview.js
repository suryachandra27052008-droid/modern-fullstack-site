'use strict';
(() => {
  const video = document.getElementById('demo-video');
  if (!video) return;
  const hint = document.getElementById('film-playback-hint');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false, userPaused = false, internalPause = false;
  let requestingPlay = false, automaticPlayback = false, autoplayBlocked = false;

  video.defaultMuted = true;
  video.muted = true;
  const automaticAllowed = () => !reduced.matches && !navigator.connection?.saveData && !document.documentElement.hasAttribute('data-motion-paused');
  const covered = () => document.hidden || document.documentElement.hasAttribute('data-intro-open');
  function pause() {
    if (video.paused) return;
    internalPause = true;
    video.pause();
  }
  function update() {
    hint.textContent = automaticAllowed() && !autoplayBlocked
      ? 'Plays silently when in view. Use the controls for sound or pause.'
      : 'Use the video controls to play, pause or turn on sound.';
    if (!inView || covered()) { pause(); return; }
    if (!automaticAllowed()) { if (automaticPlayback) pause(); return; }
    if (userPaused || video.ended || !video.paused || requestingPlay || autoplayBlocked) return;
    requestingPlay = true;
    automaticPlayback = true;
    Promise.resolve(video.play()).then(() => {
      // A slow start must not begin playback after the visitor has scrolled away.
      if (!inView || covered() || !automaticAllowed() || userPaused) pause();
    }).catch(() => {
      autoplayBlocked = true;
      hint.textContent = 'Use the video controls to play, pause or turn on sound.';
    }).finally(() => { requestingPlay = false; });
  }
  video.addEventListener('pause', () => {
    if (internalPause) { internalPause = false; return; }
    if (!video.ended) userPaused = true;
  });
  video.addEventListener('play', () => {
    if (!requestingPlay) automaticPlayback = false;
    userPaused = false;
    autoplayBlocked = false;
  });
  video.addEventListener('error', () => {
    autoplayBlocked = true;
    document.getElementById('film-status').textContent = 'The video could not load. You can read the transcript below or run the interactive workflow demo.';
  });
  if (!('IntersectionObserver' in window)) {
    hint.textContent = 'Use the video controls to play, pause or turn on sound.';
    return;
  }
  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    inView = entry.isIntersecting && entry.intersectionRatio >= 0.35;
    update();
  }, {threshold:[0, 0.35]});
  observer.observe(video);
  reduced.addEventListener('change', update);
  navigator.connection?.addEventListener?.('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('autixai:motionchange', update);
  window.addEventListener('autixai:introchange', update);
  window.addEventListener('pagehide', () => { pause(); observer.disconnect(); });
  window.addEventListener('pageshow', event => { if (event.persisted) observer.observe(video); });
  update();
})();
