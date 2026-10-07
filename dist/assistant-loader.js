'use strict';
(() => {
  if (document.getElementById('autixai-launcher')) return;
  const script = document.currentScript;
  const version = new URL(script.src).searchParams.get('v') || '1';
  const whatsapp = script.dataset.whatsapp;
  const button = document.createElement('button');
  button.id = 'autixai-launcher'; button.className = 'autixai-launcher'; button.type = 'button';
  button.setAttribute('aria-label', 'Show me what’s possible — open AutixAI guided assistant');
  button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span class="autixai-launcher-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M8 10h7l8 12M8 22h7l8-12"/><circle cx="7" cy="10" r="3"/><circle cx="7" cy="22" r="3"/><circle cx="24" cy="10" r="3"/><circle cx="24" cy="22" r="3"/></svg></span><span class="autixai-launcher-copy">Show me what’s possible<span>Explore with AutixAI</span></span><span class="autixai-launcher-tooltip" role="tooltip">Ask AutixAI</span>';
  document.body.append(button);
  let widget, loading = false, stylePromise;
  function loadStyle() {
    if (!stylePromise) stylePromise = new Promise((resolve, reject) => {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = `/assistant.css?v=${version}`;
      link.onload = resolve; link.onerror = () => { link.remove(); stylePromise = null; reject(new Error('style_load')); };
      document.head.append(link);
    });
    return stylePromise;
  }
  button.addEventListener('click', async () => {
    if (loading) return;
    if (widget) { widget.open(); return; }
    loading = true; button.setAttribute('aria-busy', 'true');
    let timeout;
    try {
      const controller = new AbortController();
      const deadline = new Promise((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error('load_timeout')); }, 8000); });
      const [module, response] = await Promise.race([Promise.all([import(`/assistant.js?v=${version}`), fetch(`/assistant-data.json?v=${version}`, { signal: controller.signal }), loadStyle()]), deadline]);
      if (!response.ok) throw new Error('content_load');
      const data = await response.json();
      widget = module.createAssistant({ button, data }); widget.open();
    } catch {
      window.AutixAIEvents?.track('assistant_error');
      const fallback = document.createElement('dialog'); fallback.className = 'autixai-fallback';
      const title = document.createElement('h2'); title.textContent = 'AutixAI Assistant';
      const text = document.createElement('p'); text.textContent = 'I’m temporarily unavailable, but you can still talk directly with AutixAI.';
      const audit = document.createElement('a'); audit.className = 'button'; audit.href = '/?intent=audit#contact'; audit.textContent = 'Get Free Automation Audit';
      const chat = document.createElement('a'); chat.className = 'button button-outline'; chat.href = `https://wa.me/${whatsapp}`; chat.target = '_blank'; chat.rel = 'noopener noreferrer'; chat.textContent = 'Talk on WhatsApp';
      const close = document.createElement('button'); close.className = 'button button-outline'; close.type = 'button'; close.textContent = 'Close and try again';
      close.addEventListener('click', () => fallback.close());
      fallback.append(title, text, audit, chat, close); document.body.append(fallback);
      fallback.addEventListener('close', () => { fallback.remove(); button.focus(); }); fallback.showModal();
    } finally { clearTimeout(timeout); loading = false; button.removeAttribute('aria-busy'); }
  });
  // Make room for the phone keyboard while visitors use the main website form.
  const update = () => {
    const active = document.activeElement;
    const usingForm = active?.closest('#inquiry-form,#privacy-request-form');
    button.classList.toggle('autixai-input-active', !!usingForm || (/^(INPUT|TEXTAREA|SELECT)$/.test(active?.tagName || '') && !active.closest('#autixai-assistant')));
  };
  document.addEventListener('focusin', update); document.addEventListener('focusout', () => requestAnimationFrame(update));
})();
