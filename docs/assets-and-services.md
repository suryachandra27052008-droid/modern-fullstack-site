# Asset and service inventory — 8 October 2026

| Asset/service | Use and evidence | Follow-up |
| --- | --- | --- |
| DM Sans | Active self-hosted body font; `dist/fonts/DM-Sans-OFL.txt` includes SIL OFL 1.1. | Preserve licence when redistributing font files. |
| Cinzel | Active self-hosted heading font; `dist/fonts/Cinzel-OFL.txt` includes SIL OFL 1.1 and project attribution. | Preserve licence when redistributing. |
| Caviar Dreams | Inactive retained original fonts; attribution records Lauren Thompson and the author's distribution page, https://www.dafont.com/caviar-dreams.font, whose note allows personal/commercial use. | Retain attribution; review conditions if modifying/redistributing. |
| AutixAI logo | User-supplied original JPG, preserved unchanged. | Owner must hold rights; supplying a file does not independently establish copyright/trademark ownership. |
| OG preview | Existing local brand preview; no external stock source configured. | Do not replace with unlicensed media. |
| Workflow film | Local rendered workflow illustration, source `scripts/render-workflow-film.py`; captions/transcript included. | No fake client attribution or results. |
| Vercel | Website hosting. No analytics package configured. Hosting request metadata is disclosed in privacy notice. | Review project logs/access/retention in the hosting account. |
| WhatsApp | Explicit visitor-selected draft handoff; no messaging SDK or background send. | Separate WhatsApp privacy/terms apply. |
| Instagram | Canonical external link to provided profile; no embedded feed, pixel or SDK. | Owner-provided account identity; no independent ownership claim. |
| FormSubmit / Gmail | Explicit website/assistant submission goes through the same-origin Vercel API for validation, then FormSubmit AJAX email delivery. Production server egress is rejected with HTTP 403, so a configured handoff lets the browser send validated fields to the public form alias. No SDK, background send, marketing enrolment or customer autoresponder. Sources: https://formsubmit.co/ajax-documentation and https://formsubmit.co/privacy.pdf. | Activation/prior inbox receipt confirmed by the owner. Local handler acceptance and production browser-handoff acceptance verified. Later inbox arrival is not guaranteed by a provider receipt. Private configuration stays on the server; the fallback's public alias and reviewed payload are returned to the submitting browser. See integrations.md for its protection limits. |
| Optional calendar/analytics | No booking URL configured; consultation-request fallback active. Analytics disabled. No marketing-email provider or payment checkout. | Review actual provider, data flow, fees, consent and notice before activation. |
| Integration platform names | Text-only feasibility examples, no partner badges or client logos. | No endorsement/partnership claim. |

Email enquiries introduce a visitor-triggered same-origin API request, followed by server delivery or the documented FormSubmit browser compatibility handoff. Vercel WAF protects the API, not FormSubmit's separate public endpoint. An optional Redis adapter and inactive n8n/Postgres workflow template have no live credentials or active connection. No external runtime script/package, analytics provider, payment service or stock image was introduced.
