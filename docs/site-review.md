# Website protection review — 8 October 2026

This is an implementation record, not a certification or a guarantee of legal compliance.

| Checklist item | Website action / current status |
| --- | --- |
| 1 Privacy policy | Updated notice reflects page-memory drafts, assistant, recipient services, optional consent and the privacy-request route. |
| 2 Terms | Updated website terms; paid work remains subject to a separately agreed contract. |
| 3 Refund policy | Added payments/cancellation/refunds page. Owner has not decided standard refund terms; no refund deadline, no-refund deposit or eligibility rule invented. Proposal must define these before payment. |
| 4 Cookie policy | Added storage inventory and current no-optional-tracker disclosure. |
| 5 Cookie consent | Conditional banner and persistent footer controls. All optional analytics blocked until explicit allow. Equal allow/reject buttons; rejection preserves features. Current analytics is disabled, so no unnecessary banner/storage. |
| 6 Form consent | Plain purpose and recipient notice before sharing; exact draft and explicit handoff. No mailing-list enrolment or bundled marketing consent. |
| 7 Minimal data | Main enquiry accepts phone OR email. Workload/tools optional. Privacy requests collect one contact detail, type and optional context. No DOB/ID upload. |
| 8 Third-party SDKs | Static site has no package dependencies, external runtime script, analytics provider, ad pixel, social embed or chat SDK. Website SDK-free assistant is local. Vercel hosting, visitor-opened WhatsApp/Instagram and optional disabled integrations disclosed. Any new provider needs its own review before activation. |
| Email enquiry update, 8 October 2026 | Visitor-selected Send enquiry now uses FormSubmit AJAX delivery to the owner's temporary Gmail inbox; WhatsApp remains a separate draft route. Recipient and transmission notices updated on home, trust, privacy and cookies pages. No marketing enrolment, third-party script or automatic send on page load. |
| 9 Dark patterns | No fake urgency, preselected marketing, auto-open assistant, forced analytics or auto-send. Drafts invalidate on edit and can be cleared. |
| 10 Hidden fees | Paid scope, taxes, provider fees, usage, support and changes must be agreed before payment. No checkout/auto-billing. |
| 11 Fake reviews | No customer-review section or fabricated testimonials found. Example project cards remain labelled illustrative. |
| 12 Unsupported claims | No guaranteed hours, revenue, headcount reductions, compliance or partnerships added. Calculator discloses illustrative capacity value. Claims must be substantiated before publishing real case studies. |
| 13 Alt text | Static images have alt attributes. Repeated decorative logo images have empty alt inside explicitly named home links; adjacent brand text supplies the identity. Diagrams have visible descriptive text; film has caption track/transcript. |
| 14 Contrast | Dark brown/olive text retained; transparent button text corrected, visible focus strengthened. Rendered checks recorded during QA. No full WCAG certification claimed. |
| 15 Keyboard | Native controls/dialog, explicit focus containment/return, skip link and inline errors. Added current-page motion pause and accessible privacy controls. |
| 16 Business details | Brand, phone and Instagram shown; central optional legal name/email/address/city fields supported. Owner confirmed these are undecided. No invented identity/address/registration published. |
| 17 Children | Business-services notice asks visitors not to submit children's data. No children's service, age/DOB collection or fake parental-consent process added. A future child-data workflow requires separate assessment. |
| 18 Unsubscribe | No marketing-email service exists. Stop-promotional-contact request route added. Future campaigns require separate optional opt-in, sender identity and a working unsubscribe mechanism with a suppression list before launch. |
| 19 Licences | Active DM Sans/Cinzel licences included. Caviar Dreams retained with attribution and author distribution source. User-supplied logo is preserved; ownership was not independently established. See asset inventory. |
| 20 Deletion requests | Minimal local privacy-request form with access/correction/deletion/stop-contact options, exact WhatsApp preview and no silent send. It requests manual review; it does not claim automatic deletion from third-party providers. |

## Owner decisions still needed

- Contracting legal/trading name, permanent business email, address/city, applicable registrations and billing/tax details. The owner supplied a temporary Gmail inbox for website enquiries on 8 October 2026; FormSubmit activation and actual inbox delivery still require owner verification.
- Real paid-project cancellation, deposit, refund eligibility and processing terms.
- Actual enquiry/project retention schedule and a person/process for requests. No universal retention deadline or response SLA has been promised.
- Verify rights to supplied branding and substantiate any future real project claims/testimonials.

## Before enabling analytics or marketing

Keep `analyticsEnabled: false` until a provider/storage inventory and country-specific assessment are complete. Disclose provider, purpose and storage before enabling. Initialise provider scripts only after `window.AutixAIPrivacy.allowsAnalytics()` returns true. Listen for `autixai:privacychange`; on withdrawal stop collection and remove the provider's optional cookies/identifiers. The fixed-name event gate does not itself initialise or clean up any provider. Never put contact or chat text in events. Do not bypass the gate with third-party snippets.

Marketing remains disabled. Do not treat an enquiry, privacy setting or sending a WhatsApp draft as marketing consent. A future campaign needs an independently recorded, optional consent choice where appropriate and a working unsubscribe/suppression process. Do not collect children's data before the necessary project-specific assessment and controls.

## Reference guidance

- W3C form notifications: https://www.w3.org/WAI/tutorials/forms/notifications/
- W3C text contrast: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- UK ICO storage/consent guidance (jurisdiction-specific): https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
- Actual legal obligations depend on the business, processing and jurisdictions served; the website does not claim universal compliance.

## Verification

- Environment: local static site at `http://127.0.0.1:4175/`, Codex in-app browser. No standalone browser fallback was needed. All eight pages checked at actual 1280×900 and 320×640 viewports; request handoff checked at 360×844.
- Page identity, meaningful content, absence of framework error overlays, console health, screenshot evidence and target interactions passed. No horizontal overflow at the tested widths. A mobile assistant overlap was found and fixed; the final screenshot shows both sharing and clear controls unobstructed.
- Enquiry: empty contact fails with focus/error, email-only and phone-only each produce the expected draft, editing removes the stale sharing URL, reset clears the fields and draft.
- Privacy request: invalid contact receives a written error and focus; a valid deletion request produces the exact minimal draft. Editing invalidates the URL, clearing removes it, and the accessibility help link selects the right request type. Network observation found zero requests caused by preparing the privacy draft. No real WhatsApp message was sent in testing.
- Privacy settings: Tab/Shift+Tab wrap within the dialog; Escape closes and returns focus. Current optional analytics is disabled. Reduced-motion emulation gives relative/flat cards and no hero animation; the system preference disables the redundant manual pause control. Restoring normal motion returns sticky cards.
- Synthetic local consent integration at port 4176: event blocked before choice, blocked after reject, reject survives reload, explicit allow permits the fixed event, withdrawal blocks subsequent events. No real analytics provider was used.
- Automated checks: `node --test tests/*.test.js` (15 tests), JavaScript syntax checks, generator idempotency, all local links/assets/anchors across eight pages and duplicate IDs passed. Main palette text pairs measured 5.57:1 or higher; this is not an exhaustive glass-background or WCAG audit.
- Browser APIs used: navigation/reload, semantic locators, read-only DOM inspection, viewport overrides, console logs, screenshots, CDP reduced-motion emulation and network observation. Temporary emulation and tabs are cleared after QA.
- Remaining limits: no physical iPhone/Android, Safari, screen-reader session, real provider onboarding, automatic deletion service, marketing delivery or payment/refund flow tested. These services are not configured. Outstanding owner decisions above remain necessary.

## Email enquiry verification — 8 October 2026

- Local preview at `http://127.0.0.1:4175/` used a temporary HTTP test service instead of FormSubmit, so sample submissions did not email anyone. Desktop 1280×900 and mobile 360×844 / 320×640: no horizontal overflow, meaningful page content, no overlay or relevant console error.
- Required-field errors focus the first invalid input. Email-only and phone-only contacts work. WhatsApp review makes zero delivery requests, preserves exact reviewed fields and invalidates its link after edits.
- A pending email disables email sends while leaving WhatsApp available. Accepted enquiries are not re-sent on repeated clicks in that page. HTTP failure and the 15-second timeout preserve fields and the WhatsApp draft; reset clears fields and the stale link.
- Browser testing caught a missing delivery-script include; the generator now inserts it ahead of the form controller, with a regression check. All 20 automated tests pass, including FormSubmit JSON acceptance, activation-required responses, field allowlisting, missing/failed provider receipts and no automatic retries.
- Actual inbox delivery still requires the owner to activate FormSubmit and confirm receipt. Local mocks and provider acceptance cannot establish that an email arrived. No real WhatsApp message was sent during QA.
