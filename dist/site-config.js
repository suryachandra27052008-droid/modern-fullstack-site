'use strict';
// Public website settings. Never put API keys, tokens, or secrets in this file.
// The webhook must accept browser POST requests with JSON and allow this site's origin.
window.AUTIXAI_CONFIG = Object.freeze({
  analyticsEnabled: false, // Built-in consent gate defaults to blocked. Audit the provider and update notices before enabling.
  webhookUrl: 'https://formsubmit.co/ajax/suryachandra27052008@gmail.com', // Public form endpoint; owner must confirm FormSubmit's activation email.
  calendarUrl: '', // e.g. https://cal.com/your-name/discovery
  founderName: '',
  linkedinUrl: '',
  caseStudy: null // Use verified project details only: { title: '', result: '' }
});
