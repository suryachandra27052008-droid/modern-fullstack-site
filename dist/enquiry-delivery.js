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
    if (response.status === 502 && result?.accepted === false && result?.code === 'BROWSER_DELIVERY_REQUIRED') {
      const fallback = result.fallback;
      if (!/^https:\/\/formsubmit\.co\/ajax\/[a-f0-9]{32}$/.test(fallback?.url || '') || !/^lead_[a-f0-9]{32}$/.test(fallback?.id || '') || !fallback.payload || typeof fallback.payload !== 'object' || Array.isArray(fallback.payload)) throw new Error('The email service could not confirm submission.');
      // One compatibility send, only after validation and a definite server-side 403. No retries after uncertainty.
      const emailResponse = await fetch(fallback.url, {method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(fallback.payload),signal,credentials:'omit',redirect:'error',referrerPolicy:'strict-origin-when-cross-origin'});
      let receipt;
      try { receipt = await emailResponse.json(); } catch { throw new Error('The email service could not confirm submission. Please contact us on WhatsApp before retrying.'); }
      if (!emailResponse.ok || ![true,'true'].includes(receipt?.success) || /activat|confirm.{0,30}email|email.{0,30}confirm/i.test(String(receipt?.message || ''))) throw new Error('The email service could not confirm submission. Please contact us on WhatsApp before retrying.');
      return {accepted:true,status:'accepted',id:fallback.id,delivery:'browser-email-service',acknowledgementSent:false,followUpCreated:false};
    }
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
