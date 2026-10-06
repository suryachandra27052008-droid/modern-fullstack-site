# AutixAI

Responsive marketing website for AutixAI, an AI automation and workflow integration business. Brand palette: olive green `#566132`, beige `#EDE6D6`, dark brown outlines `#3B2C21`.

## Local preview

Run `python -m http.server 4175 --bind 127.0.0.1 --directory dist` in this folder and visit http://127.0.0.1:4175/.

## Visitor flows

- Services and process navigation.
- Three illustrative workflow demos, with simulated progress and no external side effects.
- Manual-effort calculator: tasks per day × minutes per task × days per week ÷ 60. This estimates workload, not guaranteed savings.
- Demo requests and business inquiries prepare a WhatsApp message for +91 9617310042. Visitors review the draft and send it themselves in WhatsApp. No server storage, automatic sending, or calendar reservation.
- Click-to-call and direct WhatsApp contact.

The workflow portfolio contains examples, not claimed client projects. No customer testimonials, invented success rates, or guaranteed staffing reductions are used. Confirm that the listed service offerings match what the business can deliver before making the site public.

## Publishing

Vercel website: https://autixai-site.vercel.app. Project: "autixai-site" in suryachandra27052008-3423s-projects.

Sites identity is stored in `.openai/hosting.json`. The site starts private. Source assets in `dist` are maintained directly; no build step or package installation is required. Caviar Dreams (body and controls) and Cinzel (headings) are self-hosted in `dist/fonts`, with attribution and license records. Light brown `#C7A98A` warms the glass surfaces and section backgrounds.

Vercel hosting is configured by `vercel.json` to serve `dist`, with no build step. `.vercelignore` excludes Sites metadata and local scratch files. The old Sites canonical URL is omitted from this Vercel version.

On screens up to 800px wide, the portfolio, calculator, and inquiry cards reveal on scroll, gently tilt with scroll position, and gain a warm shadow while visible. Reduced-motion preferences disable these effects. Without JavaScript or IntersectionObserver support, all content remains fully visible.

## Premium motion

The connected-business section uses 120 offline-rendered 3D WebP frames: 1440 × 1200 for desktop and 720 × 600 for phones. The canvas scrubs in both directions using requestAnimationFrame, so updates follow the display refresh rate; actual frame rate depends on the device and scrolling speed. Compressed frames load near the section, while decoded frames are limited to 16 on desktop and 12 on phones. Data Saver fetches every fourth mobile frame. Reduced motion and unsupported browsers show the poster and accessible chapter buttons. With JavaScript disabled, the section remains one screen tall.

The hero and portfolio workflows use travelling signals and staggered node highlights. Expanded demos include an animated four-step route, progress highlights, and completion checkmarks. These remain local simulations. Olive/champagne meshes appear in the hero, 3D sequence and contact section; decorative animations pause off screen.

To regenerate the original 3D asset, install scripts/render-requirements.txt and run scripts/render-sequence.py with Python. The renderer uses a standalone OpenGL context; no GPU renderer or rendering dependency is shipped to visitors.
