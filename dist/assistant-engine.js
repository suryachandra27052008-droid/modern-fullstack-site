// Local conversational branches. No AI service, network requests or persistent storage.
const normal = value => String(value).toLowerCase().normalize('NFKC').replace(/[^a-z0-9]+/g, ' ').trim();
const has = (text, term) => (` ${text} `).includes(` ${normal(term)} `);
const match = (text, groups) => Object.entries(groups).find(([, words]) => words.some(w => has(text, w)))?.[0];
export const MAX_MESSAGE = 1000;
export const MAX_TURNS = 30;

export function createGuide(data) {
  const state = { industryId: '', businessType: '', areaId: '', tools: '', turns: 0, question: 'industry' };
  const area = () => data.areas.find(a => a.id === state.areaId);
  const industry = () => data.industries.find(i => i.id === state.industryId);
  const recommended = () => (data.assistant.industryAreas[state.industryId] || ['leads','whatsapp','support','operations']).map(id => data.areas.find(a => a.id === id));
  const question = type => {
    state.question = type;
    return type === 'industry' ? { question: type, prompt: 'What type of business do you run?' }
      : type === 'area' ? { question: type, prompt: 'Which process would you like to make easier?', choices: recommended() }
      : { question: type, prompt: 'Which tools do you currently use for this?', choices: ['Google Sheets','Shopify','HubSpot','WhatsApp','No tools yet','Other tools'] };
  };
  const next = () => !state.businessType ? question('industry') : !state.areaId ? question('area') : !state.tools ? question('tools') : { offerAudit: true };
  function recommendation() {
    const a = area();
    const service = data.services[data.assistant.areaServices[a.id]];
    return { text: `For ${state.businessType || 'your business'}, a useful starting point could be ${a.title.toLowerCase()}.`,
      workflow: { title: a.title, problem: a.problem, outcome: a.outcome, steps: a.automation.replace(/\.$/, '').split('→').map(s => s.trim()), service: service.title },
      note: data.assistant.reviewNote, ...(state.tools ? { offerAudit: true } : question('tools')) };
  }
  function discover() {
    if (!state.businessType) return { text: state.areaId ? `Let’s explore ${area().title.toLowerCase()} for your business.` : 'Let’s find a practical starting point.', ...question('industry') };
    if (!state.areaId) return { text: industry() ? `For ${industry().title}, some useful possibilities are:\n\n${industry().ideas.map(s => `• ${s}`).join('\n')}` : 'We can start with the repeated work your team handles every day.', ...question('area') };
    return recommendation();
  }
  function toolsReply(value) {
    if (value === 'Other tools') { state.question = 'custom-tools'; return { text: 'Which tools do you use? Type their names below, or choose “No tools yet”.', question: 'tools', prompt: 'Your current tools', choices: ['No tools yet'] }; }
    state.question = '';
    state.tools = value.slice(0, 200);
    return { text: `${state.tools === 'No tools yet' ? 'We can help choose a suitable starting setup.' : `We’d check how ${state.tools} can fit into this workflow.`}\n\n${data.assistant.integrationNote}\n\nWould you like a free automation audit for this workflow?`, offerAudit: true };
  }
  const summaries = () => {
    const a = area();
    return { opportunity: a ? `${a.title}: ${a.outcome}` : 'To be identified in the free audit.',
      summary: `${state.businessType || 'Business type to confirm'}. ${a ? `Interested in ${a.title.toLowerCase()}.` : 'Would like to identify a useful automation.'}${state.tools ? ` Current tools: ${state.tools}.` : ''}` };
  };
  function respond(value, command = '') {
    if (typeof value !== 'string' || !value.trim() || value.length > MAX_MESSAGE) return { error: 'Please enter a message of 1–1,000 characters.' };
    if (state.turns >= MAX_TURNS) return { limited: true, text: 'This guided conversation is full. Start again, or continue directly with AutixAI on WhatsApp.' };
    state.turns++;
    const text = normal(value);
    if (command === 'audit' || /\b(?:free audit|automation audit|get an audit)\b/.test(text)) return { audit: true };
    if (command === 'continue') return { text: 'Choose another workflow, or ask about our services, pricing or integrations.', ...question('area') };
    if (command === 'industry') {
      const selected = data.industries.find(i => i.id === value);
      if (!selected && value !== 'other') return { error: 'Please choose a business type.' };
      state.industryId = selected?.id || 'other'; state.businessType = selected?.title || 'Other / mixed business';
      return discover();
    }
    if (command === 'area') {
      if (!data.areas.some(a => a.id === value)) return { error: 'Please choose a process.' };
      state.areaId = value; return discover();
    }
    if (command === 'tools') {
      return toolsReply(value);
    }
    const faqPatterns = [[/replace.*(?:software|tools)|existing software/,1],[/whatsapp.*\b(?:integrate|connect|work|works)\b|(?:integrate|connect).*whatsapp/,2],[/(?:connect|integrate).*crm/,3],[/(?:work|connect|use).*google sheets/,4],[/(?:ai|automation).*(?:mistake|wrong|error)/,5],[/employees.*control|pause.*automation/,6],[/how long|timeline|how much time/,7],[/start.*one workflow/,8],[/grow later|expand later/,9],[/support after|after launch|maintenance/,10]];
    const faq = faqPatterns.find(([pattern]) => pattern.test(text));
    if (faq) return { text: data.faq[faq[1]].answer, ...next() };
    if (/\b(?:price|pricing|cost|costs|quote|charges|charge|budget)\b/.test(text)) return { text: data.assistant.pricingDescription, link: { href: '/pricing/', label: 'Explore project scopes →' }, offerAudit: true };
    if (/\b(?:security|secure|privacy|gdpr|hipaa|compliance|data protection|certification)\b/.test(text)) return { text: data.assistant.securityDescription, link: { href: '/trust/', label: 'Read our trust & data approach →' } };
    if (/\b(?:how it works|how do you work|your process|project process|project stages|how does it work)\b/.test(text)) return { text: `${data.assistant.process.join(' → ')}\n\n${data.assistant.processDescription}\n\n${data.assistant.auditDescription}`, offerAudit: true };
    if (/\b(?:manpower|staffing|replace employees|savings|save time|save money|reduce staff|team size)\b/.test(text)) return { text: data.assistant.capacityDescription, link: { href: '/#estimate', label: 'Explore the time estimate →' } };
    if (/\b(?:services|what do you do|what is autixai|about autixai)\b/.test(text)) return { text: `AutixAI connects business tools and automates repetitive work. Our services are:\n\n${data.services.map(s => `• ${s.title}`).join('\n')}`, ...next() };
    if (/\b(?:integration|integrations|integrate|connect|compatible|tools supported)\b/.test(text)) return { text: `Example tools include ${data.integrations.map(i => i.name).join(', ')}.\n\n${data.assistant.integrationNote}`, ...next() };
    if (/\b(?:human|real person|contact|call|phone|demo)\b/.test(text)) return { text: `You can talk with the AutixAI team on ${data.contact.displayPhone}, or prepare an audit request here. A demo call can be discussed with the team.`, contact: true, offerAudit: true };
    if (/\b(?:system prompt|api key|password|ignore instructions|ignore previous|environment variables)\b/.test(text)) return { text: 'Please don’t share passwords, API keys or sensitive personal information. I can guide you through business automation ideas using the options here.', ...next() };
    if (state.question === 'custom-tools') return toolsReply(value);
    if (state.question === 'tools' && state.areaId) {
      const found = data.integrations.filter(t => has(text, t.name));
      if (found.length || /\b(?:no tools|none|spreadsheet|excel|google sheets)\b/.test(text)) return toolsReply(found.length ? found.map(t => t.name).join(', ') : value);
    }
    const industryId = match(text, data.assistant.industryKeywords);
    const areaId = match(text, data.assistant.areaKeywords);
    if (industryId) { state.industryId = industryId; state.businessType = industry().title; }
    if (areaId) state.areaId = areaId;
    if (industryId || areaId || /\b(?:what can i automate|show me|start|automation ideas|automate my business)\b/.test(text)) return discover();
    // Unknown free text is never turned into an invented answer or claimed AI inference.
    return { text: 'I’m a guided assistant, so I work best with the choices below. For a question I haven’t covered, the AutixAI team can help.', ...next(), contact: true };
  }
  return { state, respond, summaries, recommended };
}

export function validateAudit(values) {
  const errors = {};
  for (const key of ['name','business','industry','process']) if (!String(values[key] || '').trim()) errors[key] = 'Please fill in this field.';
  const phone = String(values.phone || '').trim(), email = String(values.email || '').trim();
  if (!email) errors.email = 'Add an email address so we can reply.';
  if (['whatsapp','phone'].includes(values.preferredContact) && !phone) errors.phone = 'Add a phone number for your preferred contact method.';
  if (values.preferredContact && !['email','whatsapp','phone'].includes(values.preferredContact)) errors.preferredContact = 'Choose a contact method.';
  if (phone && (!/^[+\d\s().-]{7,25}$/.test(phone) || phone.replace(/\D/g, '').length < 7)) errors.phone = 'Please enter a valid WhatsApp number.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  const lengths = { name: 80, business: 100, industry: 100, process: 600, tools: 200, phone: 25, email: 120, opportunity: 300, summary: 450 };
  for (const [key, max] of Object.entries(lengths)) if (String(values[key] || '').length > max) errors[key] = `Please keep this under ${max} characters.`;
  return errors;
}

export function buildAuditDraft(values) {
  const clean = key => String(values[key] || '').trim();
  return `Hi AutixAI,\n\nI spoke with the AutixAI guided assistant and would like a free automation audit.\n\nName: ${clean('name')}\nBusiness: ${clean('business')}\nIndustry: ${clean('industry')}\nProcess: ${clean('process')}\nCurrent tools: ${clean('tools') || 'To discuss'}\n${clean('phone') ? `WhatsApp: ${clean('phone')}\n` : ''}${clean('email') ? `Email: ${clean('email')}\n` : ''}\nMain automation opportunity:\n${clean('opportunity') || 'To be identified in the free audit.'}\n\nConversation summary:\n${clean('summary') || 'Requested a free automation audit through the guided assistant.'}`;
}
