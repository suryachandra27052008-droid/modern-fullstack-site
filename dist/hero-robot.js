// The authored model is bundled locally; the rest of the site has no Three.js dependency.
export function mountHeroRobot(host, {
  root = document.documentElement,
  scope = window,
  intro = host.ownerDocument?.getElementById('intro-video'),
  load = () => import('./robot/companion.js?v=20261024.3')
} = {}) {
  let destroy, pending, generation = 0, suspended = false;
  const covered = () => root.hasAttribute('data-intro-open') || Boolean(intro?.hasAttribute('src'));
  const motionPaused = () => root.hasAttribute('data-motion-paused');
  async function start() {
    if (suspended || covered() || destroy || pending) return;
    const current = generation;
    pending = load();
    try {
      const {createCompanion} = await pending;
      if (!suspended && !covered() && generation === current) {
        destroy = createCompanion(host, {motionPaused, covered});
      }
    } catch {
      // The supplied static illustration remains visible if the local bundle fails.
    } finally {
      if (generation === current) pending = null;
    }
  }
  function stop() {
    suspended = true;
    generation++;
    pending = null;
    destroy?.();
    destroy = null;
  }
  function resume() { suspended = false; start(); }
  scope.addEventListener('autixai:introchange', start);
  intro?.addEventListener('emptied', start);
  scope.addEventListener('pagehide', stop);
  scope.addEventListener('pageshow', resume);
  start();
  return () => {
    stop();
    scope.removeEventListener('autixai:introchange', start);
    intro?.removeEventListener('emptied', start);
    scope.removeEventListener('pagehide', stop);
    scope.removeEventListener('pageshow', resume);
  };
}

if (typeof document !== 'undefined') {
  const host = document.getElementById('hero-robot');
  if (host) mountHeroRobot(host);
}
