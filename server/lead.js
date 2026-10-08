import {createHmac} from 'node:crypto';
import {MemoryLeadStore, RedisLeadStore} from './lead-store.js';

const SITE = 'https://autixai-site.vercel.app';
const MAX_BYTES = 16384;
const limits = {name:80, email:120, phone:25, business:100, industry:100, interest:100, challenge:1800, preferredContact:20, teamSize:5, timeSpent:100, tools:200, website:200};
const required = ['name','email','business','industry','interest','challenge','preferredContact'];
const json = (status, body, headers = {}) => Response.json(body, {status, headers:{'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers}});
const errorResponse = (status, code, extra = {}) => json(status, {accepted:false, code, message:"Your enquiry couldn't be submitted right now. Please try again or contact us on WhatsApp.", ...extra});

export function validateLead(input) {
  const errors = {}, values = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {errors:{form:'Expected a JSON object.'}};
  for (const [key, max] of Object.entries(limits)) {
    const raw = input[key] ?? '';
    if (typeof raw !== 'string') { errors[key] = 'Enter text in this field.'; continue; }
    // Preserve useful punctuation and line breaks; reject control characters rather than rendering HTML.
    const value = raw.normalize('NFC').trim();
    if (value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) errors[key] = `Use at most ${max} characters without control characters.`;
    values[key] = value;
  }
  for (const key of required) if (!values[key]) errors[key] = 'Please complete this field.';
  if (values.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(values.email)) errors.email = 'Enter a valid email address.';
  if (values.email && /[\r\n]/.test(values.email)) errors.email = 'Enter a valid email address.';
  if (values.phone && (!/^[+\d() .-]{7,25}$/.test(values.phone) || values.phone.replace(/\D/g,'').length < 7)) errors.phone = 'Enter a valid phone number.';
  if (values.preferredContact && !['email','whatsapp','phone'].includes(values.preferredContact)) errors.preferredContact = 'Choose email, WhatsApp or phone.';
  if (['whatsapp','phone'].includes(values.preferredContact) && !values.phone) errors.phone = 'Add a phone number for this contact preference.';
  if (values.teamSize && (!/^\d+$/.test(values.teamSize) || Number(values.teamSize) < 1 || Number(values.teamSize) > 10000)) errors.teamSize = 'Enter a whole number from 1 to 10000.';
  values.email = values.email?.toLowerCase();
  return {errors, values};
}

async function readBody(request) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) throw new Error('size');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('json');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('size'); }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { reader.releaseLock(); }
}

function allowedOrigin(request, env) {
  const allowed = new Set([SITE]);
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) if (host && /^[a-zA-Z0-9.-]+\.vercel\.app$/.test(host)) allowed.add(`https://${host}`);
  if (!env.VERCEL && env.NODE_ENV !== 'production') for (const origin of ['http://127.0.0.1:4175','http://localhost:4175']) allowed.add(origin);
  return allowed.has(request.headers.get('origin')) && request.headers.get('sec-fetch-site') !== 'cross-site';
}

export class DeliveryError extends Error {
  constructor(code, uncertain = false, providerStatus) { super(code); this.uncertain = uncertain; this.providerStatus = providerStatus; }
}
function emailPayload(lead) {
  const escapeText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  return {...Object.fromEntries(Object.entries(lead.fields).map(([key,value]) => [key,escapeText(value)])), source:'AutixAI website', submittedAt:lead.createdAt, leadId:lead.id,
    followUp:'Review this enquiry and create a personal follow-up. No automatic customer acknowledgement was sent.',
    _subject:`New AutixAI enquiry — ${lead.fields.business.replace(/[\r\n]/g,' ').slice(0,80)}`,
    _replyto:lead.fields.email, _template:'table', _url:`${SITE}/#contact`, _honey:''};
}
export async function deliverLead(lead, env, fetcher = fetch) {
  const common = {method:'POST', redirect:'error', signal:AbortSignal.timeout(10000)};
  try {
    if (env.LEAD_PROVIDER === 'formsubmit') {
      const email = env.LEAD_NOTIFICATION_EMAIL;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DeliveryError('unconfigured');
      const payload = emailPayload(lead);
      // Preserve the documented email-route separator while escaping unsafe path characters.
      const recipientPath = encodeURIComponent(email).replace('%40','@');
      const response = await fetcher(`https://formsubmit.co/ajax/${recipientPath}`, {...common,
        headers:{'Content-Type':'application/json', Accept:'application/json', Origin:SITE, Referer:`${SITE}/`}, body:JSON.stringify(payload)});
      if (!response.ok) throw new DeliveryError('provider-http', response.status >= 500, response.status);
      let result;
      try { result = await response.json(); } catch { throw new DeliveryError('provider-receipt', true); }
      if (/activat|confirm.{0,30}email|email.{0,30}confirm/i.test(String(result?.message || ''))) throw new DeliveryError('activation-required');
      if (![true,'true'].includes(result?.success)) throw new DeliveryError('provider-rejected');
      return {delivery:'email-service', acknowledgementSent:false, followUpCreated:false};
    }
    if (env.LEAD_PROVIDER === 'webhook') {
      let url;
      try { url = new URL(env.LEAD_WEBHOOK_URL); } catch { throw new DeliveryError('unconfigured'); }
      if (url.protocol !== 'https:' || url.username || url.password || !env.LEAD_WEBHOOK_SECRET) throw new DeliveryError('unconfigured');
      const response = await fetcher(url.href, {...common, headers:{'Content-Type':'application/json', Accept:'application/json', Authorization:`Bearer ${env.LEAD_WEBHOOK_SECRET}`, 'Idempotency-Key':lead.id}, body:JSON.stringify(lead)});
      if (!response.ok) throw new DeliveryError('webhook-http', response.status >= 500, response.status);
      let receipt;
      try { receipt = await response.json(); } catch { throw new DeliveryError('webhook-receipt', true); }
      if (receipt?.status !== 'accepted' || receipt?.durable !== true || receipt?.id !== lead.id) throw new DeliveryError('webhook-receipt', true);
      return {delivery:'durable-webhook', acknowledgementSent:receipt.acknowledgementSent === true, followUpCreated:receipt.followUpCreated === true};
    }
    throw new DeliveryError('unconfigured');
  } catch (error) {
    if (error instanceof DeliveryError) throw error;
    // A lost response cannot tell us whether the provider committed the lead.
    throw new DeliveryError('provider-unavailable', true);
  }
}

export function createLeadHandler({env = process.env, fetcher = fetch, store:providedStore, deliver = deliverLead} = {}) {
  let store = providedStore;
  const getStore = () => {
    if (store) return store;
    if (env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_TOKEN) {
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) throw new Error('Incomplete Redis settings');
      store = new RedisLeadStore(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN, fetcher);
    } else store = new MemoryLeadStore(); // Best effort on one warm instance; see integration docs.
    return store;
  };
  return async request => {
    if (new URL(request.url).pathname !== '/api/lead') return errorResponse(404, 'NOT_FOUND');
    if (request.method !== 'POST') return json(405, {accepted:false,code:'METHOD_NOT_ALLOWED',error:'Use POST.'}, {Allow:'POST'});
    if (!allowedOrigin(request, env)) return errorResponse(403, 'ORIGIN_REJECTED');
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return errorResponse(415, 'JSON_REQUIRED');
    let input;
    try { input = await readBody(request); } catch (error) { return errorResponse(error.message === 'size' ? 413 : 400, 'INVALID_REQUEST'); }
    const {errors, values} = validateLead(input);
    if (values?.website || errors.website) return errorResponse(422, 'SPAM_REJECTED');
    if (Object.keys(errors).length) return errorResponse(422, 'VALIDATION_FAILED', {errors});
    if (!env.LEAD_HASH_SECRET || env.LEAD_HASH_SECRET.length < 32 || !['formsubmit','webhook'].includes(env.LEAD_PROVIDER)) return errorResponse(503, 'NOT_CONFIGURED');
    if (env.VERCEL_ENV === 'preview' && env.LEAD_PREVIEW_DELIVERY !== 'true') return errorResponse(503, 'PREVIEW_DISABLED');
    const digest = text => createHmac('sha256', env.LEAD_HASH_SECRET).update(text).digest('hex');
    const fields = Object.fromEntries(Object.keys(limits).filter(key => key !== 'website').map(key => [key, values[key]]));
    const key = digest(JSON.stringify(fields));
    const id = `lead_${key.slice(0,32)}`;
    let receipt, receipts;
    try {
      receipts = getStore();
      if (receipts.rateLimit) {
        const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        if (!await receipts.rateLimit(digest(ip))) return json(429, {accepted:false, code:'RATE_LIMITED', message:'Too many requests. Please wait a few minutes or contact us on WhatsApp.'}, {'Retry-After':'600'});
      } else if (env.LEAD_RATE_LIMIT_MODE !== 'vercel-waf' && env.NODE_ENV !== 'test' && !(!env.VERCEL && env.NODE_ENV !== 'production')) return errorResponse(503, 'RATE_LIMIT_NOT_CONFIGURED');
      receipt = await receipts.claim(key, id);
    } catch { return errorResponse(503, 'STORE_UNAVAILABLE'); }
    if (!receipt.claimed) {
      if (receipt.state === 'accepted') return json(200, {accepted:true, status:'accepted', id:receipt.id, duplicate:true});
      return errorResponse(409, receipt.state === 'unknown' ? 'DELIVERY_UNCERTAIN' : 'IN_PROGRESS');
    }
    const lead = {schemaVersion:1, event:'lead.created', id, createdAt:new Date().toISOString(), source:'autixai-website', fields};
    try {
      const result = await deliver(lead, env, fetcher);
      await receipts.settle(key, receipt.token, 'accepted');
      return json(201, {accepted:true, status:'accepted', id, ...result});
    } catch (error) {
      const uncertain = !(error instanceof DeliveryError) || error.uncertain;
      const knownCodes = new Set(['unconfigured','provider-http','provider-receipt','activation-required','provider-rejected','webhook-http','webhook-receipt','provider-unavailable']);
      // Only fixed operational codes and HTTP status; never log payloads, contact details or provider bodies.
      console.warn(JSON.stringify({event:'lead.delivery_failed', code:knownCodes.has(error.message) ? error.message : 'delivery-exception', uncertain, ...(Number.isInteger(error.providerStatus) ? {providerStatus:error.providerStatus} : {})}));
      if (env.LEAD_PROVIDER === 'formsubmit' && /^[a-f0-9]{32}$/.test(env.LEAD_PUBLIC_FORM_ID || '') && error instanceof DeliveryError && error.message === 'provider-http' && error.providerStatus === 403 && !uncertain) {
        // FormSubmit rejects this deployment's server egress. Delegate once to its public browser form.
        // The provider cannot prove that browser result back to us: retain an uncertain hold, never an accepted receipt.
        try { await receipts.settle(key, receipt.token, 'unknown'); } catch { return errorResponse(503,'STORE_UNAVAILABLE'); }
        return json(502, {accepted:false, code:'BROWSER_DELIVERY_REQUIRED', fallback:{id, url:`https://formsubmit.co/ajax/${env.LEAD_PUBLIC_FORM_ID}`, payload:emailPayload(lead)}});
      }
      try {
        if (uncertain) await receipts.settle(key, receipt.token, 'unknown');
        else await receipts.release(key, receipt.token);
      } catch { /* Retain the lock on uncertainty. Never log contact or provider response bodies. */ }
      return errorResponse(error.message === 'unconfigured' ? 503 : 502, uncertain ? 'DELIVERY_UNCERTAIN' : 'DELIVERY_FAILED');
    }
  };
}
