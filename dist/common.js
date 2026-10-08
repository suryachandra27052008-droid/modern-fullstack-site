'use strict';
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  const close = () => {
    nav.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      nav.hidden = open;
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !nav.hidden) { close(); toggle.focus(); }
    });
  }
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  const settings = window.AUTIXAI_CONFIG || {};
  const httpsUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
  const webhook = settings.leadEndpoint === '/api/lead' ? '/api/lead' : '';
  window.AutixAIEndpoints = Object.freeze({webhook});
  window.AutixAIBooking?.configure();
  const linkedin = httpsUrl(settings.linkedinUrl);
  const founderLink = document.getElementById('founder-linkedin');
  if (founderLink && linkedin) { founderLink.href = linkedin; founderLink.hidden = false; }
  const byline = document.getElementById('founder-byline');
  if (byline && settings.founderName) { byline.textContent = `${settings.founderName} · Founder, AutixAI`; byline.hidden = false; }
  const highlight = document.getElementById('build-highlight');
  if (highlight && settings.caseStudy?.title && settings.caseStudy?.result) {
    const label = document.createElement('span'); label.textContent = 'RECENT BUILD';
    highlight.replaceChildren(label,document.createTextNode(`${settings.caseStudy.title} — ${settings.caseStudy.result}`));
  }
  document.querySelectorAll('[data-social-link]').forEach(link => { if (linkedin) { link.href = linkedin; link.hidden = false; } });
  if (webhook) {
    document.querySelectorAll('[data-inquiry-privacy]').forEach(text => { text.textContent = 'Submit Enquiry sends these details to AutixAI’s secure endpoint for validation and FormSubmit email delivery to our team. Chat on WhatsApp opens a draft there; tap Send in WhatsApp to finish.'; });
    document.querySelectorAll('[data-trust-inquiry-privacy]').forEach(text => { text.textContent = 'Submit Enquiry passes your details through our server for validation and email delivery through FormSubmit. Confirmation requires acceptance by the delivery service; it does not guarantee inbox arrival or a booked appointment. WhatsApp opens a draft that you send yourself. No form details are saved in browser storage.'; });
  }
})();

// Optional, consent-aware integration point. Inactive by default; no identifiers or form values.
(() => {
  const allowed = new Set(['hero_cta','automation_audit_click','whatsapp_click','contact_form_start','audit_request_prepared','contact_form_complete','calculator_usage','service_card_click','pricing_enquiry','assistant_opened','assistant_message_sent','assistant_quick_action_clicked','assistant_audit_requested','assistant_whatsapp_handoff','assistant_error']);
  window.AutixAIEvents = Object.freeze({ track(name) {
    const config = window.AUTIXAI_CONFIG || {};
    if (!allowed.has(name) || !config.analyticsEnabled || !window.AutixAIPrivacy?.allowsAnalytics() || typeof window.AUTIXAI_ANALYTICS_HANDLER !== 'function') return;
    try { window.AUTIXAI_ANALYTICS_HANDLER(name); } catch { /* Analytics must never interrupt visitor actions. */ }
  }});
  document.addEventListener('click', event => {
    const link = event.target.closest('a,button'); if (!link) return;
    if (link.dataset.track) window.AutixAIEvents.track(link.dataset.track);
    if (link.dataset.intent === 'audit') window.AutixAIEvents.track('automation_audit_click');
    if (link.tagName === 'A' && link.href.startsWith('https://wa.me/')) {
      window.AutixAIEvents.track('whatsapp_click');
    }
  });
  document.querySelectorAll('[data-service]').forEach(row => row.querySelector('summary')?.addEventListener('click', () => window.AutixAIEvents.track('service_card_click')));
})();
