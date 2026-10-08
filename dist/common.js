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
  const webhook = httpsUrl(settings.webhookUrl) || (['localhost','127.0.0.1'].includes(location.hostname) && /^http:\/\/(localhost|127\.0\.0\.1):[0-9]+\//.test(settings.webhookUrl || '') ? settings.webhookUrl : '');
  window.AutixAIEndpoints = Object.freeze({webhook});
  const calendar = httpsUrl(settings.calendarUrl);
  if (calendar) document.querySelectorAll('[data-calendar-link]').forEach(link => { link.href = calendar; link.hidden = false; });
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
    const service = new URL(webhook).hostname === 'formsubmit.co' ? 'FormSubmit for email delivery to AutixAI' : 'AutixAI’s connected enquiry service';
    document.querySelectorAll('[data-inquiry-privacy]').forEach(text => { text.textContent = `Send enquiry shares these details with ${service}. The WhatsApp option prepares a draft here; opening WhatsApp shares it with WhatsApp, where you tap Send.`; });
    document.querySelectorAll('[data-trust-inquiry-privacy]').forEach(text => { text.textContent = `Choosing Send enquiry submits your contact and process details to ${service} so we can respond. A confirmation means the service accepted the submission, not that an email reached the inbox. Preparing a WhatsApp draft does not send it. The website does not save form details in browser storage.`; });
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
      if (link.id === 'send-inquiry') window.AutixAIEvents.track('contact_form_complete');
    }
  });
  document.querySelectorAll('[data-service]').forEach(row => row.querySelector('summary')?.addEventListener('click', () => window.AutixAIEvents.track('service_card_click')));
})();
