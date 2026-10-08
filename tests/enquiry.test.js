import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/enquiry-delivery.js', import.meta.url), 'utf8');
const endpoint = 'https://formsubmit.co/ajax/owner@example.com';
const enquiry = {name:' Alex ', business:' Example business ', industry:'Retail', email:'alex@example.com', challenge:'Route enquiries', website:''};

test('the enquiry page loads delivery before its form controller and exposes both channels', () => {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)].map(match => match[1].split('?')[0].replace(/^\//, ''));
  assert.equal(scripts.filter(src => src === 'enquiry-delivery.js').length, 1);
  assert.ok(scripts.indexOf('enquiry-delivery.js') < scripts.indexOf('app.js'));
  assert.match(html, /data-channel="email"/); assert.match(html, /data-channel="whatsapp"/);
});
function delivery(fetch) {
  const window = {};
  vm.runInNewContext(source, {window, fetch, URL, Date});
  return window.AutixAIEnquiry;
}

test('email delivery sends only enquiry fields and provider settings, without browser credentials', async () => {
  const requests = [];
  const api = delivery(async (...request) => {requests.push(request); return {ok:true, json:async () => ({success:'true'})};});
  const signal = new AbortController().signal;
  assert.equal((await api.send(endpoint, {...enquiry, transcript:'PRIVATE CHAT', _cc:'unwanted@example.com'}, signal)).status, 'accepted');
  assert.equal(requests.length, 1);
  const [url, options] = requests[0];
  assert.equal(url, endpoint); assert.equal(options.credentials, 'omit'); assert.equal(options.signal, signal);
  const body = JSON.parse(options.body);
  assert.equal(body.name, 'Alex'); assert.equal(body._replyto, 'alex@example.com');
  assert.equal(body.business, 'Example business'); assert.equal(body._template, 'table');
  assert.equal(body._cc, undefined); assert.equal(body.transcript, undefined); assert.equal(body.website, undefined);
  assert.equal(body._url, 'https://autixai-site.vercel.app/#contact');
});

test('HTTP 200 alone is not a successful FormSubmit receipt', async () => {
  for (const response of [
    {ok:false, json:async () => ({success:true})},
    {ok:true, json:async () => ({success:false})},
    {ok:true, json:async () => ({})},
    {ok:true, json:async () => {throw new Error('HTML response');}}
  ]) await assert.rejects(delivery(async () => response).send(endpoint, enquiry));
});

test('activation responses are distinct from acceptance and honeypot attempts send nothing', async () => {
  let requests = 0;
  const api = delivery(async () => {requests++; return {ok:true, json:async () => ({success:true,message:'Please activate your form by confirming your email.'})};});
  assert.equal((await api.send(endpoint, enquiry)).status, 'activation-required');
  await assert.rejects(api.send(endpoint, {...enquiry, website:'spam'}));
  assert.equal(requests, 1);
});

test('network failures are surfaced without automatic retries', async () => {
  let requests = 0;
  const api = delivery(async () => {requests++; throw new Error('Network unavailable');});
  await assert.rejects(api.send(endpoint, enquiry));
  assert.equal(requests, 1);
  assert.equal(api.isFormSubmit('https://formsubmit.co.attacker.test/ajax/owner@example.com'), false);
  assert.equal(api.isFormSubmit('http://formsubmit.co/ajax/owner@example.com'), false);
});
