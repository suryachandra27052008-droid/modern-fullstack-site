import { createGuide, validateAudit, buildAuditDraft, MAX_MESSAGE } from './assistant-engine.js?v=20261008.5';

const node = (tag, className = '', text = '') => {
  const element = document.createElement(tag); element.className = className;
  if (text) element.textContent = text;
  return element;
};
const action = (text, callback, className = 'ax-chip') => {
  const button = node('button', className, text); button.type = 'button'; button.addEventListener('click', callback); return button;
};

export function createAssistant({ button, data }) {
  let guide = createGuide(data), activeControls, view = 'chat', scrollOverflow, lastFocus;
  const track = name => window.AutixAIEvents?.track(name);
  const dialog = node('dialog', 'ax-dialog'); dialog.id = 'autixai-assistant';
  dialog.setAttribute('aria-labelledby', 'ax-title'); dialog.setAttribute('aria-describedby', 'ax-description');
  button.setAttribute('aria-controls', dialog.id);
  dialog.innerHTML = `<header class="ax-header"><div class="ax-identity"><img src="/branding/autixai-logo-original.jpg" alt="" width="42" height="42"><div><h2 id="ax-title">AutixAI Assistant</h2><span class="ax-ready"><i aria-hidden="true"></i>Guided · Ready</span></div></div><div class="ax-controls"><button type="button" class="ax-icon-button" data-ax-reset aria-label="Reset conversation" title="Reset conversation">↺</button><button type="button" class="ax-icon-button" data-ax-close aria-label="Close assistant" title="Close assistant">×</button></div></header><p class="ax-description" id="ax-description">Tell me what your business does and I’ll show you what you could automate.</p><div class="ax-chat-view"><div class="ax-thread" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions"></div><form class="ax-composer" novalidate><label class="sr-only" for="ax-message">Your message</label><div class="ax-input-row"><textarea id="ax-message" name="message" rows="1" maxlength="1000" placeholder="Ask about automation…" aria-describedby="ax-message-error"></textarea><button type="submit" class="ax-send" aria-label="Send message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v14"/></svg></button></div><p id="ax-message-error" class="ax-error" role="status" hidden></p></form></div><div class="ax-audit-view" hidden></div><footer class="ax-privacy"><span>Guided suggestions. No live AI or external chat service.</span><span>Please don't share passwords, API keys or sensitive personal information. <a href="/privacy/">Privacy</a></span></footer>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const thread = $('.ax-thread'), composer = $('.ax-composer'), input = $('#ax-message'), chatView = $('.ax-chat-view'), auditView = $('.ax-audit-view');

  function showNew(element) {
    requestAnimationFrame(() => { if (dialog.open) thread.scrollTop = Math.max(0, element.offsetTop - 12); });
  }
  function bubble(text, role = 'assistant') {
    const message = node('div', `ax-message ax-${role}`);
    message.append(node('span', 'ax-message-label', role === 'user' ? 'YOU' : 'AUTIXAI'), node('p', '', text));
    thread.append(message); return message;
  }
  function retire() {
    activeControls?.querySelectorAll('button,select').forEach(control => { control.disabled = true; });
    activeControls?.classList.add('ax-retired'); activeControls = null;
  }
  function controlsFor(result, container) {
    if (!result.question) return;
    const controls = node('div', 'ax-discovery');
    const label = node('label', 'ax-question', result.prompt);
    const select = node('select', 'ax-select'); select.id = `ax-choice-${guide.state.turns}-${thread.children.length}`; label.htmlFor = select.id;
    const placeholder = node('option', '', result.question === 'industry' ? 'Choose your business' : result.question === 'area' ? 'Choose a process' : 'Choose your tools'); placeholder.value = ''; select.append(placeholder);
    let options;
    if (result.question === 'industry') options = [...data.industries, { id: 'other', title: 'Other / mixed business' }];
    else if (result.question === 'area') {
      const first = result.choices || guide.recommended();
      options = [...first, ...data.areas.filter(a => !first.some(b => a.id === b.id))];
    } else options = (result.choices || []).map(title => ({ id: title, title }));
    options.forEach(item => { const option = node('option', '', item.title); option.value = item.id; select.append(option); });
    const continueButton = action('Explore →', () => {
      if (!select.value) { select.setAttribute('aria-invalid', 'true'); select.focus(); return; }
      send(select.value, result.question, select.selectedOptions[0].textContent);
    }, 'ax-primary');
    select.addEventListener('change', () => select.removeAttribute('aria-invalid'));
    controls.append(label, select, continueButton);
    if (result.question === 'area') {
      const chips = node('div', 'ax-chips');
      (result.choices || guide.recommended()).forEach(item => chips.append(action(item.title, () => send(item.id, 'area', item.title))));
      controls.append(chips);
    }
    container.append(controls); activeControls = controls;
  }
  function workflow(details, container) {
    const card = node('section', 'ax-workflow');
    const eyebrow = node('div', 'ax-kicker', 'YOUR POSSIBLE WORKFLOW');
    const title = node('h3', '', details.title);
    const steps = node('ol', 'ax-steps');
    details.steps.forEach((text, index) => {
      const step = node('li', 'ax-step'); step.style.setProperty('--step', index);
      const marker = node('span', 'ax-step-marker', String(index + 1).padStart(2, '0')); marker.setAttribute('aria-hidden', 'true');
      step.append(marker, node('span', '', text)); steps.append(step);
    });
    const outcome = node('p', 'ax-outcome', details.outcome);
    const service = node('p', 'ax-service', `Relevant service · ${details.service}`);
    const replay = action('Replay workflow ↻', () => workflowReplay(card), 'ax-text-button');
    card.append(eyebrow, title, steps, outcome, service, replay); container.append(card);
  }
  function workflowReplay(card) { const list = card.querySelector('.ax-steps'); list.replaceWith(list.cloneNode(true)); }
  function render(result) {
    if (result.error) { error(result.error); return; }
    if (result.audit) { openAudit(); return; }
    const message = bubble(result.text || 'Let’s explore your workflow.');
    if (result.workflow) workflow(result.workflow, message);
    if (result.note) message.append(node('p', 'ax-note', result.note));
    if (result.link) { const link = node('a', 'ax-text-link', result.link.label); link.href = result.link.href; message.append(link); }
    controlsFor(result, message);
    if (result.offerAudit || result.contact || result.limited) {
      const actions = node('div', 'ax-chips ax-result-actions');
      if (result.offerAudit || result.limited) actions.append(action('Get Free Automation Audit', openAudit, 'ax-primary'));
      if (result.offerAudit) actions.append(action('Continue Chatting', () => send('Continue chatting', 'continue')));
      if (result.contact || result.limited) actions.append(whatsappLink('Talk on WhatsApp'));
      if (result.limited) actions.append(action('Start again', reset));
      message.append(actions);
    }
    showNew(message);
    message.tabIndex = -1; requestAnimationFrame(() => message.focus({ preventScroll: true }));
  }
  function error(text) { const field = $('#ax-message-error'); field.hidden = !text; field.textContent = text; input.setAttribute('aria-invalid', String(Boolean(text))); }
  function send(value, command = '', label = value) {
    if (!String(value).trim()) { error('Type a question, or choose an option above.'); input.focus(); return; }
    if (value.length > MAX_MESSAGE) { error('Please keep your message under 1,000 characters.'); return; }
    const result = guide.respond(value, command);
    if (result.error) { error(result.error); return; }
    retire(); error(''); bubble(label, 'user');
    input.value = ''; input.style.height = '';
    track(command ? 'assistant_quick_action_clicked' : 'assistant_message_sent'); render(result);
  }
  function whatsappLink(label, draft = '') {
    const link = node('a', 'ax-chip', label); link.href = `https://wa.me/${data.contact.whatsapp}${draft ? `?text=${encodeURIComponent(draft)}` : ''}`;
    link.target = '_blank'; link.rel = 'noopener noreferrer'; link.addEventListener('click', () => track('assistant_whatsapp_handoff')); return link;
  }
  function start() {
    const message = bubble(data.assistant.greeting);
    controlsFor({ question: 'industry', prompt: 'What type of business do you run?' }, message);
    const chips = node('div', 'ax-chips ax-quick-starts');
    const choices = [
      ['What can I automate?', 'What can I automate?', ''], ['Automate my WhatsApp','whatsapp','area'],
      ['Automate leads','leads','area'], ['Automate customer support','support','area'],
      ['I run an e-commerce business','ecommerce','industry'], ['Get a free automation audit','Get a free automation audit','audit']
    ];
    choices.forEach(([label, value, command]) => chips.append(action(label, () => send(value, command, label))));
    message.append(chips); activeControls = message;
    const topics = node('div', 'ax-topics');
    [['Pricing','pricing'],['How it works','how it works'],['Integrations','integrations']].forEach(([label, value]) => topics.append(action(label, () => send(value), 'ax-text-button')));
    message.append(topics); thread.scrollTop = 0;
  }

  function openAudit() {
    track('assistant_audit_requested'); view = 'audit'; chatView.hidden = true; auditView.hidden = false;
    if (!auditView.children.length) createAudit();
    const values = guide.summaries();
    const form = auditView.querySelector('form');
    // Fill untouched fields only; preserve edits when visitors return from the chat.
    const defaults = { industry: guide.state.businessType, process: data.areas.find(a => a.id === guide.state.areaId)?.title || '', tools: guide.state.tools, ...values };
    for (const [key, value] of Object.entries(defaults)) if (!form.elements[key].dataset.edited) form.elements[key].value = value;
    auditView.querySelector('.ax-audit-preview').hidden = true;
    auditView.querySelector('.ax-audit-preview a').removeAttribute('href');
    auditView.querySelector('.ax-audit-scroll').scrollTop = 0;
    requestAnimationFrame(() => form.elements.name.focus({ preventScroll: true }));
  }
  function showChat() { view = 'chat'; auditView.hidden = true; chatView.hidden = false; requestAnimationFrame(() => input.focus({ preventScroll: true })); }
  function createAudit() {
    const back = action('← Back to conversation', showChat, 'ax-text-button ax-back');
    const scroll = node('div', 'ax-audit-scroll');
    scroll.append(node('div', 'ax-kicker', 'YOUR NEXT STEP'), node('h3', 'ax-audit-title', 'Let’s find your first win.'), node('p', 'ax-audit-intro', data.assistant.auditDescription));
    const form = node('form', 'ax-audit-form'); form.noValidate = true;
    const fields = [
      ['name','Your name','text',80,true], ['business','Business name','text',100,true],
      ['industry','Business type','select',100,true], ['process','Process you want to automate','textarea',600,true],
      ['tools','Current tools (optional)','text',200,false], ['phone','WhatsApp number','tel',25,false], ['email','Email address','email',120,false],
      ['opportunity','Main automation opportunity','textarea',300,false], ['summary','Short conversation summary','textarea',450,false]
    ];
    fields.forEach(([name, label, type, max, required]) => {
      const wrap = node('div', `ax-field ax-field-${name}`), id = `ax-audit-${name}`;
      const title = node('label', '', `${label}${required ? ' *' : ''}`); title.htmlFor = id;
      const field = node(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input'); field.id = id; field.name = name; field.required = required;
      if (type === 'textarea') field.rows = 2;
      if (type !== 'textarea' && type !== 'select') field.type = type;
      if (type !== 'select') field.maxLength = max;
      if (type === 'select') {
        const empty = node('option', '', 'Choose your business type'); empty.value = ''; field.append(empty);
        [...data.industries.map(i => i.title), 'Other / mixed business'].forEach(text => { const option = node('option', '', text); option.value = text; field.append(option); });
      }
      field.autocomplete = ({name:'name',business:'organization',phone:'tel',email:'email'})[name] || 'off';
      if (name === 'phone') field.inputMode = 'tel';
      field.setAttribute('aria-describedby', `${id}-error${['phone','email'].includes(name) ? ' ax-contact-hint' : ''}`);
      const error = node('span', 'ax-error'); error.id = `${id}-error`; error.hidden = true;
      wrap.append(title, field, error); form.append(wrap);
      if (name === 'tools') { const hint = node('p', 'ax-field-hint', 'Add a WhatsApp number OR an email—one is enough.'); hint.id = 'ax-contact-hint'; form.append(hint); }
      if (name === 'email') form.append(node('p', 'ax-field-hint', 'The summary includes your selected workflow, not the full chat. Edit or clear it before sharing.'));
      field.addEventListener('input', () => {
        field.dataset.edited = 'true'; field.removeAttribute('aria-invalid'); error.hidden = true;
        preview.hidden = true; handoff.removeAttribute('href');
      });
    });
    const submit = node('button', 'ax-primary', 'Review my WhatsApp request →'); submit.type = 'submit'; form.append(submit);
    form.append(node('p', 'ax-field-hint', 'Preparing a draft sends nothing. You decide whether to open WhatsApp and tap Send there. AutixAI uses the details you send to answer this enquiry; this does not subscribe you to marketing. Please avoid confidential records and children’s personal data.'));
    const preview = node('section', 'ax-audit-preview'); preview.hidden = true;
    const previewTitle = node('h4', '', 'Your exact WhatsApp draft'); previewTitle.tabIndex = -1;
    const text = node('pre', 'ax-draft');
    const handoff = whatsappLink('Open WhatsApp with this draft ↗'); handoff.className = 'ax-primary'; handoff.removeAttribute('href');
    preview.append(previewTitle, text, handoff, node('p', 'ax-field-hint', 'Opening WhatsApp shares this draft with WhatsApp. Review it and tap Send there to contact AutixAI.'));
    form.addEventListener('submit', event => {
      event.preventDefault(); const values = Object.fromEntries(new FormData(form)); const errors = validateAudit(values);
      form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
      form.querySelectorAll('.ax-error').forEach(error => { error.hidden = true; });
      if (Object.keys(errors).length) {
        for (const [key, message] of Object.entries(errors)) { const field = form.elements[key]; const error = form.querySelector(`#${field.id}-error`); field.setAttribute('aria-invalid', 'true'); error.hidden = false; error.textContent = message; }
        form.elements[Object.keys(errors)[0]].focus(); return;
      }
      const draft = buildAuditDraft(values); text.textContent = draft;
      handoff.href = `https://wa.me/${data.contact.whatsapp}?text=${encodeURIComponent(draft)}`; preview.hidden = false;
      previewTitle.focus(); track('audit_request_prepared');
    });
    scroll.append(form, preview); auditView.append(back, scroll);
  }

  function reset() {
    guide = createGuide(data); retire(); thread.replaceChildren(); auditView.replaceChildren(); error(''); input.value = ''; input.style.height = '';
    view = 'chat'; chatView.hidden = false; auditView.hidden = true; start();
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
  }
  composer.addEventListener('submit', event => { event.preventDefault(); send(input.value); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); send(input.value); } });
  input.addEventListener('input', () => { error(''); input.style.height = 'auto'; input.style.height = `${Math.min(100, input.scrollHeight)}px`; });
  $('[data-ax-reset]').addEventListener('click', reset);
  $('[data-ax-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const stops = [...dialog.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = stops[0], last = stops.at(-1);
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
  });
  let viewportFrame;
  const fit = () => {
    cancelAnimationFrame(viewportFrame); viewportFrame = requestAnimationFrame(() => {
      const vv = window.visualViewport;
      dialog.style.setProperty('--ax-vh', `${vv?.height || window.innerHeight}px`);
      dialog.style.setProperty('--ax-vtop', `${vv?.offsetTop || 0}px`);
    });
  };
  dialog.addEventListener('close', () => {
    button.setAttribute('aria-expanded', 'false'); document.body.style.overflow = scrollOverflow;
    window.visualViewport?.removeEventListener('resize', fit); window.visualViewport?.removeEventListener('scroll', fit); window.removeEventListener('resize', fit);
    cancelAnimationFrame(viewportFrame); (lastFocus?.isConnected ? lastFocus : button).focus({ preventScroll: true });
  });
  start();
  return { open() {
    if (dialog.open) return;
    lastFocus = document.activeElement; scrollOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    dialog.showModal(); button.setAttribute('aria-expanded', 'true'); track('assistant_opened');
    fit(); window.visualViewport?.addEventListener('resize', fit); window.visualViewport?.addEventListener('scroll', fit); window.addEventListener('resize', fit);
    // Avoid opening the phone keyboard until the visitor chooses to type.
    requestAnimationFrame(() => (view === 'audit' ? auditView.querySelector('input') : $('[data-ax-close]')).focus({ preventScroll: true }));
  }};
}
