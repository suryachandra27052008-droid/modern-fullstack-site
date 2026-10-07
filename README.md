# AutixAI

Existing static AutixAI website, hosted at https://autixai-site.vercel.app/. Olive, warm beige and light brown surfaces; dark brown outlines; Cinzel headings and self-hosted DM Sans body text. The supplied original logo is used unchanged in the header, footer and favicon.

## Edit and preview

Edit `content/site-content.json` for services, 16 automation areas, 12 industries, FAQ, pricing scopes, integrations, case studies, navigation and contact information. Run `python scripts/update-content.py` to refresh the marked static sections in `dist`, shared header/footer, runtime selector data, metadata, FAQ/Organization schemas, robots.txt and sitemap.xml. Generated sections remain useful to search engines and visitors without JavaScript. The script is a local content-authoring tool; Vercel serves the already-generated `dist` directory without a build or dependency install.

Run `python -m http.server 4175 --bind 127.0.0.1 --directory dist`, then visit http://127.0.0.1:4175/. Static assets use a version query; update `VERSION` in the content script when changing scripts, settings or styles, and regenerate before publishing.

## Visitor experience

- Free automation audit is the main offer. A demo call remains available in the enquiry selector and mobile navigation.
- Seven outcome-focused services; 16 process choices with a problem, workflow and outcome; 12 industries with four relevant ideas each. Phone visitors get compact dropdowns instead of a large button grid.
- Three illustrative workflow cards. Desktop tabs select one; mobile cards stack at 96/112/128px with one focused highlight. Reduced motion and short landscape screens use flat cards. No removed 3D frame section was restored.
- Sales demo progresses through seven stages; support and operations retain four stages. All demos are local simulations. The 36-second film loads its source only on request, with controls, captions and transcript; closing pauses playback.
- Honest example automation cards disclose before, problem, possible automation, potential outcome/impact and example tools. No fake clients, testimonials, figures or results are used. Use `kind: "verified"` only for an actual project; optional `company` and `hoursSaved` fields then become visible. Substantiate all published outcomes first.
- Four connected project stages with expandable deliverables; practical differentiators and expandable security principles. Pricing has three scope categories, cost drivers and individually agreed quotes, with no invented fixed prices.
- Twelve FAQs; six additional questions sit in a disclosure to keep the page compact on phones.
- Five pages: home, pricing, trust, privacy and website terms. Legal notices describe actual website behavior; project-specific commercial and data terms are agreed separately.

## Calculator

Choose team workload (people × repetitive hours/person/week) or one task (tasks/day × minutes/task × working days ÷ 60). Monthly hours use 52/12 weeks; annual values use 52 weeks. Estimated automatable percentage gives potential capacity returned; value multiplies that capacity by the visitor's hourly staff cost. Optional visitor-entered setup and recurring costs give illustrative net capacity value and payback. Capacity value is not necessarily cash saved or a staffing reduction. These are estimates; actual results depend on the workflow and implementation.

INR and USD have separate editable cost scenarios, with example starting rates of ₹250 and $25. Switching preserves each scenario's assumptions without FX conversion. The enquiry handoff appends the current summary once, preserves existing notes and protects the maximum field length. A local WebMCP tool can configure the task model; it transmits no data.

## Contact and optional integrations

`content/site-content.json` contains the real business number and optional email/socials. Leave unknown email/socials empty; unconfigured links are omitted. `dist/site-config.js` is public configuration, never a place for secrets:

- `webhookUrl`: optional public HTTPS JSON endpoint. Preparing an enquiry never sends to it. After viewing the preview, a visitor must explicitly select the separate direct-send button. The endpoint must allow the site's origin through CORS, validate input and implement suitable spam/duplicate controls. Fields: name, business, industry, phone, optional email, interest, challenge, optional teamSize/timeSpent/tools, source and submittedAt. The page confirms receipt only for successful responses; error/timeout keeps WhatsApp and calling available. Localhost HTTP is accepted only while previewing on localhost for synthetic QA.
- `calendarUrl`: optional HTTPS booking-provider URL. A real configured link appears after preparing a draft; the form itself does not book a slot.
- `founderName` / `linkedinUrl`: optional verified founder information. The current card identifies the AutixAI team until details are supplied.
- `caseStudy`: retained optional `{title,result}` for the existing verified-build callout. Detailed project cards live in the content file.
- `analyticsEnabled`: false by default. No analytics requests, cookies, IDs or form storage are added. To integrate analytics, define a consent-aware `window.AUTIXAI_ANALYTICS_HANDLER(eventName)` and explicitly enable the setting; update privacy notices before activating it. The handler receives only a fixed event name, never contact, business, calculator or free-text values. Handler errors cannot block normal actions.

Events: hero_cta, automation_audit_click, whatsapp_click, contact_form_start, audit_request_prepared, contact_form_complete, calculator_usage, service_card_click, pricing_enquiry. The completion event means successful direct receipt or opening a prepared WhatsApp draft; it cannot confirm that the visitor tapped Send in WhatsApp. Calculator input events may be frequent; debounce/batch them in the chosen integration.

The form collects the process and industry, with optional workload/tool fields in a disclosure. It validates locally and shows the exact structured WhatsApp draft before opening WhatsApp. Visitors tap Send there themselves. Neither the form nor calculator saves inputs in browser storage. Webhook notices update on home, trust and privacy pages when a valid endpoint is configured. Test both direct receipt and error/timeout paths against the real service before enabling it publicly.

## Guided assistant

The floating “Show me what’s possible” capsule opens a local guided consultant. It uses pre-written branching, not a live AI model, so there are no AI API calls, keys, provider fees or server-side chat endpoint. The header and privacy notice disclose this. The launcher loads first; widget JavaScript, styling and public knowledge load on the first explicit click. No auto-opening, sounds, timed nudges or background chat polling.

Choose a business type, a process and current tools to see an animated illustrative workflow, relevant service and free audit offer. All 12 industries and 16 processes are available; an additional “Other / mixed business” choice uses common process ideas. Keywords also recognize common typed questions, with source-backed answers for services, pricing, integrations, project stages, security and FAQs. Unknown requests are redirected to choices or the human team rather than presented as generated AI answers. “Other tools” accepts a visitor-entered tool description. Actual feasibility, permissions, provider plans and human review still need discovery.

`content/site-content.json` remains the business knowledge source; its `assistant` object contains additional explanations, routing keywords and recommended process IDs. `scripts/update-content.py` generates `dist/assistant-data.json`, updates cache versions and adds one launcher script on all five pages. `dist/assistant-engine.js` contains pure branching and draft validation; `assistant.js` handles the dialog and audit UI; `assistant.css` loads on demand. Run `npm test` for the branch, knowledge, bounds and handoff checks. `npm run dev` starts the static local preview. No packages need installing.

Conversation context and audit fields stay in memory in the current page only. Minimise/close retains them; Reset, reload, navigation or tab closure clears them. There is no localStorage, sessionStorage, chat cookie or full-transcript analytics. Messages are limited to 1,000 characters and 30 turns per conversation to keep the local UI bounded; Reset starts a fresh guide. This is a local UX limit, not a claim of API rate limiting. Output comes from bounded published content, with no HTML rendering of visitor messages.

The assistant audit form requires name, business, business type, process and **either** a valid WhatsApp number **or** email. Current tools are optional. Selected workflow context fills editable opportunity/summary fields; the full conversation is never appended. Preparing the request builds an exact WhatsApp preview and sends nothing. Any edit invalidates the old handoff. The visitor explicitly opens WhatsApp, then reviews and taps Send there. It reuses the centrally configured business WhatsApp destination; it does not silently post to the optional enquiry webhook.

Native dialog focus containment, Escape/close focus return, labelled controls, inline errors, Enter/Shift+Enter, replay, reset and reduced motion are supported. Mobile uses safe areas and visualViewport height updates to keep the composer available as the viewport changes. The site launcher gets out of the way while a main-page field is focused on a phone. A load failure offers the existing audit and WhatsApp routes. Analytics remains off by default; optional assistant events send fixed names only: assistant_opened, assistant_message_sent, assistant_quick_action_clicked, assistant_audit_requested, assistant_whatsapp_handoff, assistant_error. Handoff events mean a link was opened, not that a WhatsApp message was sent.

## Hosting and assets

`vercel.json` serves `dist` with no framework, build or install. `.vercelignore` excludes source-branding files, local scripts and metadata. All five pages have canonical URLs, social metadata and Organization schema. Home FAQPage data comes from the same FAQ source as the visible answers. Search engine enhanced display is not guaranteed.

Body and heading fonts are self-hosted with licenses in `dist/fonts`; no external font service is loaded. Social preview is the existing 1200×630 `dist/assets/og-preview.png`. The original supplied logo is `dist/branding/autixai-logo-original.jpg`. No stock client logos, fabricated trust signals, heavy animation library or new runtime dependency was added. The film source renderer is retained at `scripts/render-workflow-film.py` and excluded from deployment.
