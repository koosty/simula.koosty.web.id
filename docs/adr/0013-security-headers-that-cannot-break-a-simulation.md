# Security headers that cannot break a simulation

Cloudflare Pages reads response headers from `_headers`. The file previously held one rule, `X-Robots-Tag: noindex` on `/simulasi/*`, and nothing else, so every page was served with no protection against content sniffing, no referrer policy, and no HSTS.

The site-wide block now adds `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` and `Strict-Transport-Security`. Each is chosen because it cannot change what a reader sees. `SAMEORIGIN` is safe here precisely because a Halaman Simulasi frames its own simulation from the same origin, which is what `src/integrations/serveSimulations.ts` serves in development.

There is deliberately **no** Content-Security-Policy. A policy strict enough to be worth having would need `script-src` without `unsafe-inline` or `unsafe-eval`, and all 71 simulations ship their own inline scripts, inline styles and generated element styles. Adopting one is not a header change; it is a change to every simulation file, which `docs/adr/0005` forbids the site from making on its own. Until the tool can emit a nonce or a hash per scene, a CSP here would blank every simulation, so the decision belongs with the tool.

HSTS is sent with `includeSubDomains`. That is the safe reading of the domain: `simula.koosty.web.id` is a subdomain, and the header only takes effect once the browser has seen it over HTTPS.