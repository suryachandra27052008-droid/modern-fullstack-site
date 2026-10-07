import { CONSENT_KEY, readConsent, makeConsent, allowsAnalytics, validatePrivacyRequest, buildPrivacyDraft } from './privacy-core.js?v=20261008.3';

const optionalEnabled = window.AUTIXAI_CONFIG?.analyticsEnabled === true;
let choice = null;
if (optionalEnabled) {
  try { choice = readConsent(localStorage.getItem(CONSENT_KEY)); } catch { /* Default stays blocked if storage is unavailable. */ }
}
let lastFocus;
let dialog;
let banner;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let pausedMotion = false;

function announceChoice() {
  window.dispatchEvent(new CustomEvent('autixai:privacychange', { detail: { analytics: allowsAnalytics(optionalEnabled, choice) } }));
}
function saveChoice(allow) {
  choice = makeConsent(allow);
  let saved = true;
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(choice)); } catch { saved = false; }
  banner?.remove();
  announceChoice();
  const status = dialog.querySelector('[data-choice-status]');
  status.textContent = `${allow ? 'Optional analytics allowed.' : 'Optional analytics blocked.'}${saved ? ' Your choice is saved for up to 180 days.' : ' Your browser could not save this choice; it applies only to this page.'}`;
}

function syncMotion() {
  document.documentElement.toggleAttribute('data-motion-paused', pausedMotion || reducedMotion.matches);
  if (dialog) {
    const field = dialog.querySelector('[data-pause-motion]');
    field.checked = pausedMotion || reducedMotion.matches;
    field.disabled = reducedMotion.matches;
    dialog.querySelector('[data-motion-description]').textContent = reducedMotion.matches ? 'Your device requests reduced motion. This preference is respected automatically.' : 'Pauses decorative animations for this page. Videos keep their playback controls.';
  }
  window.dispatchEvent(new Event('autixai:motionchange'));
}

function ensureDialog() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.className = 'privacy-dialog';
  dialog.setAttribute('aria-labelledby', 'privacy-settings-title');
  dialog.setAttribute('aria-describedby', 'privacy-settings-description');
  dialog.innerHTML = `<div class="privacy-dialog-top"><h2 id="privacy-settings-title">Your privacy choices</h2><button class="icon-button" type="button" data-close-privacy aria-label="Close privacy settings">×</button></div><p id="privacy-settings-description">${optionalEnabled ? 'Optional analytics stays off until you allow it. Rejecting keeps every website feature available.' : 'No optional analytics or advertising tracker is enabled. The assistant and drafts stay in this page until you choose to share.'}</p><div class="privacy-choice"><strong>Website essentials</strong><span>Page delivery and the features you request. Always available.</span></div><label class="privacy-choice privacy-checkbox"><input type="checkbox" data-analytics-choice ${optionalEnabled ? '' : 'disabled'}><span><strong>Optional analytics</strong><span>${optionalEnabled ? 'Fixed interaction names only. No chat, contact details or form text.' : 'Not currently enabled. No analytics consent is needed for the current features.'}</span></span></label><label class="privacy-choice privacy-checkbox"><input type="checkbox" data-pause-motion><span><strong>Pause decorative motion</strong><span data-motion-description></span></span></label><p data-choice-status class="privacy-status" role="status"></p><div class="privacy-actions"><button type="button" class="button button-outline" data-reject-privacy ${optionalEnabled ? '' : 'hidden'}>Reject optional</button><button type="button" class="button button-outline" data-save-privacy>${optionalEnabled ? 'Save choices' : 'Done'}</button></div><p class="privacy-small"><a href="/cookies/">Cookies & privacy choices</a> · <a href="/privacy/#privacy-request">Make a privacy request</a></p>`;
  document.body.append(dialog);
  dialog.querySelector('[data-close-privacy]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true }); });
  dialog.querySelector('[data-pause-motion]').addEventListener('change', event => { pausedMotion = event.target.checked; syncMotion(); });
  dialog.querySelector('[data-reject-privacy]').addEventListener('click', () => {
    dialog.querySelector('[data-analytics-choice]').checked = false;
    saveChoice(false);
  });
  dialog.querySelector('[data-save-privacy]').addEventListener('click', () => {
    if (optionalEnabled) saveChoice(dialog.querySelector('[data-analytics-choice]').checked);
    else dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('a[href],button,input')].filter(item => !item.disabled && item.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  syncMotion();
}

function openSettings() {
  ensureDialog();
  if (dialog.open) return;
  dialog.querySelector('[data-analytics-choice]').checked = allowsAnalytics(optionalEnabled, choice);
  dialog.querySelector('[data-choice-status]').textContent = optionalEnabled ? (choice ? `Current choice: optional analytics ${choice.analytics ? 'allowed' : 'blocked'}.` : 'No choice saved. Optional analytics is blocked.') : 'No optional tracking is active.';
  lastFocus = document.activeElement;
  dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('[data-close-privacy]').focus();
}

window.AutixAIPrivacy = Object.freeze({ allowsAnalytics: () => allowsAnalytics(optionalEnabled, choice), openSettings });
document.querySelectorAll('[data-privacy-settings]').forEach(button => button.addEventListener('click', openSettings));
reducedMotion.addEventListener('change', syncMotion);
syncMotion();
announceChoice();

if (optionalEnabled && !choice) {
  ensureDialog();
  banner = document.createElement('aside');
  banner.className = 'privacy-banner';
  banner.setAttribute('aria-labelledby', 'privacy-banner-title');
  banner.innerHTML = '<div><h2 id="privacy-banner-title">Optional analytics. Your choice.</h2><p>Help us understand which features are used, using fixed interaction names. No enquiry or chat text. Everything works if you reject. <a href="/cookies/">Read about storage</a>.</p></div><div class="privacy-actions"><button class="button button-outline" type="button" data-banner-reject>Reject optional</button><button class="button button-outline" type="button" data-banner-allow>Allow analytics</button><button class="inline-link" type="button" data-banner-manage>Manage choices</button></div>';
  document.body.append(banner);
  banner.querySelector('[data-banner-reject]').addEventListener('click', () => saveChoice(false));
  banner.querySelector('[data-banner-allow]').addEventListener('click', () => saveChoice(true));
  banner.querySelector('[data-banner-manage]').addEventListener('click', openSettings);
}

const form = document.getElementById('privacy-request-form');
if (form) {
  form.noValidate = true;
  const result = document.getElementById('privacy-request-result');
  const send = document.getElementById('privacy-request-send');
  const error = document.getElementById('privacy-request-error');
  const fields = ['kind', 'contact', 'details'];
  fields.forEach(key => {
    const field = form.elements[key];
    field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} privacy-request-error`.trim());
  });
  const invalidate = () => { result.hidden = true; send.removeAttribute('href'); };
  form.addEventListener('input', event => { invalidate(); error.hidden = true; event.target.removeAttribute('aria-invalid'); });
  form.addEventListener('change', invalidate);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const errors = validatePrivacyRequest(values);
    fields.forEach(key => form.elements[key].setAttribute('aria-invalid', String(!!errors[key])));
    if (Object.keys(errors).length) {
      invalidate(); error.textContent = Object.values(errors).join(' '); error.hidden = false;
      form.elements[Object.keys(errors)[0]].focus(); return;
    }
    error.hidden = true;
    const draft = buildPrivacyDraft(values);
    document.getElementById('privacy-request-preview').textContent = draft;
    send.href = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(draft)}`;
    result.hidden = false; result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: reducedMotion.matches || pausedMotion ? 'instant' : 'smooth', block: 'nearest' });
  });
  document.getElementById('privacy-request-clear').addEventListener('click', () => {
    form.reset(); invalidate(); document.getElementById('privacy-request-preview').textContent = ''; error.hidden = true;
    fields.forEach(key => form.elements[key].removeAttribute('aria-invalid'));
    form.elements.kind.focus();
  });
  if (new URLSearchParams(location.search).get('request') === 'accessibility') form.elements.kind.value = 'Accessibility help';
  form.querySelector('[type="submit"]').disabled = false;
}
