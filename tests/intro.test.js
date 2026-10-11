import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../dist/intro.js', import.meta.url), 'utf8');

function page({seen = false, reduced = false, hash = '', intent = false, saveData = false, mobile = false, blocked = false, unavailableStorage = false} = {}) {
  const attributes = new Map();
  const timers = new Map();
  const storage = new Map(seen ? [['autixai-intro-seen-v1', '1']] : []);
  let time = 0, id = 0, played = 0, focused = false;
  const dialog = new EventTarget();
  dialog.open = false;
  dialog.classList = {add() {}};
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  const video = new EventTarget();
  video.dataset = {src: '/desktop.mp4', mobileSrc: '/mobile.mp4'};
  video.play = () => { played++; return blocked ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(); };
  video.pause = () => { video.paused = true; };
  video.removeAttribute = name => { if (name === 'src') video.src = ''; };
  video.load = () => {};
  const skip = new EventTarget();
  const main = {focus() { focused = true; }};
  const document = new EventTarget();
  document.body = {};
  document.activeElement = document.body;
  document.hidden = false;
  document.documentElement = {
    hasAttribute: name => attributes.has(name),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name)
  };
  document.getElementById = name => ({'brand-intro': dialog, 'intro-video': video, 'intro-skip': skip, main})[name];
  document.querySelector = () => dialog.open ? dialog : null;
  const media = new EventTarget();
  media.matches = reduced;
  const setTimeout = (callback, delay) => { const token = ++id; timers.set(token, {callback, at: time + delay}); return token; };
  runInNewContext(source, {
    document, window: new EventTarget(), URL, AbortController,
    location: {href: `https://example.com/${intent ? '?intent=audit' : ''}${hash}`},
    performance: {getEntriesByType: () => []},
    navigator: {connection: {saveData}},
    matchMedia: query => query.includes('max-width') ? {matches: mobile} : media,
    sessionStorage: {
      getItem: name => { if (unavailableStorage) throw new Error('Storage blocked'); return storage.get(name); },
      setItem: (name, value) => { if (unavailableStorage) throw new Error('Storage blocked'); storage.set(name, value); }
    },
    setTimeout, clearTimeout: token => timers.delete(token)
  });
  const advance = ms => {
    time += ms;
    for (const [token, timer] of [...timers]) {
      if (timer.at <= time && timers.delete(token)) timer.callback();
    }
  };
  return {dialog, video, skip, document, storage, advance,
    get played() { return played; }, get focused() { return focused; },
    get locked() { return attributes.has('data-intro-open'); }};
}

test('intro bypasses repeat sessions, reduced motion, deep links and data saving without fetching media', () => {
  for (const settings of [{seen:true},{reduced:true},{hash:'#contact'},{intent:true},{saveData:true}]) {
    const p = page(settings);
    assert.equal(p.played, 0);
    assert.equal(p.video.src, undefined);
    assert.equal(p.dialog.open, false);
    assert.equal(p.locked, false);
  }
});

test('muted intro uses the phone asset, opens only on actual playback, then restores the homepage', () => {
  const p = page({mobile:true});
  assert.equal(p.video.src, '/mobile.mp4');
  assert.equal(p.video.muted, true);
  assert.equal(p.video.defaultMuted, true);
  assert.equal(p.dialog.open, false);
  assert.equal(p.storage.get('autixai-intro-seen-v1'), '1');
  p.video.dispatchEvent(new Event('playing'));
  assert.equal(p.dialog.open, true);
  assert.equal(p.locked, true);
  p.video.dispatchEvent(new Event('ended'));
  p.advance(300);
  assert.equal(p.dialog.open, false);
  assert.equal(p.locked, false);
  assert.equal(p.video.paused, true);
  assert.equal(p.video.src, '');
  assert.equal(p.focused, true);
});

test('Skip and Escape dismiss playback and release the page', () => {
  for (const action of ['click','cancel']) {
    const p = page();
    p.video.dispatchEvent(new Event('playing'));
    (action === 'click' ? p.skip : p.dialog).dispatchEvent(new Event(action, {cancelable:true}));
    p.advance(300);
    assert.equal(p.dialog.open, false);
    assert.equal(p.locked, false);
    assert.equal(p.video.paused, true);
  }
});

test('autoplay rejection, startup delay and media error never trap a visitor', async () => {
  const blocked = page({blocked:true});
  await Promise.resolve();
  assert.equal(blocked.video.paused, true);
  assert.equal(blocked.dialog.open, false);
  const slow = page();
  slow.advance(8000);
  slow.video.dispatchEvent(new Event('playing'));
  assert.equal(slow.dialog.open, false);
  const broken = page();
  broken.video.dispatchEvent(new Event('playing'));
  broken.video.dispatchEvent(new Event('error'));
  broken.advance(300);
  assert.equal(broken.dialog.open, false);
  assert.equal(broken.locked, false);
});

test('normal CDN startup delay can finish loading while the homepage stays usable', () => {
  const p = page();
  p.advance(3000);
  assert.equal(p.dialog.open, false);
  assert.equal(p.locked, false);
  p.video.dispatchEvent(new Event('playing'));
  assert.equal(p.dialog.open, true);
  p.advance(5000);
  assert.equal(p.dialog.open, true);
  p.video.dispatchEvent(new Event('ended'));
  p.advance(300);
  assert.equal(p.locked, false);
});

test('a stalled or never-ending intro has a bounded exit', () => {
  for (const stall of [true,false]) {
    const p = page();
    p.video.dispatchEvent(new Event('playing'));
    if (stall) p.video.dispatchEvent(new Event('waiting'));
    p.advance(stall ? 2000 : 12000);
    p.advance(300);
    assert.equal(p.dialog.open, false);
    assert.equal(p.locked, false);
  }
});

test('using the homepage while video loads cancels a late intro; blocked storage still permits Skip', () => {
  const p = page();
  p.document.dispatchEvent(new Event('pointerdown'));
  p.video.dispatchEvent(new Event('playing'));
  assert.equal(p.dialog.open, false);
  const withoutStorage = page({unavailableStorage:true});
  withoutStorage.video.dispatchEvent(new Event('playing'));
  assert.equal(withoutStorage.dialog.open, true);
  withoutStorage.skip.dispatchEvent(new Event('click'));
  withoutStorage.advance(300);
  assert.equal(withoutStorage.locked, false);
});
