# autixai.tech connection

Configured on 24 October 2026 for the existing `autixai-site` Vercel project.

Both `autixai.tech` and `www.autixai.tech` are assigned to project `prj_D6XqIqV6yRWb6Jp32zOogymz2LRz` in the existing team. All three DNS records were saved in the signed-in Get.tech dashboard. Vercel reports `configured-correctly` for both names and confirms the exact A and CNAME values below.

## Required DNS records at Get.tech

These are the project-specific values returned by `vercel domains verify` on 24 October 2026, rather than generic Vercel examples.

| Type | Host name in Get.tech | Destination |
| --- | --- | --- |
| A | Leave blank (root domain) | `216.198.79.1` |
| A | Leave blank (root domain) | `64.29.17.1` |
| CNAME | `www` | `8d1b66464ffe1931.vercel-dns-017.com.` |

Use the provider's offered default TTL. Its published guidance says the root host field is blank. Inspect existing records before writing, and preserve unrelated MX, TXT and other service records. Changing nameservers or transferring registration is unnecessary for this record-based connection.

Get.tech instructions: https://cp.get.tech/kb/servlet/KBServlet/faq471.html

## Website and HTTPS

The public primary address is `https://autixai.tech`. All eight pages, social metadata, structured data, robots.txt and sitemap use this address. The project-level `www.autixai.tech` redirect targets `autixai.tech` with status 308.

Certificate `cert_TFvrpb4T50OFGqFqbdsasdqa` covers both names and has automatic renewal enabled. Normal TLS handshakes with hostname and trust validation succeeded for both names at the configured Vercel address. The certificate expires on 21 January 2027.

The enquiry API accepts only the exact owned HTTPS origins, the existing Vercel address and configured deployment origins. FormSubmit's already-activated source URL, Origin and Referer intentionally remain `https://autixai-site.vercel.app`; this keeps the current email route stable during the domain migration. The old public address remains available. Tests cover all three accepted origins and preservation of the provider metadata without sending real enquiries.

Some recursive resolvers on the local network still cached the previous empty DNS zone during setup. Browser access returned `ERR_NAME_NOT_RESOLVED` while the authoritative nameservers, Vercel and Cloudflare DNS already returned the new records. Complete the browser smoke check after those negative caches expire: homepage, media, navigation and invalid enquiry validation. No browser HTTPS warning was bypassed, and no real test enquiry was sent.
