# Host on Cloudflare Pages

The site needs a custom domain and a way for the external simulation tool to trigger a rebuild when it finishes a batch of files. Cloudflare Pages provides DNS for the domain, builds on push, and exposes a deploy hook the tool can POST to. GitHub Pages was the alternative but pushes there do not build on their own, and an existing nginx host would mean no automatic rebuild.
