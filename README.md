# AutixAI

Responsive marketing website for AutixAI, an AI automation and workflow integration business. Brand palette: olive green `#566132`, beige `#EDE6D6`, dark brown outlines `#3B2C21`.

## Local preview

Run `python -m http.server 4175 --bind 127.0.0.1 --directory dist` in this folder and visit http://127.0.0.1:4175/.

## Visitor flows

- Services and process navigation.
- Three illustrative workflow demos, with simulated progress and no external side effects.
- Manual-effort and capacity-value calculator: tasks per day × minutes per task × days per week ÷ 60. Monthly estimates use 4.33 weeks, an adjustable hourly staff cost, and estimated workload removal. Optional visitor-provided setup and recurring costs model net capacity value and illustrative payback. These are planning assumptions, not a quote or guaranteed cash savings.
- Demo requests and business inquiries prepare a WhatsApp message for +91 9617310042. Visitors review the draft and send it themselves in WhatsApp. An optional public webhook captures leads on submission. Its confirmed success or failure is shown; WhatsApp and direct calling remain available. An optional calendar link opens the configured booking provider. Form submission itself does not reserve a time.
- Click-to-call and direct WhatsApp contact.

The workflow portfolio contains examples, not claimed client projects. No customer testimonials, invented success rates, or guaranteed staffing reductions are used. Confirm that the listed service offerings match what the business can deliver before making the site public.

## Publishing

Vercel website: https://autixai-site.vercel.app. Project: "autixai-site" in suryachandra27052008-3423s-projects.

Sites identity is stored in `.openai/hosting.json`. The site starts private. Source assets in `dist` are maintained directly; no build step or package installation is required. DM Sans (body and controls) and Cinzel (headings) are self-hosted in `dist/fonts`, with attribution and license records. Light brown `#C7A98A` warms the glass surfaces and section backgrounds.

Vercel hosting is configured by `vercel.json` to serve `dist`, with no build step. `.vercelignore` excludes Sites metadata and local scratch files. The old Sites canonical URL is omitted from this Vercel version.

On screens up to 800px wide, all three portfolio cards form a sticky stacking deck at 96px, 112px, and 128px. A passive scroll listener batches reads with requestAnimationFrame; one card receives a subtle scale and border highlight. Reduced-motion users and short landscape screens get a flat deck. All cards remain available without JavaScript or IntersectionObserver.

## Compact mobile layout

The full 3D scroll section and its frames, canvas runtime, and offline renderer have been removed. On screens up to 800px, services use native expandable rows, workflow examples form a scrollable deck with jump buttons, and the calculator can be expanded on demand. The inquiry form is always open. Contact and demo links open the inquiry form automatically. Desktop descriptions and the three-column workflow layout remain available.

Mobile spacing and copy are shorter, the process uses a compact two-column layout, and a demo button remains visible in the phone header. The olive, beige, light brown, and Cinzel identity stays in place, with DM Sans for legible body text, a minimum 12px type size, and darker secondary text. The connected workflow map uses keyboard-accessible tabs on desktop and shows all three examples on phones. Expanded details name the trigger, inputs, example tools, human review points, steps, and business output.

## Added business information

- The contact section explains the demo agenda, takeaways, and preparation. Requests still prepare a WhatsApp draft; no automated booking or fixed call duration is claimed.
- Project-stage disclosures explain scoped deliverables. A guided starting-point selector recommends discovery, a scoped build, or a workflow review and sets the inquiry interest.
- `/pricing/` describes project scoping, cost drivers, recurring provider costs, and handover without invented fixed fees.
- `/trust/` describes design questions and scope-dependent data, permissions, AI providers, human approval, ownership, and support. It distinguishes these from factual website inquiry behavior; it makes no certification claims.
- Shared navigation and year rendering live in `dist/common.js`; secondary pages do not load the home-page app runtime.

## Workflow film

`dist/media/lead-workflow.mp4` is an original, silent 36-second H.264 diagram animation (960×540, 24fps). It illustrates inquiry capture, AI qualification, CRM sync, human approval, and approved follow-up. It is not a customer recording. A poster, English WebVTT captions, and HTML transcript are included. The video source is assigned only when the visitor opens the player; controls support normal play, pause, and seeking. Closing the player pauses playback.

To regenerate it, install Pillow in your local Python environment, ensure FFmpeg is on PATH, and run `python scripts/render-workflow-film.py`. The rendering script is excluded from Vercel deployment.

## Logo

The complete original logo supplied by the user appears in the header and footer of all three pages. `dist/branding/autixai-logo-original.jpg` is an unchanged copy, including the olive circle, white border, beige background, and original lettering. CSS uses `object-fit: contain` so the graphic is neither cropped nor stretched. An adjacent brand name keeps the compact phone header legible.

The source image and unused generated wordmark drafts are retained in `branding`, excluded from deployment. The site uses the original image rather than those drafts.

## Workflow motion

The hero and portfolio workflows use travelling signals and staggered node highlights. Expanded demos include an animated four-step route, progress highlights, and completion checkmarks. These remain local simulations. Meshes appear in the hero and contact section, and decorative motion pauses off screen. Reduced-motion preferences disable animations.

## Public website configuration

Edit `dist/site-config.js` to connect real services. Leave unknown values empty. Do not put API keys, tokens, or other secrets in this public file.

- `webhookUrl`: public lead endpoint accepting JSON POSTs. It must allow the production site origin through CORS. Receive name, business, phone, optional email, interest, challenge, source, and submission timestamp. Add server-side validation, deduplication, and spam controls at the endpoint. The UI confirms only successful HTTP responses; failures/timeouts keep the WhatsApp/call fallback available. Without this URL, no lead capture request is made.
- `calendarUrl`: HTTPS Cal.com/Calendly booking page. The secondary booking CTA appears only when configured; no placeholder link is published.
- `founderName` and `linkedinUrl`: optional verified founder details. Until supplied, the card identifies the AutixAI team and uses the existing direct business number.
- `caseStudy`: optional `{title, result}` using verified project details. The current public callout is clearly labelled an illustrative example; no delivery-time or downtime claim is invented.

Update the asset version query in all page HTML whenever scripts/config/styles change so returning visitors load the update. Configured webhook behavior also updates the inquiry notice on the home and trust pages.

## Conversion, currency, and sharing

The calculator has independent INR and USD scenarios, with starting hourly rates of INR 250 and USD 25. Switching preserves that scenario's entered costs; it does not perform FX conversion. Calculation inquiries append a concise current summary without duplicating it or overwriting business notes, choose the automation-opportunities interest, and focus the notes field.

All three pages have absolute Open Graph/Twitter URLs and use `dist/assets/og-preview.png` (1200×630). The home page includes Organization and FAQPage JSON-LD matching the five visible FAQ answers. Search-engine display of enhanced results is not guaranteed.

DM Sans is self-hosted as a 36.9KB Latin variable WOFF2 from Google Fonts, licensed under the SIL Open Font License included in `dist/fonts/DM-Sans-OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/dmsans. Cinzel remains self-hosted. No framework or browser font-service request was added.
