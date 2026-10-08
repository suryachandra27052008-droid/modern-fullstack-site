import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/enquiry-delivery.js',import.meta.url),'utf8');
const receipt = {accepted:true,status:'accepted',id:'lead_'+'a'.repeat(32)};
function delivery(fetch) { const window = {}; vm.runInNewContext(source,{window,fetch,URL,Date}); return window.AutixAIEnquiry; }

test('all pages load centralized booking and secure delivery before shared controllers', () => {
  for (const slug of ['','pricing/','trust/','privacy/','terms/','cookies/','refunds/','accessibility/']) {
    const html = readFileSync(new URL(`../dist/${slug}index.html`,import.meta.url),'utf8');
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)].map(match => match[1].split('?')[0].replace(/^\//,''));
    for (const asset of ['booking.js','enquiry-delivery.js']) { assert.equal(scripts.filter(value => value === asset).length,1); assert.ok(scripts.indexOf(asset)<scripts.indexOf('common.js')); }
    assert.match(html,/data-booking-link/); assert.match(html,/Request a Free Consultation/);
  }
  const home = readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(home,/name="email"[^>]+required/); assert.match(home,/name="preferredContact"/);
  assert.match(home,/data-channel="email"/); assert.match(home,/data-channel="whatsapp"/);
});

test('browser sends allowlisted fields to the same-origin API without provider settings or chat', async () => {
  let request;
  const api = delivery(async (...args) => {request=args; return {ok:true,json:async () => receipt};});
  assert.equal((await api.send('/api/lead',{name:' Alex ',email:'alex@example.com',transcript:'PRIVATE',_cc:'unwanted@example.com',website:'bot'})).status,'accepted');
  assert.equal(request[0],'/api/lead'); assert.equal(request[1].credentials,'omit');
  const body = JSON.parse(request[1].body); assert.equal(body.name,'Alex'); assert.equal(body.transcript,undefined); assert.equal(body._cc,undefined);
  assert.equal(body.website,'bot'); // Server, not client, decides spam rejection.
  await assert.rejects(api.send('https://attacker.example/',{}));
});

test('the browser requires an explicit backend receipt and preserves server errors without auto retries', async () => {
  for (const response of [{ok:false,json:async () => receipt},{ok:true,json:async () => ({})},{ok:true,json:async () => ({...receipt,id:'wrong'})},{ok:true,json:async () => {throw new Error('HTML');}}]) await assert.rejects(delivery(async () => response).send('/api/lead',{}));
  let attempts=0;
  const api=delivery(async () => {attempts++; return {ok:false,status:422,json:async () => ({code:'VALIDATION_FAILED',errors:{email:'Enter an email'}})};});
  await assert.rejects(api.send('/api/lead',{}),error => error.fields.email === 'Enter an email'); assert.equal(attempts,1);
});

test('assistant handoff includes editable reviewed context and never the full transcript', () => {
  const result=delivery().fromAudit({name:'Alex',email:'alex@example.com',industry:'Retail',process:'Stock updates',tools:'Sheets',summary:'Flag low stock',transcript:'PRIVATE',interest:'Free consultation'});
  assert.equal(result.interest,'Free consultation'); assert.equal(result.preferredContact,'email'); assert.equal(result.challenge,'Stock updates\n\nFlag low stock'); assert.equal(result.transcript,undefined);
});

test('email compatibility handoff requires a definite backend instruction and actual provider acceptance', async () => {
  const fallback = {id:receipt.id,url:'https://formsubmit.co/ajax/'+'b'.repeat(32),payload:{name:'Reviewed visitor',leadId:receipt.id}};
  const instruction = {accepted:false,code:'BROWSER_DELIVERY_REQUIRED',fallback};
  let calls=[];
  const api=delivery(async (url,options) => {calls.push({url,options}); return calls.length===1 ? {ok:false,status:502,json:async()=>instruction} : {ok:true,json:async()=>({success:true})};});
  assert.equal((await api.send('/api/lead',{})).delivery,'browser-email-service');
  assert.equal(calls.length,2); assert.equal(calls[1].url,fallback.url); assert.equal(calls[1].options.credentials,'omit');
  for (const url of ['https://attacker.example/ajax/'+'b'.repeat(32),fallback.url+'?redirect=1',fallback.url+'/']) {
    let attempts=0;
    await assert.rejects(delivery(async()=>{attempts++;return {ok:false,status:502,json:async()=>({...instruction,fallback:{...fallback,url}})};}).send('/api/lead',{}));
    assert.equal(attempts,1);
  }
  for (const provider of [{success:false},{success:true,message:'Activate your form.'},{}]) {
    let attempts=0;
    await assert.rejects(delivery(async()=>++attempts===1 ? {ok:false,status:502,json:async()=>instruction} : {ok:true,json:async()=>provider}).send('/api/lead',{}));
    assert.equal(attempts,2);
  }
});

test('booking uses a verified real event URL and falls back for absent or unsafe settings', () => {
  const window={}; vm.runInNewContext(readFileSync(new URL('../dist/booking.js',import.meta.url),'utf8'),{window,URL});
  const resolve=window.AutixAIBooking.resolve;
  for (const url of ['', 'javascript:alert(1)','http://cal.com/team/call','https://cal.com/user','https://cal.com.attacker.test/user/call','https://name:password@cal.com/user/call']) assert.equal(resolve({calendarUrl:url,calendarVerified:true}),'');
  assert.equal(resolve({calendarUrl:'https://cal.com/user/call',calendarVerified:false}),'');
  assert.equal(resolve({calendarUrl:'https://cal.com/user/call',calendarVerified:true}),'https://cal.com/user/call');
});
