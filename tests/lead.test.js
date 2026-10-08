import test from 'node:test';
import assert from 'node:assert/strict';
import {createLeadHandler, validateLead, deliverLead, DeliveryError} from '../server/lead.js';
import {MemoryLeadStore, RedisLeadStore} from '../server/lead-store.js';

const values = {name:'Test Visitor',email:'test@example.com',business:'Example business',industry:'Retail',interest:'Free consultation',challenge:'Route stock updates to the team.',preferredContact:'email',website:''};
const env = {NODE_ENV:'test',LEAD_PROVIDER:'formsubmit',LEAD_NOTIFICATION_EMAIL:'owner@example.com',LEAD_HASH_SECRET:'test-secret-with-at-least-thirty-two-characters'};
const request = (body = values, options = {}) => new Request('https://autixai-site.vercel.app/api/lead', {
  method:'POST',headers:{Origin:'https://autixai-site.vercel.app','Content-Type':'application/json',...options.headers},
  body:typeof body === 'string' ? body : JSON.stringify(body), ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'headers'))
});
const accepted = async () => ({delivery:'email-service',acknowledgementSent:false,followUpCreated:false});

test('server requires all lead fields, validates preferences, bounds and controls, and minimizes data', () => {
  assert.deepEqual(validateLead(values).errors, {});
  for (const key of ['name','email','business','industry','interest','challenge','preferredContact']) assert.ok(validateLead({...values,[key]:''}).errors[key],key);
  for (const email of ['bad','x@y','a\nb@example.com','<a>@example.com']) assert.ok(validateLead({...values,email}).errors.email);
  assert.ok(validateLead({...values,preferredContact:'fax'}).errors.preferredContact);
  assert.ok(validateLead({...values,preferredContact:'whatsapp'}).errors.phone);
  assert.ok(validateLead({...values,phone:'letters'}).errors.phone);
  assert.ok(validateLead({...values,challenge:'x'.repeat(1801)}).errors.challenge);
  assert.ok(validateLead({...values,business:'a\u0000b'}).errors.business);
  assert.ok(validateLead({...values,teamSize:'1.5'}).errors.teamSize);
  assert.ok(validateLead({...values,email:{address:'x@example.com'}}).errors.email);
  assert.equal(validateLead({...values,transcript:'DO NOT INCLUDE'}).values.transcript,undefined);
});

test('API rejects foreign/missing origins, non-JSON, malformed and oversized bodies before delivery', async () => {
  let sends = 0;
  const handler = createLeadHandler({env,deliver:async () => {sends++; return accepted();}});
  assert.equal((await handler(new Request('https://autixai-site.vercel.app/api/lead'))).status,405);
  assert.equal((await handler(new Request('https://autixai-site.vercel.app/api/lead/',{method:'POST'}))).status,404);
  for (const origin of ['https://evil.example','null','']) assert.equal((await handler(request(values,{headers:{Origin:origin}}))).status,403);
  assert.equal((await handler(request(values,{headers:{'Content-Type':'text/plain'}}))).status,415);
  for (const body of ['{','[]','null']) assert.equal((await handler(request(body))).status,body === '{' ? 400 : 422);
  assert.equal((await handler(request('x'.repeat(17000)))).status,413);
  assert.equal((await handler(request(values,{headers:{'Content-Length':'17000'}}))).status,413);
  assert.equal(sends,0);
});

test('honeypot and invalid fields never reach the destination', async () => {
  let sends = 0;
  const handler = createLeadHandler({env,deliver:async () => {sends++; return accepted();}});
  assert.equal((await handler(request({...values,website:'spam'}))).status,422);
  const bad = await handler(request({...values,email:'invalid'}));
  assert.equal(bad.status,422); assert.ok((await bad.json()).errors.email); assert.equal(sends,0);
});

test('only successful delivery produces a receipt; repeated payloads do not notify again', async () => {
  let sends = 0; let delivered;
  const handler = createLeadHandler({env,deliver:async lead => {sends++; delivered = lead; return accepted();}});
  const first = await handler(request({...values,transcript:'private'}));
  assert.equal(first.status,201); assert.equal(first.headers.get('cache-control'),'no-store');
  const receipt = await first.json(); assert.equal(receipt.accepted,true); assert.equal(receipt.acknowledgementSent,false);
  assert.equal(delivered.fields.transcript,undefined); assert.equal(delivered.fields.website,undefined);
  const duplicate = await handler(request(values)); assert.equal(duplicate.status,200);
  assert.equal((await duplicate.json()).id,receipt.id); assert.equal(sends,1);
});

test('concurrent duplicates receive no false success while the first delivery is pending', async () => {
  let complete;
  const handler = createLeadHandler({env,deliver:() => new Promise(resolve => {complete = resolve;})});
  const first = handler(request());
  while (!complete) await new Promise(resolve => setImmediate(resolve));
  const duplicate = await handler(request()); assert.equal(duplicate.status,409); assert.equal((await duplicate.json()).code,'IN_PROGRESS');
  complete(await accepted()); assert.equal((await first).status,201);
});

test('known rejection permits explicit retry; timeout uncertainty prevents automatic repeat delivery', async () => {
  let sends = 0;
  const known = createLeadHandler({env,deliver:async () => {if (++sends === 1) throw new DeliveryError('provider-rejected'); return accepted();}});
  assert.equal((await known(request())).status,502); assert.equal((await known(request())).status,201); assert.equal(sends,2);
  sends = 0;
  const unknown = createLeadHandler({env,deliver:async () => {sends++; throw new DeliveryError('timeout',true);}});
  assert.equal((await unknown(request())).status,502);
  const retry = await unknown(request()); assert.equal(retry.status,409); assert.equal((await retry.json()).code,'DELIVERY_UNCERTAIN'); assert.equal(sends,1);
});

test('missing settings, disabled previews and failed shared store fail closed', async () => {
  for (const configuration of [{...env,LEAD_PROVIDER:''},{...env,LEAD_HASH_SECRET:''},{...env,VERCEL_ENV:'preview'},{...env,UPSTASH_REDIS_REST_URL:'https://redis.example',UPSTASH_REDIS_REST_TOKEN:''},{...env,NODE_ENV:'production',VERCEL:'1'}]) {
    const handler = createLeadHandler({env:configuration,deliver:async () => {throw new Error('Must not send');}});
    assert.equal((await handler(request())).status,503);
  }
  const broken = createLeadHandler({env,store:{claim:async () => {throw new Error('Down');}},deliver:accepted});
  assert.equal((await broken(request())).status,503);
});

test('shared rate limit returns 429 before delivery and does not expose raw contact data', async () => {
  let rateKey, sends = 0;
  const handler = createLeadHandler({env,store:{rateLimit:async key => {rateKey = key; return false;}},deliver:async () => {sends++;}});
  const response = await handler(request(values,{headers:{'x-vercel-forwarded-for':'203.0.113.1'}}));
  assert.equal(response.status,429); assert.equal(response.headers.get('retry-after'),'600'); assert.match(rateKey,/^[a-f0-9]{64}$/); assert.equal(sends,0);
});

test('FormSubmit validates its JSON receipt, uses fixed metadata and never claims customer acknowledgement', async () => {
  const lead = {id:'lead_test',createdAt:new Date().toISOString(),fields:values}; let sent;
  const receipt = await deliverLead(lead,env,async (url,options) => {sent = {url,options}; return Response.json({success:'true',message:'The form was submitted successfully.'});});
  assert.equal(receipt.acknowledgementSent,false); assert.equal(receipt.followUpCreated,false);
  assert.match(sent.url,/^https:\/\/formsubmit.co\/ajax\/owner@example.com$/);
  await deliverLead(lead,{...env,LEAD_NOTIFICATION_EMAIL:'owner+team#route@example.com'},async url => {
    assert.equal(new URL(url).hash,''); assert.equal(new URL(url).search,'');
    assert.match(url,/owner%2Bteam%23route@example.com$/); return Response.json({success:true});
  });
  assert.equal(sent.options.headers.Referer,'https://autixai-site.vercel.app/');
  const payload = JSON.parse(sent.options.body); assert.equal(payload._replyto,values.email); assert.equal(payload.leadId,lead.id); assert.ok(!payload._autoresponse);
  await deliverLead({...lead,fields:{...values,challenge:'<script>unsafe</script> & text'}},env,async (url,options) => {
    assert.equal(JSON.parse(options.body).challenge,'&lt;script&gt;unsafe&lt;/script&gt; &amp; text'); return Response.json({success:true});
  });
  for (const response of [Response.json({success:false}),Response.json({}),new Response('HTML'),Response.json({success:true,message:'Activate your form.'}),new Response('',{status:503})]) await assert.rejects(deliverLead(lead,env,async () => response));
});

test('automation webhooks require authentication and durable matching receipts', async () => {
  const lead = {schemaVersion:1,event:'lead.created',id:'lead_test',fields:values};
  const configuration = {...env,LEAD_PROVIDER:'webhook',LEAD_WEBHOOK_URL:'https://automation.example/webhook/lead',LEAD_WEBHOOK_SECRET:'private-test-secret'};
  const result = await deliverLead(lead,configuration,async (url,options) => {
    assert.equal(options.headers.Authorization,'Bearer private-test-secret'); assert.equal(options.headers['Idempotency-Key'],lead.id);
    return Response.json({status:'accepted',durable:true,id:lead.id,followUpCreated:true,acknowledgementSent:false});
  });
  assert.equal(result.followUpCreated,true);
  for (const receipt of [{},{status:'accepted',durable:false,id:lead.id},{status:'accepted',durable:true,id:'wrong'}]) await assert.rejects(deliverLead(lead,configuration,async () => Response.json(receipt)));
  await assert.rejects(deliverLead(lead,{...configuration,LEAD_WEBHOOK_SECRET:''}));
});

test('public email handoff is opt-in, follows validation, requires a definite 403 and retains an uncertain hold', async () => {
  const configuration={...env,LEAD_PUBLIC_FORM_ID:'b'.repeat(32)};
  const handler=createLeadHandler({env:configuration,fetcher:async()=>new Response('',{status:403})});
  assert.equal((await handler(request({...values,email:'invalid'}))).status,422);
  const response=await handler(request()); const body=await response.json();
  assert.equal(response.status,502); assert.equal(body.accepted,false); assert.equal(body.code,'BROWSER_DELIVERY_REQUIRED');
  assert.equal(body.fallback.url,'https://formsubmit.co/ajax/'+'b'.repeat(32)); assert.equal(body.fallback.payload.email,values.email);
  assert.equal(body.fallback.payload.transcript,undefined);
  assert.equal((await handler(request())).status,409);
  for (const [configuration,status] of [[env,403],[{...env,LEAD_PUBLIC_FORM_ID:'invalid'},403],[{...env,LEAD_PUBLIC_FORM_ID:'b'.repeat(32)},500]]) {
    const failed=await createLeadHandler({env:configuration,fetcher:async()=>new Response('',{status})})(request());
    assert.equal((await failed.json()).fallback,undefined);
  }
});

test('receipt cache expires and Redis operations are atomic, bounded and contain no enquiry text', async () => {
  let now = 1000; const memory = new MemoryLeadStore(() => now);
  const first = await memory.claim('hash','lead_test'); assert.equal(first.claimed,true);
  await assert.rejects(memory.settle('hash','wrong-token','accepted'));
  await memory.settle('hash',first.token,'accepted'); assert.equal((await memory.claim('hash','other')).state,'accepted');
  now += 86400001; assert.equal((await memory.claim('hash','new')).claimed,true);
  const commands = [];
  const redis = new RedisLeadStore('https://redis.example','test-token',async (url,options) => {
    assert.equal(options.headers.Authorization,'Bearer test-token'); const command = JSON.parse(options.body); commands.push(command);
    return Response.json({result:command[1].includes('return {1,ARGV[1]}') ? [1,command[4]] : 1});
  });
  const claim = await redis.claim('fingerprint','lead_test'); await redis.settle('fingerprint',claim.token,'accepted');
  assert.equal(await redis.rateLimit('hashed-ip'),true); await redis.release('fingerprint',claim.token);
  assert.equal(commands.length,4); assert.ok(commands.every(command => command[0] === 'EVAL'));
  assert.ok(!JSON.stringify(commands).includes(values.email));
});
