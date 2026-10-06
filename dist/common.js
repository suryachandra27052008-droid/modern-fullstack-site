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
  if (settings.webhookUrl) {
    document.querySelectorAll('[data-inquiry-privacy]').forEach(text => { text.textContent = 'Submitting sends these details to AutixAI’s connected inquiry service to follow up on your request. You can also review and send the WhatsApp draft.'; });
    document.querySelectorAll('[data-trust-inquiry-privacy]').forEach(text => { text.textContent = 'When you submit, the website sends your contact details and business notes to our connected inquiry service. We use them to follow up on your request. The page reports whether receipt was confirmed; you can also send the draft on WhatsApp or call. The website does not save form details in browser storage.'; });
  }
})();
