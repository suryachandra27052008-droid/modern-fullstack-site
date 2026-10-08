'use strict';
// Public website settings. Never put API keys, tokens, or secrets in this file.
// Private webhook URLs and email-provider configuration belong in server environment variables.
window.AUTIXAI_CONFIG = Object.freeze({
  analyticsEnabled: false, // Built-in consent gate defaults to blocked. Audit the provider and update notices before enabling.
  leadEndpoint: '/api/lead',
  calendarUrl: '', // A real Cal.com or Calendly event URL, after calendar/availability setup.
  calendarVerified: false, // Set true only after completing a real provider booking test.
  founderName: '',
  linkedinUrl: '',
  caseStudy: null // Use verified project details only: { title: '', result: '' }
});
