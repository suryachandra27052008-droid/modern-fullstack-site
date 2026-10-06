# AutixAI

Responsive marketing website for AutixAI, an AI automation and workflow integration business. Brand palette: olive green `#566132`, beige `#EDE6D6`, dark brown outlines `#3B2C21`.

## Local preview

Run `python -m http.server 4175 --bind 127.0.0.1 --directory dist` in this folder and visit http://127.0.0.1:4175/.

## Visitor flows

- Services and process navigation.
- Three illustrative workflow demos, with simulated progress and no external side effects.
- Manual-effort and capacity-value calculator: tasks per day × minutes per task × days per week ÷ 60. Monthly estimates use 4.33 weeks, an adjustable hourly staff cost, and estimated workload removal. Optional visitor-provided setup and recurring costs model net capacity value and illustrative payback. These are planning assumptions, not a quote or guaranteed cash savings.
- Demo requests and business inquiries prepare a WhatsApp message for +91 9617310042. Visitors review the draft and send it themselves in WhatsApp. No server storage, automatic sending, or calendar reservation.
- Click-to-call and direct WhatsApp contact.

The workflow portfolio contains examples, not claimed client projects. No customer testimonials, invented success rates, or guaranteed staffing reductions are used. Confirm that the listed service offerings match what the business can deliver before making the site public.

## Publishing

Vercel website: https://autixai-site.vercel.app. Project: "autixai-site" in suryachandra27052008-3423s-projects.

Sites identity is stored in `.openai/hosting.json`. The site starts private. Source assets in `dist` are maintained directly; no build step or package installation is required. Caviar Dreams (body and controls) and Cinzel (headings) are self-hosted in `dist/fonts`, with attribution and license records. Light brown `#C7A98A` warms the glass surfaces and section backgrounds.

Vercel hosting is configured by `vercel.json` to serve `dist`, with no build step. `.vercelignore` excludes Sites metadata and local scratch files. The old Sites canonical URL is omitted from this Vercel version.

On screens up to 800px wide, the portfolio, calculator, and inquiry cards reveal on scroll, gently tilt with scroll position, and gain a warm shadow while visible. Reduced-motion preferences disable these effects. Without JavaScript or IntersectionObserver support, all content remains fully visible.

## Compact mobile layout

The full 3D scroll section and its frames, canvas runtime, and offline renderer have been removed. On screens up to 800px, services use native expandable rows, workflow examples use keyboard-accessible tabs, and the calculator and inquiry form can be expanded on demand. Contact and demo links open the inquiry form automatically. Desktop descriptions and the three-column workflow layout remain available.

Mobile spacing and copy are shorter, the process uses a compact two-column layout, and a demo button remains visible in the phone header. The olive, beige, light brown, Cinzel, and Caviar Dreams design stays in place. A connected workflow map now selects one Sales, Support, or Operations example on every screen size, with keyboard-accessible tabs. Expanded details name the trigger, inputs, example tools, human review points, steps, and business output.

## Added business information

- The contact section explains the demo agenda, takeaways, and preparation. Requests still prepare a WhatsApp draft; no automated booking or fixed call duration is claimed.
- Project-stage disclosures explain scoped deliverables. A guided starting-point selector recommends discovery, a scoped build, or a workflow review and sets the inquiry interest.
- `/pricing/` describes project scoping, cost drivers, recurring provider costs, and handover without invented fixed fees.
- `/trust/` describes design questions and scope-dependent data, permissions, AI providers, human approval, ownership, and support. It distinguishes these from factual website inquiry behavior; it makes no certification claims.
- Shared navigation and year rendering live in `dist/common.js`; secondary pages do not load the home-page app runtime.

## Workflow film

`dist/media/lead-workflow.mp4` is an original, silent 36-second H.264 diagram animation (960×540, 24fps). It illustrates inquiry capture, AI qualification, CRM sync, human approval, and approved follow-up. It is not a customer recording. A poster, English WebVTT captions, and HTML transcript are included. The video source is assigned only when the visitor opens the player; controls support normal play, pause, and seeking. Closing the player pauses playback.

To regenerate it, install Pillow in your local Python environment, ensure FFmpeg is on PATH, and run `python scripts/render-workflow-film.py`. The rendering script is excluded from Vercel deployment.

## Workflow motion

The hero and portfolio workflows use travelling signals and staggered node highlights. Expanded demos include an animated four-step route, progress highlights, and completion checkmarks. These remain local simulations. Meshes appear in the hero and contact section, and decorative motion pauses off screen. Reduced-motion preferences disable animations.
