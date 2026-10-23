# autixai.tech connection

Prepared on 24 October 2026 for the existing `autixai-site` Vercel project.

Both `autixai.tech` and `www.autixai.tech` have been assigned to project `prj_D6XqIqV6yRWb6Jp32zOogymz2LRz` in the existing team. Vercel accepts the ownership assignment; public DNS is not yet configured.

## Required DNS records at Get.tech

These are the project-specific values returned by `vercel domains verify` on 24 October 2026, rather than generic Vercel examples.

| Type | Host name in Get.tech | Destination |
| --- | --- | --- |
| A | Leave blank (root domain) | `216.198.79.1` |
| A | Leave blank (root domain) | `64.29.17.1` |
| CNAME | `www` | `8d1b66464ffe1931.vercel-dns-017.com.` |

Use the provider's offered default TTL. Its published guidance says the root host field is blank. Inspect existing records before writing, and preserve unrelated MX, TXT and other service records. Changing nameservers or transferring registration is unnecessary for this record-based connection.

Get.tech instructions: https://cp.get.tech/kb/servlet/KBServlet/faq471.html

## Migration sequencing

1. Add the exact owned HTTPS origins to the enquiry API while preserving the current site address. Tests also reject HTTP, other subdomains, unexpected ports and misleading suffixes.
2. Apply the DNS records in the signed-in Get.tech account and verify propagation and the HTTPS certificate for both names.
3. Confirm the homepage, media, navigation and enquiry validation on the custom domain without sending an unsolicited test enquiry.
4. After DNS and HTTPS work, switch canonical URLs, sitemap, social metadata and provider website metadata to the chosen primary domain, and configure the alternate www address to redirect to it.
5. Arrange a controlled real enquiry test with the owner. If the delivery service requests fresh activation for the new website address, complete that before treating email delivery as verified on the new domain.

Do not redirect the existing working website to an unresolved domain or claim the custom domain is live before DNS and HTTPS verification.
