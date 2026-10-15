import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../dist/overview.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
function page({reduced = false, saveData = false, blocked = false, observer = true} = {}) {
  let played = 0, observe;
  const attributes = new Set();
  const video = new EventTarget();
  Object.assign(video, {paused:true, ended:false, controls:true});
  video.play = () => {
    played++;
    if (blocked) return Promise.reject(new Error('NotAllowedError'));
    video.paused = false;
    video.dispatchEvent(new Event('play'));
    return Promise.resolve();
  };
  video.pause = () => {
    if (video.paused) return;
    video.paused = true;
    video.dispatchEvent(new Event('pause'));
  };
  const hint = {}, status = {};
  const document = new EventTarget();
  document.hidden = false;
  document.documentElement = {hasAttribute:name => attributes.has(name)};
  document.getElementById = id => ({'demo-video':video,'film-playback-hint':hint,'film-status':status})[id];
  const window = new EventTarget(), media = new EventTarget();
  media.matches = reduced;
  class IntersectionObserver {
    constructor(callback) { observe = ratio => callback([{isIntersecting:ratio>0,intersectionRatio:ratio}]); }
    observe() {}
    disconnect() {}
  }
  if (observer) window.IntersectionObserver = IntersectionObserver;
  runInNewContext(source, {document,window,navigator:{connection:{saveData}},matchMedia:()=>media,IntersectionObserver});
  return {video,hint,status,document,media,window,attributes,enter:()=>observe(0.8),leave:()=>observe(0),get played(){return played;}};
}

test('overview starts muted only in view, pauses offscreen and resumes on return', async () => {
  const p = page();
  assert.equal(p.played,0);
  assert.equal(p.video.muted,true);
  p.enter(); await settle();
  assert.equal(p.video.paused,false);
  p.leave(); assert.equal(p.video.paused,true);
  p.enter(); await settle();
  assert.equal(p.played,2);
});

test('an explicit pause or completed video is not overridden by scrolling', async () => {
  const p = page();
  p.enter(); await settle();
  p.video.pause(); p.leave(); p.enter(); await settle();
  assert.equal(p.played,1);
  assert.equal(p.video.paused,true);
  await p.video.play();
  p.video.ended = true; p.video.pause();
  p.leave(); p.enter(); await settle();
  assert.equal(p.played,2);
});

test('reduced motion, data saving and the page motion setting prevent autoplay while manual playback remains available', async () => {
  for (const settings of [{reduced:true},{saveData:true},{}]) {
    const p = page(settings);
    if (!settings.reduced && !settings.saveData) p.attributes.add('data-motion-paused');
    p.enter(); await settle();
    assert.equal(p.played,0);
    await p.video.play(); p.enter(); await settle();
    assert.equal(p.video.paused,false);
    p.leave(); assert.equal(p.video.paused,true);
  }
});

test('backgrounding or enabling reduced motion stops automatic playback', async () => {
  const p = page();
  p.enter(); await settle();
  p.document.hidden = true; p.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(p.video.paused,true);
  p.document.hidden = false; p.document.dispatchEvent(new Event('visibilitychange')); await settle();
  assert.equal(p.video.paused,false);
  p.media.matches = true; p.media.dispatchEvent(new Event('change'));
  assert.equal(p.video.paused,true);
});

test('blocked autoplay or a missing observer leaves visible native playback controls and an actionable hint', async () => {
  const p = page({blocked:true});
  p.enter(); await settle(); p.enter(); await settle();
  assert.equal(p.played,1);
  assert.equal(p.video.controls,true);
  assert.match(p.hint.textContent,/Use the video controls/);
  const fallback = page({observer:false});
  assert.equal(fallback.played,0);
  assert.equal(fallback.video.controls,true);
  assert.match(fallback.hint.textContent,/Use the video controls/);
});
