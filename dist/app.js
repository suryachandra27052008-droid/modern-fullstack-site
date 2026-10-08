'use strict';
const calculatorInputs = ['tasks', 'minutes', 'days'].map(id => document.getElementById(id));
const costInputs = ['hourly-cost', 'coverage', 'setup-cost', 'running-cost'].map(id => document.getElementById(id));
const WEBHOOK_URL = window.AutixAIEndpoints?.webhook || '';
const businessContact = window.AUTIXAI_CONTENT.contact;
const teamInputs = ['employees','weekly-hours'].map(id => document.getElementById(id));
let estimateMode = 'team';
const currencies = {INR:{locale:'en-IN',symbol:'₹',hourly:250},USD:{locale:'en-US',symbol:'$',hourly:25}};
let selectedCurrency = 'INR';
let estimate = null;
const currencyScenarios = {INR:['250','60','',''],USD:['25','60','','']};
function formatMoney(value) {
  return new Intl.NumberFormat(currencies[selectedCurrency].locale, {style:'currency',currency:selectedCurrency,maximumFractionDigits:0}).format(value);
}
function updateEstimate() {
  const [tasks, minutes, days] = calculatorInputs.map(input => Number(input.value));
  const workloadInputs = estimateMode === 'team' ? teamInputs : calculatorInputs;
  const valid = [...workloadInputs, ...costInputs].every(input => input.validity.valid);
  document.getElementById('estimate-error').hidden = valid;
  document.getElementById('estimate-results').hidden = !valid;
  document.getElementById('estimate-inquiry').disabled = !valid;
  [...calculatorInputs,...teamInputs,...costInputs].forEach(input => input.setAttribute('aria-invalid', String(workloadInputs.concat(costInputs).includes(input) && !input.validity.valid)));
  if (!valid) { estimate = null; return; }
  const [hourlyCost, coverage, setupCost, runningCost] = costInputs.map(input => Number(input.value));
  const [employees, hoursPerEmployee] = teamInputs.map(input => Number(input.value));
  const weeklyHours = estimateMode === 'team' ? employees * hoursPerEmployee : tasks * minutes * days / 60;
  const monthlyHours = weeklyHours * 52 / 12;
  const capacity = monthlyHours * coverage / 100;
  const capacityValue = capacity * hourlyCost;
  const hasCosts = costInputs[2].value !== '' && costInputs[3].value !== '';
  const netValue = capacityValue - runningCost;
  document.getElementById('tasks-output').textContent = String(tasks);
  document.getElementById('minutes-output').textContent = `${minutes} min`;
  document.getElementById('days-output').textContent = String(days);
  document.getElementById('coverage-output').textContent = `${coverage}%`;
  document.getElementById('hours-result').replaceChildren(document.createTextNode(weeklyHours.toFixed(1)));
  const units = document.createElement('span'); units.textContent = ' hours / week';
  document.getElementById('hours-result').appendChild(units);
  estimate = {mode:estimateMode,employees,hoursPerEmployee,tasks,minutes,days,weeklyHours,capacity,currency:selectedCurrency};
  document.getElementById('monthly-hours-result').textContent = `${monthlyHours.toFixed(1)} hours`;
  document.getElementById('yearly-hours-result').textContent = `${(weeklyHours * 52 * coverage / 100).toFixed(1)} hours`;
  document.getElementById('yearly-value-result').textContent = formatMoney(weeklyHours * 52 * coverage / 100 * hourlyCost);
  document.getElementById('manual-cost-result').textContent = formatMoney(monthlyHours * hourlyCost);
  document.getElementById('capacity-result').textContent = `${capacity.toFixed(1)} hours`;
  document.getElementById('capacity-value-result').textContent = formatMoney(capacityValue);
  document.getElementById('net-value-result').textContent = hasCosts ? formatMoney(netValue) : 'Add both cost estimates';
  document.getElementById('payback-result').textContent = !hasCosts ? 'Add both cost estimates' : setupCost === 0 ? 'No setup cost' : netValue <= 0 ? 'Not recovered at these inputs' : `${(setupCost / netValue).toFixed(1)} months`;
}
[...calculatorInputs, ...teamInputs, ...costInputs].forEach(input => input.addEventListener('input', () => { updateEstimate(); window.AutixAIEvents.track('calculator_usage'); }));
function setEstimateMode(mode) {
  estimateMode = mode;
  document.getElementById('team-inputs').hidden = mode !== 'team';
  document.getElementById('task-inputs').hidden = mode !== 'task';
  document.querySelectorAll('[data-estimate-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.estimateMode === mode)));
  updateEstimate();
}
document.querySelectorAll('[data-estimate-mode]').forEach(button => button.addEventListener('click', () => { setEstimateMode(button.dataset.estimateMode); window.AutixAIEvents.track('calculator_usage'); }));
updateEstimate();
document.querySelectorAll('[data-currency]').forEach(button => button.addEventListener('click', () => {
  const next = button.dataset.currency;
  if (next === selectedCurrency) return;
  currencyScenarios[selectedCurrency] = costInputs.map(input => input.value);
  selectedCurrency = next;
  costInputs.forEach((input,index) => { input.value = currencyScenarios[next][index]; });
  document.querySelectorAll('[data-currency]').forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.currency === next)));
  document.querySelectorAll('[data-currency-symbol]').forEach(label => { label.textContent = `${currencies[next].symbol} ${next}`; });
  updateEstimate();
}));

const workflows = {
  leads: { title: 'From new inquiry to qualified opportunity.', description: 'Connect your lead sources to your sales process. Repeat follow-ups can run automatically, with opt-out rules and a clear handover to your team.', interest: 'Sales and lead automation', steps: [ ['Lead arrives', 'Capture a website form, WhatsApp message or email inquiry.'], ['AI understands the request', 'Organise the needs using the details the prospect provided.'], ['Lead qualified', 'Check the agreed criteria; uncertain cases go to a person.'], ['CRM updated', 'Validate and create or update the structured lead record.'], ['Salesperson assigned', 'Route to the owner using your territory or service rules.'], ['Follow-up prepared', 'Queue an approved response, respecting consent and opt-out rules.'], ['Team notified', 'Share the lead context and next task with your team.'] ] },
  support: { title: 'A faster answer. A thoughtful handover.', description: 'An assistant uses your approved business knowledge to respond to routine questions. When a request needs judgement or the answer is unclear, it hands over with the conversation context.', interest: 'AI customer support', steps: [ ['Receive the question', 'Capture a customer request through your connected channel.'], ['Find relevant knowledge', 'Look up information in your approved business resources.'], ['Answer or escalate', 'Respond to supported questions; route exceptions to a person.'], ['Keep the context', 'Log the conversation so the team can pick up smoothly.'] ] },
  operations: { title: 'Turn paperwork into a connected process.', description: 'Extract details from incoming documents, flag missing information, and send records for review. After approval, update the connected system and notify the people who need to know.', interest: 'Reporting and operations', steps: [ ['Receive a document', 'An attachment or connected upload triggers the workflow.'], ['Extract and check', 'Read relevant fields and flag missing or inconsistent details.'], ['Request human approval', 'A team member reviews the details before committing changes.'], ['Update and notify', 'Write the approved record and send the next task or alert.'] ] }
};
const workflowFacts = {
  leads: [['Trigger & inputs', 'A new website, email, or WhatsApp inquiry; contact details and consent where required.'], ['Example tools', 'Website form / WhatsApp, HubSpot or your CRM, n8n / Make, and an approved AI provider.'], ['Team control', 'Review uncertain leads and approve sensitive messages; respect opt-outs.'], ['Business output', 'A structured CRM lead, assigned owner, and appropriate next step.']],
  support: [['Trigger & inputs', 'An incoming customer question and your approved support knowledge.'], ['Example tools', 'Website chat / WhatsApp, a business knowledge source, help desk or CRM, and an approved AI provider.'], ['Team control', 'Escalate uncertain answers and requests needing judgement, with conversation context.'], ['Business output', 'A supported answer or a ticket ready for a person to handle.']],
  operations: [['Trigger & inputs', 'A document arrives through a connected inbox or upload.'], ['Example tools', 'Google Workspace, document extraction, n8n / Make, and a spreadsheet or business system.'], ['Team control', 'Check missing fields and require approval before writing the final record.'], ['Business output', 'An approved, structured record and the next task or notification.']]
};
const detail = document.getElementById('workflow-detail');
const workflowButtons = document.querySelectorAll('[data-workflow-button]');
const runButton = document.getElementById('run-demo');
const status = document.getElementById('demo-status');
const demoVisual = document.createElement('div');
demoVisual.className = 'demo-visual';
demoVisual.setAttribute('aria-hidden', 'true');
document.getElementById('detail-description').after(demoVisual);
let demoNodes = [], demoRoute, demoPacket;
const demoLabels = {leads:['Lead','Understand','Qualify','CRM','Assign','Follow-up','Notify'],support:['Question','Knowledge','Answer','Handover'],operations:['Document','Extract','Review','Update']};
function renderDemoVisual(key) {
  const labels = demoLabels[key];
  const positions = labels.map((_,i) => 60+i/(labels.length-1)*680);
  demoVisual.innerHTML = `<svg viewBox="0 0 800 100" xmlns="http://www.w3.org/2000/svg"><path class="demo-route" d="M60 50H740"/><path class="demo-route-active" d="M60 50H740" pathLength="100"/>${positions.map((x,i)=>`<g class="demo-node"><circle class="node-halo" cx="${x}" cy="50" r="30"/><circle cx="${x}" cy="50" r="23"/><text x="${x}" y="51">0${i+1}</text></g>`).join('')}<circle class="demo-packet" cx="60" cy="50" r="5"/></svg><div class="demo-labels" style="grid-template-columns:repeat(${labels.length},1fr)">${labels.map(label=>`<span>${label}</span>`).join('')}</div>`;
  demoNodes = [...demoVisual.querySelectorAll('.demo-node')];
  demoRoute = demoVisual.querySelector('.demo-route-active');
  demoPacket = demoVisual.querySelector('.demo-packet');
}
renderDemoVisual('leads');
let activeWorkflow = null;
let demoTimer = null;
function resetDemo() {
  clearTimeout(demoTimer); runButton.disabled = false; runButton.textContent = 'Run workflow demo'; status.textContent = 'Run the demo to see how the steps connect.';
  demoVisual.classList.remove('is-running','is-complete');demoRoute.style.strokeDashoffset='100';demoPacket.style.cx='60px';
  demoNodes.forEach((node,i)=>{node.classList.remove('current','done');node.querySelector('text').textContent=`0${i+1}`;});
  detail.querySelectorAll('#detail-steps li').forEach(step=>step.classList.remove('current','done'));
}
function closeWorkflow() { resetDemo(); detail.hidden = true; activeWorkflow = null; workflowButtons.forEach(button => { button.setAttribute('aria-expanded', 'false'); button.closest('.portfolio-card').classList.remove('active'); button.querySelector('span').textContent = '+'; }); }
function openWorkflow(key) {
  if (activeWorkflow === key && !detail.hidden) { closeWorkflow(); return; }
  resetDemo(); activeWorkflow = key; const data = workflows[key];
  document.getElementById('detail-title').textContent = data.title;
  document.getElementById('detail-description').textContent = data.description;
  const facts = document.getElementById('workflow-facts'); facts.replaceChildren();
  workflowFacts[key].forEach(([label, value]) => {
    const group = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value; group.append(dt, dd); facts.append(group);
  });
  renderDemoVisual(key);
  const list = document.getElementById('detail-steps'); list.replaceChildren();
  data.steps.forEach(([title, description], index) => { const li = document.createElement('li'); const number = document.createElement('span'); number.textContent = `0${index + 1}`; const strong = document.createElement('strong'); strong.textContent = title; const p = document.createElement('p'); p.textContent = description; li.append(number, strong, p); list.append(li); });
  workflowButtons.forEach(button => { const selected = button.dataset.workflowButton === key; button.setAttribute('aria-expanded', String(selected)); button.closest('.portfolio-card').classList.toggle('active', selected); button.querySelector('span').textContent = selected ? '−' : '+'; });
  detail.hidden = false; detail.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  document.getElementById('detail-title').focus({preventScroll:true});
}
workflowButtons.forEach(button => button.addEventListener('click', () => openWorkflow(button.dataset.workflowButton)));
document.getElementById('close-workflow').addEventListener('click', () => { const key = activeWorkflow; closeWorkflow(); document.querySelector(`[data-workflow-button="${key}"]`)?.focus({preventScroll:true}); });
detail.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeWorkflow) {
    event.preventDefault();
    const key = activeWorkflow; closeWorkflow();
    document.querySelector(`[data-workflow-button="${key}"]`)?.focus({preventScroll:true});
  }
});
runButton.addEventListener('click', () => {
  if (!activeWorkflow) return;
  resetDemo(); runButton.disabled = true; runButton.textContent = 'Demo running…';demoVisual.classList.add('is-running');
  const steps = [...document.querySelectorAll('#detail-steps li')];
  let index = 0;
  const next = () => {
    if (index > 0) {
      steps[index-1].classList.replace('current','done');demoNodes[index-1].classList.replace('current','done');demoNodes[index-1].querySelector('text').textContent='✓';
    }
    if (index === steps.length) {
      demoVisual.classList.replace('is-running','is-complete');status.textContent = 'Demo complete. This simulation did not send messages or change any business data.';runButton.disabled=false;runButton.textContent='Run again';return;
    }
    steps[index].classList.add('current');demoNodes[index].classList.add('current');demoRoute.style.strokeDashoffset=String(100-index/(steps.length-1)*100);demoPacket.style.cx=`${60+index/(steps.length-1)*680}px`;
    status.textContent=`Demo step ${index+1} of ${steps.length}: ${workflows[activeWorkflow].steps[index][0]}`;
    index++;demoTimer=setTimeout(next,matchMedia('(prefers-reduced-motion: reduce)').matches?350:1200);
  };
  next();
});
document.getElementById('workflow-inquiry').addEventListener('click', () => { if (activeWorkflow) { inquiryDisclosure.open = true; result.hidden = true; document.getElementById('interest').value = workflows[activeWorkflow].interest; document.getElementById('challenge').focus({ preventScroll:true }); } });

// At most one mobile workflow card is highlighted. Scroll reads are batched per frame.
const mobileCardMedia = matchMedia('(max-width: 800px)');
const reducedCardMotion = matchMedia('(prefers-reduced-motion: reduce)');
const stackCards = [...document.querySelectorAll('.portfolio-card')];
const cardDeck = document.querySelector('.portfolio-grid');
let stopMobileCardEffects = () => {};
function configureMobileCardEffects() {
  stopMobileCardEffects();
  stackCards.forEach(card => { card.classList.remove('is-stack-focus'); card.style.transform = ''; });
  if (!mobileCardMedia.matches || reducedCardMotion.matches || document.documentElement.hasAttribute('data-motion-paused')) return;
  let frame = 0;
  let visible = true;
  const render = () => {
    frame = 0;
    const positions = stackCards.map((card,index) => ({card,index,bounds:card.getBoundingClientRect(),top:96+index*16}));
    const inView = positions.filter(({bounds,top}) => bounds.bottom > top && bounds.top < window.innerHeight);
    const pinned = inView.filter(({bounds,top}) => bounds.top <= top+2);
    const focused = (pinned.at(-1) || inView[0])?.card;
    stackCards.forEach(card => card.classList.toggle('is-stack-focus', card === focused));
  };
  const requestFrame = () => { if (visible && !frame) frame = requestAnimationFrame(render); };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) requestFrame();
    else stackCards.forEach(card => card.classList.remove('is-stack-focus'));
  }, {rootMargin:'100px'}) : null;
  observer?.observe(cardDeck);
  window.addEventListener('scroll', requestFrame, {passive:true});
  window.addEventListener('resize', requestFrame, {passive:true});
  requestFrame();
  stopMobileCardEffects = () => { observer?.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', requestFrame); window.removeEventListener('resize', requestFrame); };
}
mobileCardMedia.addEventListener('change', configureMobileCardEffects);
reducedCardMotion.addEventListener('change', configureMobileCardEffects);
window.addEventListener('autixai:motionchange', configureMobileCardEffects);
configureMobileCardEffects();

const form = document.getElementById('inquiry-form');
const result = document.getElementById('inquiry-result');
const formFields = [...form.querySelectorAll('input,select,textarea')].filter(input => input.name !== 'website');
formFields.forEach(input => {
  const error = document.createElement('span');
  error.id = `${input.id}-error`; error.className = 'field-error'; error.hidden = true;
  input.setAttribute('aria-describedby',`${input.getAttribute('aria-describedby') || ''} ${error.id}`.trim()); input.after(error);
});
function validateField(input, showError = true) {
  input.setCustomValidity('');
  if (input.required && !input.value.trim()) input.setCustomValidity('Please complete this field.');
  const missingContact = input.id === 'phone' && ['whatsapp','phone'].includes(form.elements.preferredContact.value) && !input.value.trim();
  if (missingContact) input.setCustomValidity('Add a phone number for your preferred contact method.');
  if (input.id === 'phone' && input.value.trim() && input.value.replace(/\D/g,'').length < 7) input.setCustomValidity('Enter a contact number containing at least 7 digits.');
  const valid = input.validity.valid;
  const error = document.getElementById(`${input.id}-error`);
  error.textContent = valid ? '' : missingContact ? input.validationMessage : input.validity.typeMismatch ? 'Enter a valid email address.' : input.id === 'phone' ? 'Enter a contact number with 7–25 characters and at least 7 digits.' : input.validationMessage;
  error.hidden = valid || !showError;
  input.setAttribute('aria-invalid', String(!valid && showError));
  return valid;
}
form.noValidate = true;
const pendingCaptures = new Set();
const submittedCaptures = new Map();
const primarySend = form.querySelector('[data-channel="email"]');
const whatsappPrepare = form.querySelector('[data-channel="whatsapp"]');
const resultHeading = document.getElementById('inquiry-result-heading');
const previewDisclosure = document.getElementById('enquiry-preview-details');
let currentCapture = '';
function updateSendButtons() {
  primarySend.disabled = pendingCaptures.size > 0;
  primarySend.textContent = pendingCaptures.size ? 'Submitting…' : 'Submit Enquiry';
  directSend.disabled = pendingCaptures.size > 0 || submittedCaptures.has(currentCapture);
  directSend.textContent = pendingCaptures.size ? 'Submitting…' : 'Submit Enquiry';
}
async function captureLead(values) {
  const captureStatus = document.getElementById('capture-status');
  if (!WEBHOOK_URL) {
    captureStatus.textContent = 'Send the WhatsApp draft or call us to complete your enquiry.';
    return;
  }
  const signature = JSON.stringify(values);
  currentCapture = signature;
  if (pendingCaptures.size) return;
  if (submittedCaptures.has(signature)) {
    resultHeading.textContent = 'Enquiry already submitted.';
    captureStatus.textContent = submittedCaptures.get(signature);
    captureStatus.dataset.state = 'success';
    updateSendButtons();
    return;
  }
  pendingCaptures.add(signature);
  updateSendButtons();
  resultHeading.textContent = 'Sending your enquiry…';
  captureStatus.textContent = 'Submitting your enquiry securely. You can also use WhatsApp.';
  captureStatus.dataset.state = 'sending';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const receipt = await window.AutixAIEnquiry.send(WEBHOOK_URL, values, controller.signal);
    const confirmation = 'Thank you! Your enquiry has been accepted for delivery to our team. We’ll use your preferred contact method to respond. This does not reserve a consultation time.';
    submittedCaptures.set(signature, confirmation);
    if (currentCapture === signature) {
      resultHeading.textContent = 'Enquiry submitted.';
      captureStatus.textContent = confirmation;
      captureStatus.dataset.state = 'success';
      window.AutixAIEvents.track('contact_form_complete');
    }
  } catch (error) {
    if (currentCapture === signature) {
      resultHeading.textContent = 'We couldn’t confirm your submission.';
      captureStatus.textContent = ['DELIVERY_UNCERTAIN','IN_PROGRESS'].includes(error.code)
        ? 'We could not confirm delivery. Your request may have reached us; another email has not been sent. Your details are still here—please contact us on WhatsApp or call us.'
        : `${error.message || "Your enquiry couldn't be submitted right now. Please try again or contact us on WhatsApp."} Your details are still here.`;
      captureStatus.dataset.state = 'error';
      for (const [key, message] of Object.entries(error.fields || {})) {
        const input = form.elements[key];
        if (!input || !formFields.includes(input)) continue;
        input.setCustomValidity(String(message)); input.setAttribute('aria-invalid','true');
        const fieldError = document.getElementById(`${input.id}-error`); fieldError.textContent = String(message); fieldError.hidden = false;
      }
    }
  } finally {
    clearTimeout(timeout); pendingCaptures.delete(signature); updateSendButtons();
  }
}
let preparedValues = null;
const directSend = document.getElementById('send-direct');
directSend.hidden = !WEBHOOK_URL;
directSend.addEventListener('click', () => { if (preparedValues) captureLead(preparedValues); });
function prepareInquiry(channel = 'whatsapp') {
  currentCapture = '';
  const values = Object.fromEntries(new FormData(form));
  Object.keys(values).forEach(key => { values[key] = values[key].trim(); });
  const message = [`Hi ${businessContact.name},`, values.interest === 'Free automation audit' ? 'I would like a free automation audit.' : `I would like to discuss: ${values.interest.toLowerCase()}.`, '', `Name: ${values.name}`, `Business: ${values.business}`, `Industry: ${values.industry}`, ...(values.phone ? [`Phone / WhatsApp: ${values.phone}`] : []), ...(values.email ? [`Email: ${values.email}`] : []), `Preferred contact: ${values.preferredContact}`, '', 'Process I want to automate:', values.challenge, '', `Current tools: ${values.tools || 'To discuss'}`, `Approximate time spent: ${values.timeSpent || 'To discuss'}`, `Team size: ${values.teamSize || 'To discuss'}`].join('\n');
  preparedValues = values;
  currentCapture = JSON.stringify(values);
  window.AutixAIEvents.track('audit_request_prepared');
  document.getElementById('inquiry-preview').textContent = message;
  document.getElementById('send-inquiry').href = `https://wa.me/${businessContact.whatsapp}?text=${encodeURIComponent(message)}`;
  result.hidden = false;
  resultHeading.textContent = 'Review your enquiry.';
  previewDisclosure.open = channel === 'whatsapp';
  delete document.getElementById('capture-status').dataset.state;
  document.getElementById('capture-status').textContent = submittedCaptures.get(currentCapture) || 'WhatsApp opens with your enquiry as a draft. Tap Send there to contact us. Opening WhatsApp does not submit this form.';
  result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  result.focus({preventScroll:true});
  updateSendButtons();
  if (channel === 'email' && WEBHOOK_URL) captureLead(values);
  if (channel === 'whatsapp') {
    // Open only from this explicit submit gesture; never count a draft as a received lead.
    window.open(document.getElementById('send-inquiry').href, '_blank', 'noopener,noreferrer');
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const invalid = formFields.filter(input => !validateField(input));
  document.getElementById('form-error').hidden = invalid.length === 0;
  if (invalid.length) { const disclosure = invalid[0].closest('.process-context'); if (disclosure) disclosure.open = true; invalid[0].focus(); return; }
  prepareInquiry(WEBHOOK_URL && event.submitter?.dataset.channel !== 'whatsapp' ? 'email' : 'whatsapp');
});
function clearPreparedInquiry() {
  result.hidden = true; preparedValues = null; currentCapture = '';
  document.getElementById('send-inquiry').removeAttribute('href');
  document.getElementById('inquiry-preview').textContent = '';
  document.getElementById('capture-status').textContent = '';
  updateSendButtons();
}
form.addEventListener('input', event => {
  clearPreparedInquiry();
  if (formFields.includes(event.target)) validateField(event.target);
  if (['phone','email'].includes(event.target.id)) { validateField(form.elements.phone); validateField(form.elements.email); }
});
form.addEventListener('change', clearPreparedInquiry);
form.addEventListener('reset', () => {
  clearPreparedInquiry(); document.getElementById('form-error').hidden = true;
  formFields.forEach(input => { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); document.getElementById(`${input.id}-error`).hidden = true; });
});
whatsappPrepare.hidden = !WEBHOOK_URL;
whatsappPrepare.disabled = false;
updateSendButtons();
document.querySelectorAll('[data-intent]').forEach(link => link.addEventListener('click', () => { document.getElementById('interest').value = ['demo','consultation'].includes(link.dataset.intent) ? 'Free consultation' : 'Free automation audit'; clearPreparedInquiry(); }));
let formStarted = false;
form.addEventListener('focusin', () => { if (!formStarted) { formStarted = true; window.AutixAIEvents.track('contact_form_start'); } });
document.querySelectorAll('.hero-visual,.contact-section').forEach(region=>{
  const mesh=document.createElement('div');mesh.className='mesh-art';mesh.setAttribute('aria-hidden','true');region.prepend(mesh);
});

// Keep mobile journeys compact, with the full content available on demand.
const compactLayout = matchMedia('(max-width: 800px)');
const workflowTabs = document.querySelector('.workflow-tabs');
const tabButtons = [...workflowTabs.querySelectorAll('[data-workflow-tab]')];
const workflowCards = [...document.querySelectorAll('.portfolio-card')];
const inquiryDisclosure = document.querySelector('.inquiry-disclosure');
const calculatorDisclosure = document.querySelector('.calculator-disclosure');
let selectedWorkflow = 'leads';

function showWorkflowTab(key, navigate = false) {
  selectedWorkflow = key;
  const compact = compactLayout.matches;
  tabButtons.forEach(button=>{
    const selected=button.dataset.workflowTab===key;
    button.tabIndex=compact || selected?0:-1;
    button.setAttribute('role',compact?'button':'tab');
    if(compact)button.removeAttribute('aria-selected');
    else button.setAttribute('aria-selected',String(selected));
  });
  workflowTabs.setAttribute('role',compact?'group':'tablist');
  workflowTabs.setAttribute('aria-label',compact?'Jump to a workflow':'Choose a business workflow');
  workflowCards.forEach(card=>{
    card.hidden=!compact && card.dataset.workflow!==key;
    if(compact){card.removeAttribute('role');card.removeAttribute('aria-labelledby');card.removeAttribute('tabindex');}
    else {card.setAttribute('role','tabpanel');card.setAttribute('aria-labelledby',`workflow-tab-${card.dataset.workflow}`);card.tabIndex=0;}
  });
  if(!compact && activeWorkflow && activeWorkflow!==key)closeWorkflow();
  if(compact && navigate) {
    const card = document.querySelector(`[data-workflow="${key}"]`);
    card.scrollIntoView({behavior:reducedCardMotion.matches?'instant':'smooth',block:'start'});
    card.querySelector('.portfolio-button').focus({preventScroll:true});
  }
}
function configurePhoneLayout() {
  const compact=compactLayout.matches;
  inquiryDisclosure.open=true;calculatorDisclosure.open=!compact;
  workflowTabs.hidden=false;
  showWorkflowTab(activeWorkflow || selectedWorkflow);
}
tabButtons.forEach((button,index)=>{
  button.addEventListener('click',()=>showWorkflowTab(button.dataset.workflowTab,true));
  button.addEventListener('keydown',event=>{
    let next=index;
    if(event.key==='ArrowRight')next=(index+1)%tabButtons.length;
    else if(event.key==='ArrowLeft')next=(index+tabButtons.length-1)%tabButtons.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabButtons.length-1;
    else return;
    event.preventDefault();showWorkflowTab(tabButtons[next].dataset.workflowTab);tabButtons[next].focus();
  });
});
document.querySelectorAll('a[href="#contact"]').forEach(link=>link.addEventListener('click',()=>{inquiryDisclosure.open=true;}));
compactLayout.addEventListener('change',configurePhoneLayout);
configurePhoneLayout();
// The main lead funnel stays visible, including after keyboard disclosure interactions.
inquiryDisclosure.addEventListener('toggle', () => { if (!inquiryDisclosure.open) inquiryDisclosure.open = true; });

let lastCalculationSummary = '';
document.getElementById('estimate-inquiry').addEventListener('click', () => {
  updateEstimate();
  if (!estimate) return;
  const challenge = document.getElementById('challenge');
  const basis = estimate.mode === 'team' ? `${estimate.employees} people × ${estimate.hoursPerEmployee} repetitive hours/person/week` : `${estimate.tasks} tasks/day × ${estimate.minutes} minutes × ${estimate.days} days/week`;
  const summary = `Automation estimate: ${basis}; ${estimate.weeklyHours.toFixed(1)} manual hours/week; ${estimate.capacity.toFixed(1)} hours/month potentially returned. Currency: ${estimate.currency}. Planning assumptions, not guaranteed savings.`;
  const existing = challenge.value.replace(lastCalculationSummary,'').trim();
  if (existing.length + summary.length + 2 > challenge.maxLength) {
    document.getElementById('calculation-transfer-status').textContent = 'Please shorten your business notes so we can add the calculation.';
    inquiryDisclosure.open = true; challenge.focus(); return;
  }
  challenge.value = [existing,summary].filter(Boolean).join('\n\n');
  lastCalculationSummary = summary;
  document.getElementById('interest').value = 'Find automation opportunities';
  result.hidden = true; inquiryDisclosure.open = true;
  validateField(challenge);
  document.getElementById('calculation-transfer-status').textContent = 'Your calculation has been added to the inquiry below.';
  document.getElementById('contact').scrollIntoView({behavior:reducedCardMotion.matches?'instant':'smooth',block:'start'});
  challenge.focus({preventScroll:true});
});
if (location.hash === '#contact') {
  inquiryDisclosure.open = true;
  const intent = new URLSearchParams(location.search).get('intent');
  if (intent === 'audit') document.getElementById('interest').value = 'Free automation audit';
  if (['demo','consultation'].includes(intent)) document.getElementById('interest').value = 'Free consultation';
  if (intent === 'quote') document.getElementById('interest').value = 'Workflow integrations';
}
if (location.hash === '#estimate') calculatorDisclosure.open = true;
window.addEventListener('hashchange', () => {
  if (location.hash === '#contact') inquiryDisclosure.open = true;
  if (location.hash === '#estimate') calculatorDisclosure.open = true;
});

window.addEventListener('autixai:enquiry-prefill', event => {
  const values = event.detail || {};
  for (const key of ['name','business','industry','phone','email','interest','challenge','tools','preferredContact']) {
    const field = form.elements[key];
    if (!field || typeof values[key] !== 'string' || !values[key] || field.value.trim() && !['interest','preferredContact'].includes(key)) continue;
    const value = values[key].slice(0, field.maxLength > 0 ? field.maxLength : 1800);
    if (field.tagName === 'SELECT' && ![...field.options].some(option => option.value === value)) continue;
    field.value = value;
  }
  clearPreparedInquiry(); inquiryDisclosure.open = true;
  document.getElementById('contact').scrollIntoView({behavior:'instant',block:'start'});
  form.elements.email.focus({preventScroll:true});
});

const startingPoints = {
  discover: {advice:'Start with discovery: map the work, compare effort and value, and choose one useful workflow.', interest:'Find automation opportunities'},
  build: {advice:'Start with a scoped build: check the tools, data, review points, and acceptance criteria before connecting anything.', interest:'Workflow integrations'},
  improve: {advice:'Start with a workflow review: trace failures, compare the workload baseline, and agree the changes worth making.', interest:'Custom AI automation'}
};
const startPoint = document.getElementById('start-point');
startPoint.addEventListener('change', () => { document.getElementById('start-advice').textContent = startingPoints[startPoint.value].advice; });
document.getElementById('start-inquiry').addEventListener('click', () => {
  document.getElementById('interest').value = startingPoints[startPoint.value].interest;
  result.hidden = true;
});

const filmButton = document.getElementById('watch-film');
const film = document.getElementById('workflow-film');
const video = document.getElementById('demo-video');
filmButton.addEventListener('click', () => {
  const open = film.hidden;
  film.hidden = !open; filmButton.setAttribute('aria-expanded', String(open));
  if (!open) { video.pause(); return; }
  const source = video.querySelector('source');
  if (!source.hasAttribute('src')) { source.src = source.dataset.src; video.load(); }
  video.play().catch(() => { document.getElementById('film-status').textContent = 'Use the video controls to play the AutixAI overview.'; });
});
video.addEventListener('error', () => { document.getElementById('film-status').textContent = 'The video could not load. You can read the transcript below or run the interactive workflow demo.'; });
film.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); video.pause(); film.hidden = true; filmButton.setAttribute('aria-expanded','false'); filmButton.focus(); }
});

if('IntersectionObserver' in window) {
  const motion=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-visible',entry.isIntersecting)),{rootMargin:'60px'});
  document.querySelectorAll('.hero-visual,.portfolio-section,.contact-section').forEach(region=>motion.observe(region));
}

// Expose the visible calculator only; no contact data is transmitted by this tool.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'configure_manual_work_estimate',
      title: 'Estimate repetitive work time',
      description: 'Set the visible manual-effort calculator and return hours per week. This estimates existing work, not guaranteed automation savings.',
      inputSchema: { type: 'object', properties: { tasksPerDay: {type:'integer',minimum:1,maximum:100}, minutesPerTask: {type:'integer',minimum:1,maximum:30}, workingDays: {type:'integer',minimum:1,maximum:7} }, required: ['tasksPerDay','minutesPerTask','workingDays'], additionalProperties: false },
      annotations: {readOnlyHint:false,untrustedContentHint:false},
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).some(key => !['tasksPerDay','minutesPerTask','workingDays'].includes(key))) throw new Error('Provide only tasksPerDay, minutesPerTask and workingDays.');
        const values = [input.tasksPerDay, input.minutesPerTask, input.workingDays];
        if (values.some((value,index) => !Number.isInteger(value) || value < 1 || value > [100,30,7][index])) throw new Error('Values must be whole numbers within the calculator ranges.');
        calculatorDisclosure.open = true; setEstimateMode('task');
        values.forEach((value,index) => { calculatorInputs[index].value = String(value); }); updateEstimate();
        return {manualHoursPerWeek:Number((values[0]*values[1]*values[2]/60).toFixed(1)),note:'Current manual effort only; actual savings vary.'};
      }
    }, {signal:lifecycle.signal})).catch(() => {});
    window.addEventListener('pagehide', () => lifecycle.abort(), {once:true});
  } catch { /* All visible controls continue working in unsupported browsers. */ }
}

// Compact content explorers reuse static, search-readable examples.
const content = window.AUTIXAI_CONTENT;
let chosenIndustry = content.industries[0];
document.getElementById('industry-choice').addEventListener('change', event => {
  chosenIndustry = content.industries.find(industry => industry.id === event.target.value) || content.industries[0];
  document.getElementById('industry-title').textContent = `Ideas for ${chosenIndustry.title}`;
  const list = document.getElementById('industry-ideas'); list.replaceChildren();
  chosenIndustry.ideas.forEach(idea => { const li = document.createElement('li'); li.textContent = idea; list.append(li); });
  document.getElementById('industry-status').textContent = `Showing four ideas for ${chosenIndustry.title}.`;
});
document.getElementById('industry-inquiry').addEventListener('click', () => { document.getElementById('industry').value = chosenIndustry.title; });

// One real set of service cards loops without cloned content or duplicate tab stops.
(() => {
  const carousel = document.querySelector('.service-carousel');
  const viewport = carousel.querySelector('.service-viewport');
  const track = carousel.querySelector('.service-track');
  const controls = carousel.querySelector('.service-carousel-controls');
  const pause = carousel.querySelector('[data-service-pause]');
  const status = document.getElementById('service-motion-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let userPaused = false, hovered = false, focused = false, touching = false, visible = false;
  let frame = 0, lastTime = 0, position = viewport.scrollLeft, holdUntil = 0, resumeTimer = 0;
  const motionOff = () => reduced.matches || document.documentElement.hasAttribute('data-motion-paused');
  let cardStep = track.firstElementChild.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
  const stepWidth = () => cardStep;
  const mayRun = () => visible && !document.hidden && !userPaused && !hovered && !focused && !touching && !motionOff() && performance.now() >= holdUntil;
  let cardSlots = [], railWidth = 0, paintFrame = 0, hoverCard = null, pointer = {x:0,y:0};
  const depthProperties = ['--service-yaw','--service-pitch','--service-roll','--service-lift','--service-depth','--service-scale','--shine-x','--shine-y','--shine-alpha'];
  function measureCards() {
    railWidth = viewport.clientWidth;
    const inset = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
    cardSlots = [...track.children].map(card => ({card,left:card.offsetLeft+inset,width:card.offsetWidth}));
  }
  function paintCards() {
    paintFrame = 0;
    const off = motionOff();
    const scroll = viewport.scrollLeft;
    for (const {card,left,width} of cardSlots) {
      const onRail = left+width-scroll > -30 && left-scroll < railWidth+30;
      card.classList.toggle('is-service-visible', onRail && !off);
      if (off || !onRail) {
        depthProperties.forEach(key => card.style.removeProperty(key));
        card.classList.remove('is-service-front');
        continue;
      }
      const relative = Math.max(-1.3,Math.min(1.3,(left+width/2-scroll-railWidth/2)/(railWidth/2)));
      const distance = Math.abs(relative);
      const hoverX = card === hoverCard ? pointer.x : 0;
      const hoverY = card === hoverCard ? pointer.y : 0;
      card.style.setProperty('--service-yaw', `${-relative*20+hoverX*7}deg`);
      card.style.setProperty('--service-pitch', `${4+distance*2-hoverY*5}deg`);
      card.style.setProperty('--service-roll', `${-relative*2}deg`);
      card.style.setProperty('--service-lift', `${-12+distance*18}px`);
      card.style.setProperty('--service-depth', `${26-distance*68}px`);
      card.style.setProperty('--service-scale', String(1-distance*0.045));
      card.style.setProperty('--shine-x', `${50-relative*28+hoverX*25}%`);
      card.style.setProperty('--shine-y', `${25+hoverY*25}%`);
      card.style.setProperty('--shine-alpha', String(0.42-distance*0.13));
      card.classList.toggle('is-service-front', distance < 0.45);
    }
  }
  function queuePaint() { if (!paintFrame) paintFrame = requestAnimationFrame(paintCards); }
  measureCards();

  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function tick(now) {
    frame = 0;
    if (!mayRun()) { lastTime = 0; return; }
    // Bound a resumed frame so a suspended tab cannot jump through the cards.
    const elapsed = lastTime ? Math.min(now - lastTime, 50) : 0;
    lastTime = now;
    position += elapsed * 0.028;
    const step = stepWidth();
    if (step > 0 && position >= step) {
      // Recycle only fully passed cards, preserving the visible position.
      while (position >= step) { track.append(track.firstElementChild); position -= step; }
      measureCards();
    }
    viewport.scrollLeft = position;
    paintCards();
    frame = requestAnimationFrame(tick);
  }
  function update() {
    const off = motionOff();
    pause.disabled = off;
    pause.textContent = off ? 'Motion off' : userPaused ? 'Resume motion' : 'Pause motion';
    pause.setAttribute('aria-pressed', String(userPaused || off));
    const message = off ? 'Automatic scrolling is off. Swipe or use the arrow controls.' : userPaused ? 'Automatic scrolling paused. Swipe or use the arrow controls.' : 'Automatic scrolling pauses while you read, focus a card or swipe.';
    if (status.textContent !== message) status.textContent = message;
    queuePaint();
    if (!mayRun()) stop();
    else if (!frame) { position = viewport.scrollLeft; lastTime = 0; frame = requestAnimationFrame(tick); }
  }
  function hold() {
    holdUntil = performance.now() + 7000;
    clearTimeout(resumeTimer); resumeTimer = setTimeout(update, 7050); update();
  }
  function navigate(direction) {
    hold();
    const end = viewport.scrollWidth - viewport.clientWidth;
    const left = viewport.scrollLeft;
    const target = direction > 0 ? (left >= end - 2 ? 0 : Math.min(end, left + stepWidth())) : (left <= 2 ? end : Math.max(0, left - stepWidth()));
    viewport.scrollTo({ left: target, behavior: motionOff() ? 'instant' : 'smooth' });
  }

  controls.hidden = false;
  pause.addEventListener('click', () => { userPaused = !userPaused; holdUntil = 0; update(); });
  carousel.querySelector('[data-service-prev]').addEventListener('click', () => navigate(-1));
  carousel.querySelector('[data-service-next]').addEventListener('click', () => navigate(1));
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); hold();
    if (event.key === 'Home' || event.key === 'End') viewport.scrollTo({left:event.key === 'Home' ? 0 : viewport.scrollWidth,behavior:motionOff() ? 'instant' : 'smooth'});
    else navigate(event.key === 'ArrowRight' ? 1 : -1);
  });
  carousel.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && finePointer.matches) { hovered = true; update(); } });
  carousel.addEventListener('pointerleave', () => { hovered = false; update(); });
  viewport.addEventListener('focusin', () => { focused = true; update(); });
  viewport.addEventListener('focusout', () => requestAnimationFrame(() => { focused = viewport.contains(document.activeElement); update(); }));
  viewport.addEventListener('pointerdown', () => { touching = true; update(); });
  window.addEventListener('pointerup', () => { if (touching) { touching = false; hold(); } });
  window.addEventListener('pointercancel', () => { touching = false; hold(); });
  viewport.addEventListener('wheel', hold, {passive:true});
  viewport.addEventListener('scroll', () => { if (!frame) queuePaint(); }, {passive:true});
  viewport.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches || motionOff()) return;
    hoverCard = event.target.closest('.service-card');
    if (hoverCard) {
      const rect = hoverCard.getBoundingClientRect();
      pointer = {x:Math.max(-0.5,Math.min(0.5,(event.clientX-rect.left)/rect.width-0.5)),y:Math.max(-0.5,Math.min(0.5,(event.clientY-rect.top)/rect.height-0.5))};
    }
    queuePaint();
  }, {passive:true});
  viewport.addEventListener('pointerleave', () => { hoverCard = null; queuePaint(); });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('resize', () => { cardStep = track.firstElementChild.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0); measureCards(); position = viewport.scrollLeft; update(); }, {passive:true});
  window.addEventListener('autixai:motionchange', update);
  reduced.addEventListener('change', update);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }, {threshold:0.12});
  observer.observe(viewport);
  carousel.querySelectorAll('[data-service-link]').forEach(link => link.addEventListener('click', () => {
    const challenge = document.getElementById('challenge');
    if (!challenge.value.trim()) challenge.value = `I would like to explore ${link.dataset.serviceLink.toLowerCase()} for my business.`;
    clearPreparedInquiry();
  }));
  window.addEventListener('pagehide', () => { stop(); cancelAnimationFrame(paintFrame); paintFrame = 0; clearTimeout(resumeTimer); observer.disconnect(); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { observer.observe(viewport); measureCards(); holdUntil = 0; update(); }
  });
  update();
})();
