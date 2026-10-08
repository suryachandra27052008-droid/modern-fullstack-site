'use strict';
// Same-origin API only. Delivery destinations and credentials stay on the server.
(() => {
  const fields = ['name','business','industry','phone','email','interest','challenge','preferredContact','teamSize','timeSpent','tools','website'];
  async function send(endpoint, values, signal) {
    if (endpoint !== '/api/lead') throw new Error('Invalid enquiry endpoint.');
    const payload = Object.fromEntries(fields.map(key => [key, String(values[key] || '').trim()]));
    const response = await fetch(endpoint, {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify(payload), signal, credentials: 'omit', redirect: 'error',
      referrerPolicy: 'strict-origin-when-cross-origin'
    });
    if (response.status === 429) { const error = new Error('Too many requests. Please wait a few minutes or contact us on WhatsApp.'); error.code = 'RATE_LIMITED'; throw error; }
    let result;
    try { result = await response.json(); } catch { throw new Error('The enquiry service could not confirm submission.'); }
    if (!response.ok || result?.accepted !== true || result?.status !== 'accepted' || !/^lead_[a-f0-9]{32}$/.test(result?.id || '')) {
      const error = new Error(result?.code === 'RATE_LIMITED' || response.status === 429 ? 'Too many requests. Please wait a few minutes or contact us on WhatsApp.' : "Your enquiry couldn't be submitted right now. Please try again or contact us on WhatsApp.");
      error.code = result?.code; error.fields = result?.errors; throw error;
    }
    return result;
  }
  function fromAudit(values) {
    return {name:values.name || '', business:values.business || '', industry:values.industry || '',
      email:values.email || '', phone:values.phone || '', tools:values.tools || '', preferredContact:values.preferredContact || 'email',
      interest:values.interest === 'Free consultation' ? 'Free consultation' : 'Custom AI automation', challenge:[values.process, values.opportunity, values.summary].filter(Boolean).join('\n\n').slice(0,1800), website:values.website || ''};
  }
  window.AutixAIEnquiry = Object.freeze({send, fromAudit});
})();
