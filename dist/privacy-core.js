// Pure validation shared by the privacy UI and its behavioural checks.
export const CONSENT_VERSION = '2026-10-08';
export const CONSENT_KEY = 'autixai-privacy-choice';
export const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;

export function readConsent(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== CONSENT_VERSION || typeof value.analytics !== 'boolean' || !Number.isFinite(value.savedAt)) return null;
    if (value.savedAt > now || now - value.savedAt >= CONSENT_LIFETIME) return null;
    return { version: CONSENT_VERSION, analytics: value.analytics, savedAt: value.savedAt };
  } catch { return null; }
}

export function makeConsent(analytics, now = Date.now()) {
  return { version: CONSENT_VERSION, analytics: analytics === true, savedAt: now };
}

export function allowsAnalytics(enabled, choice, now = Date.now()) {
  return enabled === true && readConsent(JSON.stringify(choice), now)?.analytics === true;
}

export const PRIVACY_REQUEST_TYPES = Object.freeze(['Delete my information', 'Access my information', 'Correct my information', 'Stop promotional contact', 'Privacy question', 'Accessibility help']);
export function validatePrivacyRequest(values) {
  const errors = {};
  const contact = String(values.contact || '').trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^[+0-9() .-]{7,25}$/;
  if (contact.length > 120 || !(email.test(contact) || (phone.test(contact) && contact.replace(/\D/g, '').length >= 7))) errors.contact = 'Enter the email address or phone number used for your enquiry.';
  if (!PRIVACY_REQUEST_TYPES.includes(values.kind)) errors.kind = 'Choose a request type from the list.';
  if (String(values.details || '').length > 600) errors.details = 'Keep the description to 600 characters or fewer.';
  return errors;
}

export function buildPrivacyDraft(values, name = 'AutixAI') {
  return [`Hi ${name},`, `Request: ${values.kind}`, `Contact used for my enquiry: ${String(values.contact).trim()}`, ...(String(values.details || '').trim() ? ['', String(values.details).trim()] : [])].join('\n');
}
