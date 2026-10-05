'use strict';
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#mobile-nav');
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') === 'true'; toggle.setAttribute('aria-expanded', String(!open)); toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation'); nav.hidden = open; });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); }));

const calculatorInputs = ['tasks', 'minutes', 'days'].map(id => document.getElementById(id));
function updateEstimate() {
  const [tasks, minutes, days] = calculatorInputs.map(input => Number(input.value));
  document.getElementById('tasks-output').textContent = String(tasks);
  document.getElementById('minutes-output').textContent = `${minutes} min`;
  document.getElementById('days-output').textContent = String(days);
  document.getElementById('hours-result').replaceChildren(document.createTextNode((tasks * minutes * days / 60).toFixed(1)));
  const units = document.createElement('span'); units.textContent = ' hours / week';
  document.getElementById('hours-result').appendChild(units);
}
calculatorInputs.forEach(input => input.addEventListener('input', updateEstimate));
updateEstimate();

const workflows = {
  leads: { title: 'From new inquiry to qualified opportunity.', description: 'Connect your lead sources to your sales process. Repeat follow-ups can run automatically, with opt-out rules and a clear handover to your team.', interest: 'Sales and lead automation', steps: [ ['Capture the inquiry', 'Receive a lead from a website form, WhatsApp, or email.'], ['Qualify with AI', 'Collect useful details and identify the prospect’s needs.'], ['Update your CRM', 'Create or update the record and assign the right owner.'], ['Follow up thoughtfully', 'Send an appropriate next step and notify your sales team.'] ] },
  support: { title: 'A faster answer. A thoughtful handover.', description: 'An assistant uses your approved business knowledge to respond to routine questions. When a request needs judgement or the answer is unclear, it hands over with the conversation context.', interest: 'AI customer support', steps: [ ['Receive the question', 'Capture a customer request through your connected channel.'], ['Find relevant knowledge', 'Look up information in your approved business resources.'], ['Answer or escalate', 'Respond to supported questions; route exceptions to a person.'], ['Keep the context', 'Log the conversation so the team can pick up smoothly.'] ] },
  operations: { title: 'Turn paperwork into a connected process.', description: 'Extract details from incoming documents, flag missing information, and send records for review. After approval, update the connected system and notify the people who need to know.', interest: 'Reporting and operations', steps: [ ['Receive a document', 'An attachment or connected upload triggers the workflow.'], ['Extract and check', 'Read relevant fields and flag missing or inconsistent details.'], ['Request human approval', 'A team member reviews the details before committing changes.'], ['Update and notify', 'Write the approved record and send the next task or alert.'] ] }
};
const detail = document.getElementById('workflow-detail');
const workflowButtons = document.querySelectorAll('[data-workflow-button]');
const runButton = document.getElementById('run-demo');
const status = document.getElementById('demo-status');
let activeWorkflow = null;
let demoTimer = null;
function resetDemo() { clearTimeout(demoTimer); runButton.disabled = false; runButton.textContent = 'Run workflow demo'; status.textContent = 'Run the demo to see how the steps connect.'; }
function closeWorkflow() { resetDemo(); detail.hidden = true; activeWorkflow = null; workflowButtons.forEach(button => { button.setAttribute('aria-expanded', 'false'); button.closest('.portfolio-card').classList.remove('active'); button.querySelector('span').textContent = '+'; }); }
function openWorkflow(key) {
  if (activeWorkflow === key && !detail.hidden) { closeWorkflow(); return; }
  resetDemo(); activeWorkflow = key; const data = workflows[key];
  document.getElementById('detail-title').textContent = data.title;
  document.getElementById('detail-description').textContent = data.description;
  const list = document.getElementById('detail-steps'); list.replaceChildren();
  data.steps.forEach(([title, description], index) => { const li = document.createElement('li'); const number = document.createElement('span'); number.textContent = `0${index + 1}`; const strong = document.createElement('strong'); strong.textContent = title; const p = document.createElement('p'); p.textContent = description; li.append(number, strong, p); list.append(li); });
  workflowButtons.forEach(button => { const selected = button.dataset.workflowButton === key; button.setAttribute('aria-expanded', String(selected)); button.closest('.portfolio-card').classList.toggle('active', selected); button.querySelector('span').textContent = selected ? '−' : '+'; });
  detail.hidden = false; detail.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
}
workflowButtons.forEach(button => button.addEventListener('click', () => openWorkflow(button.dataset.workflowButton)));
document.getElementById('close-workflow').addEventListener('click', () => { const key = activeWorkflow; closeWorkflow(); document.querySelector(`[data-workflow-button="${key}"]`)?.focus({preventScroll:true}); });
runButton.addEventListener('click', () => {
  if (!activeWorkflow) return;
  clearTimeout(demoTimer); runButton.disabled = true; runButton.textContent = 'Demo running…';
  const steps = [...document.querySelectorAll('#detail-steps li')]; steps.forEach(step => step.classList.remove('current', 'done'));
  let index = 0;
  const next = () => { if (index > 0) { steps[index - 1].classList.remove('current'); steps[index - 1].classList.add('done'); } if (index === steps.length) { status.textContent = 'Demo complete. This simulation did not send messages or change any business data.'; runButton.disabled = false; runButton.textContent = 'Run again'; return; } steps[index].classList.add('current'); status.textContent = `Demo step ${index + 1} of 4: ${workflows[activeWorkflow].steps[index][0]}`; index++; demoTimer = setTimeout(next, matchMedia('(prefers-reduced-motion: reduce)').matches ? 350 : 900); };
  next();
});
document.getElementById('workflow-inquiry').addEventListener('click', () => { if (activeWorkflow) { document.getElementById('interest').value = workflows[activeWorkflow].interest; document.getElementById('challenge').focus({ preventScroll:true }); } });

if (matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
  document.querySelectorAll('.portfolio-card').forEach(card => { card.addEventListener('pointermove', event => { const bounds = card.getBoundingClientRect(); const x = (event.clientX - bounds.left) / bounds.width - .5; const y = (event.clientY - bounds.top) / bounds.height - .5; card.style.transform = `translateY(-7px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`; }); card.addEventListener('pointerleave', () => { card.style.transform = ''; }); });
}

const form = document.getElementById('inquiry-form');
const result = document.getElementById('inquiry-result');
function prepareInquiry() {
  const values = Object.fromEntries(new FormData(form));
  const message = ['Hi AutixAI! I’d like to discuss automation for my business.', '', `Name: ${values.name.trim()}`, `Business: ${values.business.trim()}`, `Phone: ${values.phone.trim()}`, ...(values.email.trim() ? [`Email: ${values.email.trim()}`] : []), `Interested in: ${values.interest}`, '', `About my business / what I’d like to automate:`, values.challenge.trim()].join('\n');
  document.getElementById('inquiry-preview').textContent = message;
  document.getElementById('send-inquiry').href = `https://wa.me/919617310042?text=${encodeURIComponent(message)}`;
  result.hidden = false;
  result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
}
form.addEventListener('submit', event => { event.preventDefault(); if (form.reportValidity()) prepareInquiry(); });
form.addEventListener('input', () => { result.hidden = true; });
document.querySelectorAll('[data-intent="demo"]').forEach(link => link.addEventListener('click', () => { document.getElementById('interest').value = 'Book a demo call'; result.hidden = true; }));
document.getElementById('year').textContent = String(new Date().getFullYear());

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
        values.forEach((value,index) => { calculatorInputs[index].value = String(value); }); updateEstimate();
        return {manualHoursPerWeek:Number((values[0]*values[1]*values[2]/60).toFixed(1)),note:'Current manual effort only; actual savings vary.'};
      }
    }, {signal:lifecycle.signal})).catch(() => {});
    window.addEventListener('pagehide', () => lifecycle.abort(), {once:true});
  } catch { /* All visible controls continue working in unsupported browsers. */ }
}
