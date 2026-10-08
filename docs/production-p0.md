# P0 implementation record — 8 October 2026

## Audit

- Complete application found at `autixai-site`: 22 existing commits, handwritten `dist` frontend, source content, generators, fonts/licences, original branding/media and tests. The deploy directory also contains editable original frontend source; no missing React/compiled-only application was assumed or reconstructed.
- Target GitHub repository was empty, authenticated account matched `suryachandra27052008-droid`, and no remote existed locally. `origin` now targets `modern-fullstack-site`; existing history and main are preserved without a force push.
- Existing Vercel project verified: `autixai-site`, `prj_D6XqIqV6yRWb6Jp32zOogymz2LRz`, Node 24, output `dist`, existing production domain preserved. No second project created.
- No runtime dependencies. Added a dependency-free Node verification build, local frontend/API dev server, lockfile and GitHub CI. Required build tooling/tests remain in Vercel uploads; local runtime metadata and all environment files are excluded. `.env.example` has empty credentials only.
- No credential-signature matches found in current tracked text or the 22 existing commits. `.env.local`, Vercel metadata and local Sites metadata are ignored. This is a scoped pattern audit, not a guarantee that arbitrary secret formats can be detected.

## Implemented behavior

- `/api/lead`: input validation, allowlisting, length/body limits, origin/content-type checks, honeypot rejection, HMAC fingerprinting, in-flight/duplicate/uncertain receipt states, provider timeouts and explicit acceptance checks. Private delivery configuration moved off the frontend.
- Existing activated FormSubmit/Gmail delivery reused. Production server settings configured privately. A labelled test through the actual API handler returned 201 and a valid FormSubmit acceptance receipt. The owner had already verified inbox receipt on the previous direct delivery route; this new receipt alone does not prove inbox receipt of each later test.
- Published Vercel WAF rule limits POST `/api/lead` to five requests per IP per 600 seconds. Platform counters are per region. Optional atomic Redis adapter is implemented but no database credentials were supplied; cross-instance duplicate prevention is not claimed in the current email-only mode.
- Main and existing guided assistant forms use the same endpoint. Assistant fields are editable and prefilled from the selected business/workflow/tools; reviewed fields can continue to the main form in memory. Full chat is never submitted or placed in a URL. Existing chat, design, animations, keyboard dialog and mobile layout preserved.
- Central booking resolver covers header, hero, services, pricing, contact and assistant. No real event URL exists, so wording is “Request a Free Consultation”. A real verified Cal.com/Calendly event link activates “Book a Free Consultation”; no slots, confirmed appointments or calendar credentials fabricated.
- WhatsApp still opens an actual conversation with a reviewed draft. Opening it creates no backend delivery and never emits the form-completion event.
- Prepared private authenticated n8n intake template, transactional lead/outbox/follow-up schema and integration setup instructions. The template is inactive; customer acknowledgements, CRM sync and scheduled follow-up notifications are not connected.

## Executed checks

| Check | Result |
| --- | --- |
| `npm run build` | Passed all 31 tests, JS syntax and eight-page local link/asset checks. |
| Clean checkout | Cloned committed source into a separate directory; `npm ci --ignore-scripts` and `npm run build` passed with no credentials or local metadata. |
| Failed build gate | A temporary deliberately failing test in that clean clone returned exit code 1 from the build. Removed the probe; the clone remained unchanged. No failing build was published. |
| GitHub | Full preserved history pushed to `main` in `suryachandra27052008-droid/modern-fullstack-site`. GitHub Actions run 37821087284 passed on implementation commit `b1a0aa6`. |
| Vercel preview | Deployment `dpl_2fLkyrhev1wDSFoqG4uBX9g37AEv` built successfully, ran all 31 checks and discovered `api/lead` as a Node function. |
| Deployment connection | Existing project connected to the GitHub repository; Vercel project API confirms production branch `main` and Git deployments enabled. PR preview support is enabled through this connection; a real PR has not been opened for testing. |
| Backend acceptance/validation | Executed required fields, malformed email/JSON, content type, hostile/missing Origin, oversized request, phone preference, numeric bounds and honeypot rejection. |
| Delivery/duplicate cases | Executed explicit provider receipt, false/missing/HTML receipts, activation-required, network uncertainty, known rejection/retry, concurrent duplicate and repeated accepted submission. |
| Unconfigured/degraded cases | Executed missing settings, disabled preview, unavailable store and shared rate-limit rejection. No false success. |
| Provider integration | Actual FormSubmit accepted a labelled setup test from the real handler. Webhook and Redis were tested with injected transport/store responses; no live n8n/Redis provisioned. |
| Desktop | All eight pages at 1280×900: correct identity, meaningful content, no framework overlay or horizontal overflow. |
| Phone | All eight pages at 320×640 and main flows at 360×844. Fixed a narrow header overflow caused by the longer consultation label; rechecked the fix. |
| Main form | Required-field focus, valid synthetic submission, current-page duplicate, known delivery failure with preserved inputs and separate WhatsApp handoff exercised. |
| Assistant | Retail → inventory → Google Sheets → editable audit → synthetic backend acceptance → main form prefill exercised. |
| Regression | Mobile menu/Escape, calculator 20×5×5 = 8.3 manual hours/week and enquiry summary handoff, workflow demo start and close, reduced-motion flat card layout exercised. |
| Browser console | No application exceptions in the final page smoke pass. Earlier deliberate delivery failures generated expected failed-request diagnostics. |

Browser testing used the Codex in-app browser and a temporary local delivery stub outside the repository; no synthetic customer message was emailed or sent on WhatsApp during that browser pass. Screenshots are outside the repository. A separate labelled live provider test is recorded above.

## External dependencies and verification limits

- Owner must create/configure a real consultation event, connect the real calendar and verify its availability/confirmation before setting `calendarVerified:true`.
- Current default duplicate cache is warm-instance memory only. Add existing Upstash REST credentials for shared claims/counters, or activate the documented idempotent durable automation destination. FormSubmit cannot provide an atomic exactly-once transaction with Redis.
- Owner chose to keep existing email delivery and has no n8n/CRM/Redis account configured. n8n/Postgres credentials, transactional email/notification channel and task ownership are needed to activate the prepared workflow. Its import and actual database/worker behavior have not been executed.
- No real booking, acknowledgement, CRM sync, database retention policy, physical-phone/Safari or screen-reader session was verified. Legal identity, founder details, testimonials and commercial terms were not changed.
- Automatic production deployment and browser verification evidence will be recorded after the first connected Git push.

See [setup and contracts](integrations.md) for exact configuration steps and remaining manual actions.
