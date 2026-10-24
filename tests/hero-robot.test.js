import test from 'node:test';
import assert from 'node:assert/strict';
import {mountHeroRobot} from '../dist/hero-robot.js';
import {createCompanion} from '../dist/robot/companion.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const attributes = new Set();
  return {scope:new EventTarget(),host:{innerHTML:'Static companion illustration'},root:{hasAttribute:key=>attributes.has(key)},attributes};
}

test('a covered logo intro defers loading the robot and repeated reveal events do not mount twice', async () => {
  const context = setup(); let loads = 0, mounts = 0, cleanups = 0;
  context.attributes.add('data-intro-open');
  const dispose = mountHeroRobot(context.host,{...context,load:async () => {
    loads++;
    return {createCompanion:() => { mounts++; return () => cleanups++; }};
  }});
  await flush(); assert.equal(loads,0);
  context.attributes.delete('data-intro-open');
  context.scope.dispatchEvent(new Event('autixai:introchange'));
  await flush(); assert.equal(loads,1); assert.equal(mounts,1);
  context.scope.dispatchEvent(new Event('autixai:introchange'));
  await flush(); assert.equal(mounts,1);
  dispose(); assert.equal(cleanups,1);
});

test('leaving while the bundle loads cannot create a hidden GPU renderer; back navigation can remount', async () => {
  const context = setup(); let finishLoad, mounts = 0, cleanups = 0;
  const module = {createCompanion:() => { mounts++; return () => cleanups++; }};
  const dispose = mountHeroRobot(context.host,{...context,load:() => new Promise(resolve => {finishLoad=resolve;})});
  const abandoned = finishLoad;
  context.scope.dispatchEvent(new Event('pagehide'));
  abandoned(module); await flush(); assert.equal(mounts,0);
  context.scope.dispatchEvent(new Event('pageshow'));
  finishLoad(module); await flush(); assert.equal(mounts,1);
  context.scope.dispatchEvent(new Event('pagehide')); assert.equal(cleanups,1);
  dispose(); assert.equal(cleanups,1);
});

test('the robot waits for a loading intro too, and recovers when startup ends without opening the cover', async () => {
  const context = setup(), intro = new EventTarget(); let hasSource = true, mounts = 0;
  intro.hasAttribute = () => hasSource;
  const dispose = mountHeroRobot(context.host,{...context,intro,load:async () => ({createCompanion:() => { mounts++; return () => {}; }})});
  await flush(); assert.equal(mounts,0);
  hasSource = false;
  intro.dispatchEvent(new Event('emptied'));
  await flush(); assert.equal(mounts,1);
  dispose();
});

test('an unavailable bundle leaves the static robot visible and never blocks the rest of the page', async () => {
  const context = setup();
  const dispose = mountHeroRobot(context.host,{...context,load:async () => {throw new Error('Offline');}});
  await flush(); assert.equal(context.host.innerHTML,'Static companion illustration');
  dispose();
});

test('missing or blocked WebGL2 keeps the authored illustration accessible and disables the inactive canvas', () => {
  const previous = globalThis.matchMedia;
  globalThis.matchMedia = () => ({matches:false});
  try {
    for (const blocked of [false,true]) {
      const attributes = new Map();
      const stage = {dataset:{state:'loading',ready:'true'},setAttribute:(key,value)=>attributes.set(key,value)};
      const canvas = {tabIndex:0,getContext:() => {if (blocked) throw new Error('GPU blocked'); return null;}};
      const button = {disabled:false}, status = {}, instructions = {};
      const elements = {'.robot-stage':stage,canvas,'.hello-button':button,'.robot-status':status,'.robot-instructions > span':instructions};
      const host = {innerHTML:'',querySelector:key=>elements[key],replaceChildren:() => {host.innerHTML='';}};
      const cleanup = createCompanion(host);
      assert.equal(stage.dataset.state,'unavailable');
      assert.equal(stage.dataset.ready,undefined);
      assert.equal(attributes.get('aria-busy'),'false');
      assert.equal(button.disabled,true); assert.equal(canvas.tabIndex,-1);
      assert.match(host.innerHTML,/class="robot-fallback"/);
      assert.match(instructions.textContent,/Interactive 3D is unavailable/);
      assert.doesNotThrow(cleanup);
    }
  } finally {
    if (previous === undefined) delete globalThis.matchMedia;
    else globalThis.matchMedia = previous;
  }
});
