# P0 implementation record — 8 October 2026

## Audit

- Complete application found at `autixai-site`: 22 existing commits, handwritten `dist` frontend, source content, generators, fonts/licences, original branding/media and tests. The deploy directory also contains editable original frontend source; no missing React/compiled-only application was assumed or reconstructed.
- Target GitHub repository was empty, authenticated account matched `suryachandra27052008-droid`, and no remote existed locally. `origin` now targets `modern-fullstack-site`; existing history and main are preserved without a force push.
- Existing Vercel project verified: `autixai-site`, `prj_D6XqIqV6yRWb6Jp32zOogymz2LRz`, Node 24, output `dist`, existing production domain preserved. No second project created.
- No runtime dependencies. Added a dependency-free Node verification build, local frontend/API dev server, lockfile and GitHub CI. Required build tooling/tests remain in Vercel uploads; local runtime metadata and all environment files are excluded. `.env.example` has empty credentials only.
- No credential-signature matches found in current tracked text or the 22 existing commits. `.env.local`, Vercel metadata and local Sites metadata are ignored. This is a scoped pattern audit, not a guarantee that arbitrary secret formats can be detected.

## Implemented behavior

- `/api/lead`: input validation, allowlisting, length/body limits, origin/content-type checks, honeypot rejection, HMAC fingerprinting, in-flight/duplicate/uncertain receipt states, provider timeouts and explicit acceptance checks. Private configuration stays on the server; the compatibility path exposes only the provider's public form alias and reviewed payload to the submitting browser.
- Existing activated FormSubmit/Gmail delivery reused. A local real-handler test returned 201, but production FormSubmit server requests returned HTTP 403. Added an opt-in browser handoff only after that definite rejection and successful server validation. A labelled production browser test then received actual FormSubmit HTTP 200 and JSON success, and displayed confirmation. No frontend success is inferred from the backend 502 handoff itself. The owner had already verified inbox receipt on the previous route; later provider acceptance alone does not prove inbox receipt.
- Published Vercel WAF rule limits POST `/api/lead` to five requests per IP per 600 seconds. Platform counters are per region. Optional atomic Redis adapter is implemented but no database credentials were supplied; cross-instance duplicate prevention is not claimed in the current email-only mode.
- Main and existing guided assistant forms use the same endpoint. Assistant fields are editable and prefilled from the selected business/workflow/tools; reviewed fields can continue to the main form in memory. Full chat is never submitted or placed in a URL. Existing chat, design, animations, keyboard dialog and mobile layout preserved.
- Central booking resolver covers header, hero, services, pricing, contact and assistant. No real event URL exists, so wording is “Request a Free Consultation”. A real verified Cal.com/Calendly event link activates “Book a Free Consultation”; no slots, confirmed appointments or calendar credentials fabricated.
- WhatsApp still opens an actual conversation with a reviewed draft. Opening it creates no backend delivery and never emits the form-completion event.
- Prepared private authenticated n8n intake template, transactional lead/outbox/follow-up schema and integration setup instructions. The template is inactive; customer acknowledgements, CRM sync and scheduled follow-up notifications are not connected.

## Executed checks

| Check | Result |
| --- | --- |
| `npm run build` | Passed all 33 tests, JS syntax and eight-page local link/asset checks. |
| Clean checkout | Cloned committed source into a separate directory; `npm ci --ignore-scripts` and `npm run build` passed with no credentials or local metadata, including the final email compatibility implementation. |
| Failed build gate | A temporary deliberately failing test in that clean clone returned exit code 1 from the build. Removed the probe; the clone remained unchanged. No failing build was published. |
| GitHub | Full preserved history pushed to `main` in `suryachandra27052008-droid/modern-fullstack-site`. Initial CI run 37821087284 passed on `b1a0aa6`; compatibility CI run 37822310699 passed all 33 tests on `e467f2e`. |
| Vercel preview | Deployment `dpl_2fLkyrhev1wDSFoqG4uBX9g37AEv` built successfully, ran all 31 checks and discovered `api/lead` as a Node function. |
| Deployment connection | Existing project connected to the GitHub repository; Vercel project API confirms production branch `main` and Git deployments enabled. PR preview support is enabled through this connection; a real PR has not been opened for testing. |
| Automatic production deployment | Connected Git push `90fb3f7` triggered deployment `dpl_Gig8C98c8GPEyj6RBSZCgGAkAaov` with the preserved production alias. Compatibility commit `e467f2e` automatically produced ready deployment `dpl_65oPDZsHJgvbqp2CZcrAoALgRwSa` (`autixai-site-8rw3mh232-suryachandra27052008-3423s-projects.vercel.app`). |
| Backend acceptance/validation | Executed required fields, malformed email/JSON, content type, hostile/missing Origin, oversized request, phone preference, numeric bounds and honeypot rejection. |
| Delivery/duplicate cases | Executed explicit provider receipt, false/missing/HTML receipts, activation-required, network uncertainty, known rejection/retry, concurrent duplicate and repeated accepted submission. |
| Unconfigured/degraded cases | Executed missing settings, disabled preview, unavailable store and shared rate-limit rejection. No false success. |
| Provider integration | Local real-handler FormSubmit accepted; cloud server delivery failed with HTTP 403. Production browser compatibility handoff passed with HTTP 200 and JSON success. Repeated click showed “already submitted” and created zero additional API/provider requests. Webhook/Redis used injected transports; no live n8n/Redis provisioned. |
| Desktop | All eight pages at 1280×900: correct identity, meaningful content, no framework overlay or horizontal overflow. |
| Phone | All eight pages at 320×640 and main flows at 360×844. Fixed a narrow header overflow caused by the longer consultation label; rechecked the fix. |
| Main form | Required-field focus, valid synthetic submission, current-page duplicate, known delivery failure with preserved inputs and separate WhatsApp handoff exercised. |
| Assistant | Retail → inventory → Google Sheets → editable audit → synthetic backend acceptance → main form prefill exercised. |
| Regression | Mobile menu/Escape, calculator 20×5×5 = 8.3 manual hours/week and enquiry summary handoff, workflow demo start and close, reduced-motion flat card layout exercised. |
| Browser console | No application exceptions in the final page smoke pass. Earlier deliberate delivery failures generated expected failed-request diagnostics. |
| Final production pass | All eight pages had correct content/identity and no phone-width horizontal overflow. Main production email acceptance and duplicate-click guard verified; existing assistant opened and its consultation action displayed the editable request form with the compatibility disclosure. |

Initial browser testing used the Codex in-app browser and a temporary local delivery stub outside the repository; no synthetic customer message was emailed or sent on WhatsApp during that local pass. Later production testing sent one labelled setup enquiry through the activated FormSubmit route; no WhatsApp message was sent. Screenshots are outside the repository.

## External dependencies and verification limits

- Owner must create/configure a real consultation event, connect the real calendar and verify its availability/confirmation before setting `calendarVerified:true`.
- Current default duplicate cache is warm-instance memory only. Add existing Upstash REST credentials for shared claims/counters, or activate the documented idempotent durable automation destination. FormSubmit cannot provide an atomic exactly-once transaction with Redis.
- Fully private server delivery is blocked by FormSubmit's production HTTP 403. The working compatibility route uses its public browser endpoint after validation; external callers can still address that separate public endpoint directly, just as on the previously working site. It cannot enforce this site's WAF/validation or authenticate its receipt back to the server. Delegated enquiries are held as uncertain on the server, never marked accepted there. Obtain a provider-supported server route or configure the documented private webhook/API email destination before describing this as end-to-end server delivery.
- Owner chose to keep existing email delivery and has no n8n/CRM/Redis account configured. n8n/Postgres credentials, transactional email/notification channel and task ownership are needed to activate the prepared workflow. Its import and actual database/worker behavior have not been executed.
- No real booking, acknowledgement, CRM sync, database retention policy, physical-phone/Safari or screen-reader session was verified. Legal identity, founder details, testimonials and commercial terms were not changed.
- PR preview generation, actual Cal.com appointments and external automation imports remain unexecuted; their configuration/fallback paths are documented rather than described as verified live integrations.

## Files changed

Created: `.env.example`, `.github/workflows/ci.yml`, `api/lead.js`, `server/lead.js`, `server/lead-store.js`, `dist/booking.js`, `docs/integrations.md`, `docs/production-p0.md`, `integrations/n8n/lead-ingestion.json`, `integrations/n8n/schema.sql`, `package-lock.json`, `scripts/build.mjs`, `scripts/dev.mjs`, `tests/lead.test.js`.

Modified: `.gitignore`, `.vercelignore`, `README.md`, `package.json`, `vercel.json`, `dist/app.js`, `dist/assistant.js`, `dist/assistant-engine.js`, `dist/common.js`, `dist/enquiry-delivery.js`, `dist/privacy-tools.js`, `dist/site-config.js`, `dist/styles.css`, all eight `dist/**/index.html` pages, `scripts/update-content.py`, `scripts/policy_pages.py`, `tests/assistant.test.js`, `tests/enquiry.test.js`, `docs/assets-and-services.md`, `docs/site-review.md`.

Removed from version control only: `.openai/hosting.json` (local metadata retained and ignored).

See [setup and contracts](integrations.md) for exact configuration steps and remaining manual actions.
