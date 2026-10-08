# AutixAI production integrations

## Current deployment

The existing `autixai-site` Vercel project serves the committed `dist/` frontend and discovers `api/lead.js` at the repository root. `server/` contains private function code. No frontend framework or runtime package was added. The handwritten HTML/JS/CSS in `dist` is authoritative source; `content/site-content.json` and the Python scripts regenerate marked content and policy sections. They are authoring tools, not a missing frontend build system.

`npm run build` runs the complete test suite, JavaScript syntax checks and local asset/link checks. It does not reconstruct or overwrite the frontend. Vercel must succeed at this command before replacing production. GitHub Actions runs the same command on main and pull requests.

## Lead endpoint

`POST /api/lead`, same-origin `application/json`, maximum 16 KiB. Required strings: `name`, `email`, `business`, `industry`, `interest`, `challenge`, `preferredContact`. Optional: `phone`, `teamSize`, `timeSpent`, `tools`, empty `website` honeypot. `preferredContact` is `email`, `phone` or `whatsapp`; the latter two require phone. Field limits and validation are in `server/lead.js`. Unknown fields, chat transcripts and caller-supplied delivery settings are discarded.

The API requires an allowed Origin, validates on the server, hashes the normalized allowlisted fields using a server-only HMAC secret, and claims a receipt before delivery. The browser cannot select the destination or change subject/reply-to recipients. Responses never contain submitted fields, credentials or raw provider messages. No contact fields or provider bodies are logged by application code.

Receipt examples:

```json
{"accepted":true,"status":"accepted","id":"lead_<32 lowercase hexadecimal characters>","delivery":"email-service","acknowledgementSent":false,"followUpCreated":false}
```

Only that explicit successful receipt causes the frontend to show submission confirmation. HTTP 200 without the expected provider receipt is rejected. A consultation request does not reserve a slot; opening WhatsApp does not submit a lead. Inputs remain editable after failure. Network uncertainty is not automatically retried; the visitor can contact the team on WhatsApp.

Status codes: 201 new accepted delivery, 200 previously accepted duplicate, 409 in progress/uncertain delivery, 422 validation/spam, 429 rate limited, 400 malformed JSON, 403 rejected origin, 413 too large, 415 wrong content type, 502 delivery failure and 503 missing/unavailable configuration. The API intentionally has no cross-origin CORS access.

## Existing email delivery

Production uses the owner's already activated FormSubmit/Gmail route, now called by the server. Configure these **Production** Vercel environment variables:

```dotenv
LEAD_PROVIDER=formsubmit
LEAD_NOTIFICATION_EMAIL=<the owner's receiving inbox>
LEAD_HASH_SECRET=<random secret of at least 32 characters>
LEAD_RATE_LIMIT_MODE=vercel-waf
```

Generate the HMAC secret once using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep it stable; rotating it changes duplicate identifiers. Set values privately in Vercel Settings → Environment Variables, or pipe them into `vercel env add NAME production --yes`. Never put them in browser config, a command-line flag containing a secret, a GitHub commit or a screenshot. `.env.local` is ignored for local development.

The server includes a stable lead reference, reviewed contact/process fields and a team follow-up instruction in the notification. FormSubmit's AJAX response confirms provider acceptance, not inbox arrival. Its AJAX route does not support the desired automatic customer acknowledgement; **customer acknowledgements, CRM records and scheduled follow-up tasks are not active in email-only mode**. Incoming enquiries remain stored in the receiving mailbox under the owner's record-handling process. No unnecessary second lead database is created.

### Rate limiting and duplicate limits

The project's published Vercel WAF rule `Protect enquiry submissions` matches POST `/api/lead`, returns 429 above five requests per IP in a 600-second fixed window, and applies outside individual function instances. Vercel counters are per region; this is not a global cross-region quota. Shared office/mobile network users share an IP allowance. The API also rejects alternate path spellings so they cannot bypass the exact-path rule.

Inspect with `vercel firewall rules list --json`. Recreate only if missing (do not duplicate or overwrite unrelated rules):

```text
vercel firewall rules add "Protect enquiry submissions" --condition '{"type":"path","op":"eq","value":"/api/lead"}' --condition '{"type":"method","op":"eq","value":"POST"}' --action rate_limit --rate-limit-window 600 --rate-limit-requests 5 --rate-limit-keys ip --rate-limit-action rate_limit --yes
vercel firewall diff --json
vercel firewall publish --yes
```

These shell examples require correct JSON quoting for your shell. Windows can call Vercel's Node entrypoint via Python `subprocess.run([...])` to preserve argument boundaries. Set `LEAD_RATE_LIMIT_MODE=vercel-waf` only after verifying the published rule. The function fails closed on production when neither WAF mode nor Redis limiting is configured.

Without Redis, duplicate/in-flight/uncertain receipts are held in a bounded warm-instance memory cache for at most 24 hours. **This cache is not durable or reliable across cold starts or multiple serverless instances.** Browser locks prevent repeated clicks in one page, and WAF limits abuse, but email-only delivery cannot promise exactly-once notifications. FormSubmit offers no idempotent delivery transaction. Do not describe this limitation as solved.

For shared receipt ownership and application rate limiting, configure an existing Upstash Redis REST database:

```dotenv
UPSTASH_REDIS_REST_URL=<HTTPS REST endpoint>
UPSTASH_REDIS_REST_TOKEN=<write-capable REST token>
```

The optional adapter uses atomic Lua claims, state updates and counters. It stores HMAC fingerprints, opaque IDs, receipt state/tokens for 24 hours and hashed-IP counters for 10 minutes, not raw lead fields. Store outages fail closed; they never silently fall back to local memory. Failed provider receipts release a claim for explicit retry; uncertain responses retain a hold to prevent a second send. A crash/ambiguous response can require manual reconciliation using the lead reference before retrying. Even Redis cannot make FormSubmit and the store one atomic transaction.

## Optional durable automation destination

Keep email mode until the alternative is configured and verified. Then use:

```dotenv
LEAD_PROVIDER=webhook
LEAD_WEBHOOK_URL=<private HTTPS production webhook>
LEAD_WEBHOOK_SECRET=<header-auth bearer secret>
```

The server sends `Authorization: Bearer <secret>`, `Idempotency-Key: lead_<fingerprint>` and a versioned event:

```json
{"schemaVersion":1,"event":"lead.created","id":"lead_<32 hex>","createdAt":"<ISO time>","source":"autixai-website","fields":{"name":"...","email":"...","business":"...","industry":"...","interest":"...","challenge":"...","preferredContact":"email","phone":"","teamSize":"","timeSpent":"","tools":""}}
```

The destination must validate again, insert the lead and follow-up/outbox records transactionally, and deduplicate on `id`. Return HTTP 2xx **after durable commit**, with:

```json
{"status":"accepted","durable":true,"id":"<the exact incoming id>","followUpCreated":true,"acknowledgementSent":false}
```

An immediate n8n “webhook received” response is insufficient. The API rejects missing/mismatched IDs, non-JSON responses and receipts without `durable:true`. Private URLs and header credentials must remain server-only. Do not run FormSubmit and an automation destination as simultaneous nontransactional sends.

### n8n preparation (inactive template)

1. Apply `integrations/n8n/schema.sql` to a private PostgreSQL database with an appropriately limited service account. Set an actual retention policy before collecting production leads there.
2. Import `integrations/n8n/lead-ingestion.json`. Select Header Auth on the Webhook node and configure `Authorization` with the exact `Bearer <LEAD_WEBHOOK_SECRET>` value in an n8n credential. Select the Postgres credential on the record node. The template contains no real credentials and remains inactive.
3. Test with synthetic data: invalid fields must fail, a valid event must commit a lead, pending team-notification record and follow-up record, and resending the same ID must create no duplicate jobs. The Respond to Webhook node runs only after that transaction. Export/import and a real database execution remain to be verified in your n8n instance.
4. Add an outbox worker: claim pending jobs atomically with `FOR UPDATE SKIP LOCKED`, persist the claim, send the team notification using your configured Gmail/SMTP/provider credential, and mark delivered only after its success receipt. Use the lead ID as the provider's idempotency key where supported. Route an ambiguous send to manual review; blindly retrying SMTP after a lost response may duplicate a notification.
5. Add a separate transactional customer-acknowledgement job only after configuring a supported email channel and testing its delivery. It should acknowledge this enquiry only, without promotions or mailing-list enrolment. Use a unique `(lead_id, kind)` outbox constraint. An acknowledgement job or a queued task does not mean an email was sent.
6. Use `autixai_followups` for team assignment/status. Connect your CRM/Sheets only through authenticated automation credentials and an idempotent upsert keyed by lead ID. Give staff a task view and a process for exceptions before enabling the workflow.
7. Activate n8n, use its **production** webhook URL, configure Vercel, redeploy, and verify durable acceptance plus actual notification/acknowledgement delivery. Until then, keep `LEAD_PROVIDER=formsubmit`.

## Genuine consultation booking

No booking account/link was supplied. Every booking CTA therefore says **Request a Free Consultation** and opens the working enquiry flow. The existing assistant opens its editable, prefilled audit form. No slots or booking confirmations are simulated.

To activate Cal.com:

1. In your account, connect the calendar you actually use, set timezone/availability, and create a free consultation event type. Set meeting length, location/video provider, buffers, notice/cancellation limits and confirmation settings to your preferences.
2. Keep required name/email, and add company and automation requirements as required booking questions. Add phone as optional. Check the real calendar's conflict detection and availability.
3. Complete a real test on desktop and phone; verify the confirmation, calendar event, timezone, conflict prevention and cancellation/reschedule flow. Cancel your test through the provider afterwards.
4. Set `calendarUrl` in **public** `dist/site-config.js` to the exact event URL, such as your actual `https://cal.com/<account>/<event>` link. Set `calendarVerified:true` only after the test passes, bump `VERSION`, regenerate and publish. No private calendar key belongs in the website.

`booking.js` is shared across header, hero, services, pricing, contact and assistant. It requires an HTTPS Cal.com/Calendly event URL and explicit verification. Empty, unsafe or unverified settings keep the request fallback. Direct provider pages are used instead of an embed: they handle real availability, loading/error/confirmation and accessibility without third-party scripts on this site. A separate local request route remains available if the provider is down. Provider availability after the owner's last verification cannot be guaranteed by a static URL check.

Official references: [Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel Git](https://vercel.com/docs/cli/git), [WAF limits](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [FormSubmit AJAX](https://formsubmit.co/ajax-documentation), [Upstash REST](https://upstash.com/docs/redis/features/restapi), [n8n Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/), [Cal.com booking questions](https://cal.com/blog/customize-your-scheduling-environment-a-guide-to-cal-com-s-booking-questions).
