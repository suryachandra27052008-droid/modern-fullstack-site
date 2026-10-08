'use strict';
(() => {
  function resolve(settings = {}) {
    try {
      const url = new URL(settings.calendarUrl);
      if (settings.calendarVerified !== true || url.protocol !== 'https:' || url.username || url.password || url.port || !['cal.com','calendly.com'].includes(url.hostname) || url.pathname.split('/').filter(Boolean).length < 2) return '';
      return url.href;
    } catch { return ''; }
  }
  function configure(root = document) {
    const url = resolve(window.AUTIXAI_CONFIG);
    root.querySelectorAll('[data-booking-link]').forEach(link => {
      link.href = url || (location.pathname === '/' ? '#contact' : '/?intent=consultation#contact');
      link.dataset.bookingState = url ? 'book' : 'request';
      const label = link.querySelector('[data-booking-label]') || link;
      label.textContent = url ? 'Book a Free Consultation' : 'Request a Free Consultation';
      if (url) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      else { link.removeAttribute('target'); link.removeAttribute('rel'); }
    });
    root.querySelectorAll('[data-calendar-link]').forEach(link => {
      link.hidden = !url;
      if (url) { link.href = url; link.textContent = 'Book a Free Consultation'; }
      else link.removeAttribute('href');
    });
  }
  window.AutixAIBooking = Object.freeze({resolve, configure});
})();
