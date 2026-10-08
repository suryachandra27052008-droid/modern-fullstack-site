'use strict';
// Public form delivery only. No credentials, visitor storage or automatic retries.
(() => {
  const fields = ['name', 'business', 'industry', 'phone', 'email', 'interest', 'challenge', 'teamSize', 'timeSpent', 'tools'];
  function isFormSubmit(endpoint) {
    try { const url = new URL(endpoint); return url.protocol === 'https:' && url.hostname === 'formsubmit.co' && /^\/ajax\/[^/]+$/.test(url.pathname); }
    catch { return false; }
  }
  async function send(endpoint, values, signal) {
    if (values.website?.trim()) throw new Error('Unable to send this enquiry. Please contact us on WhatsApp.');
    const payload = Object.fromEntries(fields.map(key => [key, String(values[key] || '').trim()]));
    payload.source = 'AutixAI website';
    payload.submittedAt = new Date().toISOString();
    const formSubmit = isFormSubmit(endpoint);
    if (formSubmit) {
      payload._subject = `New AutixAI enquiry — ${payload.business.replace(/[\r\n]/g, ' ').slice(0, 80)}`;
      payload._template = 'table';
      payload._url = 'https://autixai-site.vercel.app/#contact';
      payload._honey = '';
      if (payload.email) payload._replyto = payload.email;
    }
    const response = await fetch(endpoint, {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify(payload), signal, credentials: 'omit', redirect: 'error',
      referrerPolicy: 'strict-origin-when-cross-origin'
    });
    if (!response.ok) throw new Error('The enquiry service could not accept this request.');
    if (formSubmit) {
      const result = await response.json();
      const message = String(result?.message || '');
      if (/activat|confirm.{0,30}email|email.{0,30}confirm/i.test(message)) return {status: 'activation-required'};
      if (result?.success !== true && result?.success !== 'true') throw new Error('The enquiry service could not confirm submission.');
    }
    return {status: 'accepted'};
  }
  window.AutixAIEnquiry = Object.freeze({send, isFormSubmit});
})();
