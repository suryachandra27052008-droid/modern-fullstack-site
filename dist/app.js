'use strict';
const calculatorInputs = ['tasks', 'minutes', 'days'].map(id => document.getElementById(id));
const costInputs = ['hourly-cost', 'coverage', 'setup-cost', 'running-cost'].map(id => document.getElementById(id));
const rupees = new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0});
function updateEstimate() {
  const [tasks, minutes, days] = calculatorInputs.map(input => Number(input.value));
  const valid = [...calculatorInputs, ...costInputs].every(input => input.validity.valid);
  document.getElementById('estimate-error').hidden = valid;
  document.getElementById('estimate-results').hidden = !valid;
  if (!valid) return;
  const [hourlyCost, coverage, setupCost, runningCost] = costInputs.map(input => Number(input.value));
  const weeklyHours = tasks * minutes * days / 60;
  const monthlyHours = weeklyHours * 4.33;
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
  document.getElementById('manual-cost-result').textContent = rupees.format(monthlyHours * hourlyCost);
  document.getElementById('capacity-result').textContent = `${capacity.toFixed(1)} hours`;
  document.getElementById('capacity-value-result').textContent = rupees.format(capacityValue);
  document.getElementById('net-value-result').textContent = hasCosts ? rupees.format(netValue) : 'Add both cost estimates';
  document.getElementById('payback-result').textContent = !hasCosts ? 'Add both cost estimates' : setupCost === 0 ? 'No setup cost' : netValue <= 0 ? 'Not recovered at these inputs' : `${(setupCost / netValue).toFixed(1)} months`;
}
[...calculatorInputs, ...costInputs].forEach(input => input.addEventListener('input', updateEstimate));
updateEstimate();

const workflows = {
  leads: { title: 'From new inquiry to qualified opportunity.', description: 'Connect your lead sources to your sales process. Repeat follow-ups can run automatically, with opt-out rules and a clear handover to your team.', interest: 'Sales and lead automation', steps: [ ['Capture the inquiry', 'Receive a lead from a website form, WhatsApp, or email.'], ['Qualify with AI', 'Collect useful details and identify the prospect’s needs.'], ['Update your CRM', 'Create or update the record and assign the right owner.'], ['Follow up thoughtfully', 'Send an appropriate next step and notify your sales team.'] ] },
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
demoVisual.innerHTML = `<svg viewBox="0 0 800 100" xmlns="http://www.w3.org/2000/svg"><path class="demo-route" d="M60 50H740"/><path class="demo-route-active" d="M60 50H740" pathLength="100"/>${[60,286.67,513.33,740].map((x,i)=>`<g class="demo-node"><circle class="node-halo" cx="${x}" cy="50" r="30"/><circle cx="${x}" cy="50" r="23"/><text x="${x}" y="51">0${i+1}</text></g>`).join('')}<circle class="demo-packet" cx="60" cy="50" r="5"/></svg><div class="demo-labels"><span></span><span></span><span></span><span></span></div>`;
document.getElementById('detail-description').after(demoVisual);
const demoNodes = [...demoVisual.querySelectorAll('.demo-node')];
const demoRoute = demoVisual.querySelector('.demo-route-active');
const demoPacket = demoVisual.querySelector('.demo-packet');
const demoLabels = {leads:['Capture','Qualify','CRM sync','Follow-up'],support:['Question','Knowledge','Answer','Handover'],operations:['Document','Extract','Review','Update']};
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
  demoVisual.querySelectorAll('.demo-labels span').forEach((label,i)=>{label.textContent=demoLabels[key][i];});
  const list = document.getElementById('detail-steps'); list.replaceChildren();
  data.steps.forEach(([title, description], index) => { const li = document.createElement('li'); const number = document.createElement('span'); number.textContent = `0${index + 1}`; const strong = document.createElement('strong'); strong.textContent = title; const p = document.createElement('p'); p.textContent = description; li.append(number, strong, p); list.append(li); });
  workflowButtons.forEach(button => { const selected = button.dataset.workflowButton === key; button.setAttribute('aria-expanded', String(selected)); button.closest('.portfolio-card').classList.toggle('active', selected); button.querySelector('span').textContent = selected ? '−' : '+'; });
  detail.hidden = false; detail.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
}
workflowButtons.forEach(button => button.addEventListener('click', () => openWorkflow(button.dataset.workflowButton)));
document.getElementById('close-workflow').addEventListener('click', () => { const key = activeWorkflow; closeWorkflow(); document.querySelector(`[data-workflow-button="${key}"]`)?.focus({preventScroll:true}); });
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
    steps[index].classList.add('current');demoNodes[index].classList.add('current');demoRoute.style.strokeDashoffset=String(100-index/3*100);demoPacket.style.cx=`${60+index/3*680}px`;
    status.textContent=`Demo step ${index+1} of 4: ${workflows[activeWorkflow].steps[index][0]}`;
    index++;demoTimer=setTimeout(next,matchMedia('(prefers-reduced-motion: reduce)').matches?350:1200);
  };
  next();
});
document.getElementById('workflow-inquiry').addEventListener('click', () => { if (activeWorkflow) { inquiryDisclosure.open = true; result.hidden = true; document.getElementById('interest').value = workflows[activeWorkflow].interest; document.getElementById('challenge').focus({ preventScroll:true }); } });

if (matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
  document.querySelectorAll('.portfolio-card').forEach(card => { card.addEventListener('pointermove', event => { const bounds = card.getBoundingClientRect(); const x = (event.clientX - bounds.left) / bounds.width - .5; const y = (event.clientY - bounds.top) / bounds.height - .5; card.style.transform = `translateY(-7px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`; }); card.addEventListener('pointerleave', () => { card.style.transform = ''; }); });
}

// Touch screens get a scroll reveal and a small perspective lift in place of hover.
const mobileCardMedia = matchMedia('(max-width: 800px)');
const reducedCardMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scrollCards = [...document.querySelectorAll('.portfolio-card, .time-calculator, .inquiry-form')];
let stopMobileCardEffects = () => {};
function configureMobileCardEffects() {
  stopMobileCardEffects();
  scrollCards.forEach(card => { card.classList.remove('mobile-scroll-card', 'is-revealed', 'is-in-focus'); card.style.removeProperty('--card-drift'); card.style.removeProperty('--card-tilt'); });
  if (!mobileCardMedia.matches || reducedCardMotion.matches || !('IntersectionObserver' in window)) return;
  const visibleCards = new Set();
  let frame = 0;
  const render = () => {
    frame = 0;
    const height = window.innerHeight;
    const positions = [...visibleCards].map(card => { const bounds = card.getBoundingClientRect(); return {card, progress:Math.max(-1, Math.min(1, (bounds.top + bounds.height / 2 - height / 2) / (height / 2)))}; });
    positions.forEach(({card, progress}) => { card.style.setProperty('--card-drift', `${(progress * 5).toFixed(2)}px`); card.style.setProperty('--card-tilt', `${(-progress * 2.5).toFixed(2)}deg`); });
  };
  const requestFrame = () => { if (!frame) frame = requestAnimationFrame(render); };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { const card = entry.target; if (entry.isIntersecting) { card.classList.add('is-revealed'); visibleCards.add(card); } else { visibleCards.delete(card); } card.classList.toggle('is-in-focus', entry.isIntersecting && entry.intersectionRatio > .35); });
    requestFrame();
  }, {threshold:[0,.15,.35,.6],rootMargin:'0px 0px -6% 0px'});
  scrollCards.forEach(card => { card.classList.add('mobile-scroll-card'); observer.observe(card); });
  window.addEventListener('scroll', requestFrame, {passive:true});
  window.addEventListener('resize', requestFrame, {passive:true});
  stopMobileCardEffects = () => { observer.disconnect(); visibleCards.clear(); cancelAnimationFrame(frame); window.removeEventListener('scroll', requestFrame); window.removeEventListener('resize', requestFrame); };
}
mobileCardMedia.addEventListener('change', configureMobileCardEffects);
reducedCardMotion.addEventListener('change', configureMobileCardEffects);
configureMobileCardEffects();

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
form.querySelector('[type="submit"]').disabled = false;
document.querySelectorAll('[data-intent="demo"]').forEach(link => link.addEventListener('click', () => { document.getElementById('interest').value = 'Book a demo call'; result.hidden = true; }));
document.querySelectorAll('.hero-visual,.contact-section').forEach(region=>{
  const mesh=document.createElement('div');mesh.className='mesh-art';mesh.setAttribute('aria-hidden','true');region.prepend(mesh);
});

// Keep mobile journeys compact, with the full content available on demand.
const compactLayout = matchMedia('(max-width: 800px)');
const serviceRows = [...document.querySelectorAll('details.service')];
const workflowTabs = document.querySelector('.workflow-tabs');
const tabButtons = [...workflowTabs.querySelectorAll('[data-workflow-tab]')];
const workflowCards = [...document.querySelectorAll('.portfolio-card')];
const inquiryDisclosure = document.querySelector('.inquiry-disclosure');
const calculatorDisclosure = document.querySelector('.calculator-disclosure');
let selectedWorkflow = 'leads';

function showWorkflowTab(key) {
  selectedWorkflow = key;
  tabButtons.forEach(button=>{const selected=button.dataset.workflowTab===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  workflowCards.forEach(card=>{
    card.hidden=card.dataset.workflow!==key;
    card.setAttribute('role','tabpanel');card.setAttribute('aria-labelledby',`workflow-tab-${card.dataset.workflow}`);card.tabIndex=0;
  });
  if(activeWorkflow && activeWorkflow!==key)closeWorkflow();
}
function configurePhoneLayout() {
  const compact=compactLayout.matches;
  serviceRows.forEach(row=>{row.open=!compact;row.querySelector('summary').tabIndex=compact?0:-1;});
  inquiryDisclosure.open=!compact;calculatorDisclosure.open=!compact;
  workflowTabs.hidden=false;
  showWorkflowTab(activeWorkflow || selectedWorkflow);
}
serviceRows.forEach(row=>row.addEventListener('toggle',()=>{
  if(compactLayout.matches && row.open)serviceRows.forEach(other=>{if(other!==row)other.open=false;});
}));
tabButtons.forEach((button,index)=>{
  button.addEventListener('click',()=>showWorkflowTab(button.dataset.workflowTab));
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
if (location.hash === '#contact') {
  inquiryDisclosure.open = true;
  const intent = new URLSearchParams(location.search).get('intent');
  if (intent === 'demo') document.getElementById('interest').value = 'Book a demo call';
  if (intent === 'quote') document.getElementById('interest').value = 'Workflow integrations';
}
if (location.hash === '#estimate') calculatorDisclosure.open = true;
window.addEventListener('hashchange', () => {
  if (location.hash === '#contact') inquiryDisclosure.open = true;
  if (location.hash === '#estimate') calculatorDisclosure.open = true;
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
  video.play().catch(() => { document.getElementById('film-status').textContent = 'Use the video controls to play. Illustrative workflow; no live data.'; });
});
video.addEventListener('error', () => { document.getElementById('film-status').textContent = 'The video could not load. You can read the transcript below or run the interactive workflow demo.'; });

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
        calculatorDisclosure.open = true;
        values.forEach((value,index) => { calculatorInputs[index].value = String(value); }); updateEstimate();
        return {manualHoursPerWeek:Number((values[0]*values[1]*values[2]/60).toFixed(1)),note:'Current manual effort only; actual savings vary.'};
      }
    }, {signal:lifecycle.signal})).catch(() => {});
    window.addEventListener('pagehide', () => lifecycle.abort(), {once:true});
  } catch { /* All visible controls continue working in unsupported browsers. */ }
}
