import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { CONSENT_VERSION, CONSENT_LIFETIME, readConsent, makeConsent, allowsAnalytics, validatePrivacyRequest, buildPrivacyDraft, PRIVACY_REQUEST_TYPES } from '../dist/privacy-core.js';

test('optional analytics requires a current explicit allow and an enabled integration', () => {
  const now = 1800000000000;
  const allowed = makeConsent(true, now);
  assert.equal(allowsAnalytics(true, null, now), false);
  assert.equal(allowsAnalytics(false, allowed, now), false);
  assert.equal(allowsAnalytics(true, makeConsent(false, now), now), false);
  assert.equal(allowsAnalytics(true, allowed, now), true);
  assert.equal(allowsAnalytics(true, allowed, now + CONSENT_LIFETIME), false);
});

test('malformed, old-version, expired and future consent default to blocked', () => {
  const now = 1800000000000;
  for (const raw of [null, 'broken', '{}', 'true', JSON.stringify({ version: CONSENT_VERSION, analytics:'yes', savedAt:now }), JSON.stringify({ ...makeConsent(true, now), version:'old' }), JSON.stringify(makeConsent(true, now + 1)), JSON.stringify(makeConsent(true, now - CONSENT_LIFETIME))]) assert.equal(readConsent(raw, now), null);
  assert.deepEqual(readConsent(JSON.stringify(makeConsent(false, now)), now), makeConsent(false, now));
});

test('event hook blocks before consent and after withdrawal; only fixed event names pass', () => {
  const received = [];
  let allowed = false;
  const window = { AUTIXAI_CONFIG: { analyticsEnabled:true }, AutixAIPrivacy: { allowsAnalytics:() => allowed }, AUTIXAI_ANALYTICS_HANDLER:(...args) => received.push(args) };
  const document = { querySelector:() => null, getElementById:() => null, querySelectorAll:() => [], addEventListener:() => {} };
  vm.runInNewContext(readFileSync(new URL('../dist/common.js', import.meta.url), 'utf8'), { window, document, URL, location:{hostname:'localhost'} });
  window.AutixAIEvents.track('hero_cta'); assert.equal(received.length, 0);
  allowed = true;
  window.AutixAIEvents.track('visitor@example.com'); assert.equal(received.length, 0);
  window.AutixAIEvents.track('hero_cta', {email:'private@example.com'}); assert.deepEqual(received, [['hero_cta']]);
  allowed = false;
  window.AutixAIEvents.track('hero_cta'); assert.equal(received.length, 1);
});

test('privacy requests require a valid contact and known type with bounded optional context', () => {
  for (const kind of PRIVACY_REQUEST_TYPES) {
    assert.deepEqual(validatePrivacyRequest({kind, contact:'qa@example.com'}), {});
    assert.deepEqual(validatePrivacyRequest({kind, contact:'+91 90000 00000'}), {});
  }
  assert.ok(validatePrivacyRequest({kind:'Delete my information',contact:''}).contact);
  assert.ok(validatePrivacyRequest({kind:'Delete my information',contact:'not a contact'}).contact);
  assert.ok(validatePrivacyRequest({kind:'anything else',contact:'qa@example.com'}).kind);
  assert.ok(validatePrivacyRequest({kind:'Privacy question',contact:'qa@example.com',details:'a'.repeat(601)}).details);
});

test('privacy drafts share only reviewed fields and round-trip exactly to WhatsApp', () => {
  const values = {kind:'Delete my information',contact:' qa@example.com ',details:'An October enquiry.',transcript:'PRIVATE CHAT',companyRecords:'PRIVATE RECORDS'};
  const draft = buildPrivacyDraft(values);
  assert.equal(draft, 'Hi AutixAI,\nRequest: Delete my information\nContact used for my enquiry: qa@example.com\n\nAn October enquiry.');
  const url = new URL(`https://wa.me/919617310042?text=${encodeURIComponent(draft)}`);
  assert.equal(url.searchParams.get('text'), draft);
});

test('all eight pages expose working privacy and policy entry points without third-party scripts', () => {
  for (const slug of ['','pricing/','trust/','privacy/','terms/','cookies/','refunds/','accessibility/']) {
    const html = readFileSync(new URL(`../dist/${slug}index.html`, import.meta.url), 'utf8');
    assert.equal((html.match(/src="\/privacy-tools.js/g) || []).length, 1, slug);
    assert.match(html, /data-privacy-settings/);
    assert.match(html, /href="\/refunds\/"/); assert.match(html, /href="\/cookies\/"/); assert.match(html, /href="\/accessibility\/"/);
    assert.ok(!/<script[^>]+src="https?:/i.test(html));
    assert.ok(!/<iframe/i.test(html));
    for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /\balt="/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Unique IDs: ${slug}`);
  }
  for (const license of ['DM-Sans-OFL.txt', 'Cinzel-OFL.txt', 'Caviar-Dreams-attribution.txt']) assert.ok(existsSync(new URL(`../dist/fonts/${license}`, import.meta.url)));
});
