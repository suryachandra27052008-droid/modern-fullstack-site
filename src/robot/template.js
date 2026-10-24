// Shared, authored markup: the React preview and portable embed are identical.
export const companionMarkup = `
  <section class="companion" aria-label="Meet AUTIX 02">
    <header class="companion-header">
      <div class="wordmark"><svg viewBox="0 0 24 28" aria-hidden="true"><path d="M3 23 12 4l9 19M7 17h10" /></svg><span>AUTIX<span class="wordmark-ai">AI</span></span></div>
      <span class="edition">COMPANION <span>02</span></span>
    </header>
    <div class="robot-stage" data-state="loading" aria-busy="true">
      <div class="halo" aria-hidden="true"><span></span></div>
      <div class="ground-shadow" aria-hidden="true"></div>
      <svg class="robot-fallback" viewBox="0 0 500 500" role="img" aria-label="Pearl ivory AUTIX companion with sage eyes">
        <defs><linearGradient id="ivory" x2=".9" y2="1"><stop stop-color="#fffdf6"/><stop offset="1" stop-color="#d5ccba"/></linearGradient></defs>
        <path fill="url(#ivory)" d="M167 243Q250 214 333 243L311 358Q250 401 189 358Z"/>
        <rect x="233" y="215" width="34" height="30" rx="12" fill="#b8bea2"/>
        <rect x="176" y="107" width="148" height="119" rx="43" fill="url(#ivory)"/>
        <rect x="188" y="137" width="124" height="64" rx="27" fill="#dce0cb"/>
        <g fill="#76865e"><rect x="211" y="158" width="15" height="23" rx="7"/><rect x="273" y="158" width="15" height="23" rx="7"/></g>
        <g fill="url(#ivory)"><rect x="128" y="245" width="38" height="109" rx="19" transform="rotate(12 147 245)"/><rect x="334" y="245" width="38" height="109" rx="19" transform="rotate(-12 353 245)"/></g>
      </svg>
      <canvas class="robot-canvas" role="button" tabindex="0" aria-label="Say hello to AUTIX. Click or press Enter to wave." aria-describedby="robot-instructions"></canvas>
      <span class="stage-index" aria-hidden="true">A / 02</span>
      <span class="stage-material" aria-hidden="true">PEARL IVORY<br>OLIVE & SAGE</span>
    </div>
    <footer class="companion-footer">
      <div class="presence"><span class="presence-dot" aria-hidden="true"></span><span class="robot-status" role="status" aria-live="polite">Getting acquainted</span></div>
      <button class="hello-button" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6a8 8 0 0 1-15 4l-3-5a1.5 1.5 0 0 1 2.5-1.5L8 16" /></svg>Say hello<span aria-hidden="true">↗</span></button>
    </footer>
    <p class="robot-instructions" id="robot-instructions">A little presence. A world of possibility.<span>Move your cursor. Make a connection.</span></p>
  </section>`;
