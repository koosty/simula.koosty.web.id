<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`src/lib/sitemap.ts`](../../src/lib/sitemap.ts)
- [`src/pages/sitemap.xml.ts`](../../src/pages/sitemap.xml.ts)
- [`src/pages/robots.txt.ts`](../../src/pages/robots.txt.ts)
- [`src/pages/sitemap.astro`](../../src/pages/sitemap.astro)
- [`src/lib/landing.ts`](../../src/lib/landing.ts)
- [`src/lib/catalog.ts`](../../src/lib/catalog.ts)
- [`src/lib/loadCatalog.ts`](../../src/lib/loadCatalog.ts)
- [`src/integrations/copySimulations.ts`](../../src/integrations/copySimulations.ts)
- [`src/layouts/Base.astro`](../../src/layouts/Base.astro)
- [`test/sitemap.test.ts`](../../test/sitemap.test.ts)
- [`test/sitemap-built.test.ts`](../../test/sitemap-built.test.ts)
- [`docs/adr/0005-embed-simulations-in-iframe.md`](../../docs/adr/0005-embed-simulations-in-iframe.md)
</details>

# Sitemap and Robots

The site ships two machine-facing addresses — `/sitemap.xml` and `/robots.txt` — and one human-facing page at `/sitemap/` called Peta Situs. All three are built from the same Katalog the pages are generated from, so they cannot drift from the addresses that actually exist. See [Architecture Overview](../architecture/overview.md) for where they sit in the build.

## Constants

| Constant | Value | Purpose |
|---|---|---|
| `SITEMAP_PATH` | `/sitemap.xml` | Named in robots.txt so crawlers can find it. |
| `ROBOTS_PATH` | `/robots.txt` | The only address crawlers look for it at. |
| `DEFAULT_SITE` | `https://simula.koosty.web.id` | Fallback when Astro has not been given a `site`. |

Sources: [src/lib/sitemap.ts:6](), [src/lib/sitemap.ts:9](), [src/lib/sitemap.ts:18](), [astro.config.mjs:11]()

`DEFAULT_SITE` is written down once rather than at each call site, because a sitemap pointing at the wrong host is worse than no sitemap.

Sources: [src/lib/sitemap.ts:11-18]()

## Which addresses are listed

`sitemapEntries` builds three groups and merges them into a `Map` keyed by URL:

| Group | Source | Notes |
|---|---|---|
| `ALWAYS` | `/`, `/katalog/`, `/sitemap/` | Fixed list; these exist whatever the catalog holds. |
| Landing pages | `landingPages(entries)` | Titled and described by `landingTitle` / `landingDescription`. |
| Simulations | `entries.map(...)` | Address from `simulasiUrl`, title and description from the entry. |

Sources: [src/lib/sitemap.ts:39-52](), [src/lib/sitemap.ts:69-91]()

Two things are deliberately absent. **Raw simulation files** are not listed: they are `noindex` and reachable only through the page that frames them. **Printable sheets** are not listed, because the sheet repeats the class page's content at a second address.

Sources: [src/lib/sitemap.ts:54-62](), [src/components/Sheet.astro:24-28](), [docs/adr/0008-printable-sheet-per-class.md:1-3]()

The Katalog is listed even though it is not built from the catalog, because a searcher reaching one simulation by name arrives there.

Sources: [src/lib/sitemap.ts:64-66]()

The merge uses a `Map` so one row per address: setting an existing key replaces its value. That matters because the Katalog is authoritative and the segments are free-form, so a stage or subject may land on an address another kind of page already holds.

Sources: [src/lib/sitemap.ts:82-90]()

## XML rendering

Only `loc` is emitted. The other optional tags are hints the protocol itself calls unreliable, and inventing a `lastmod` would be a claim the build cannot support — the catalog records no date.

Sources: [src/lib/sitemap.ts:110-115](), [src/lib/sitemap.ts:123-138]()

```ts
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

Sources: [src/lib/sitemap.ts:106-112]()

A title or description containing any of those five characters — as `PK & TK` would — would otherwise produce a document a crawler discards entirely.

Sources: [src/lib/sitemap.ts:98-105]()

`SitemapEntry` also carries `title` and `description`, which the XML cannot express: sitemaps.org 0.9 defines only `loc`, `lastmod`, `changefreq` and `priority`. They travel in the entry so the HTML sitemap page can render them.

Sources: [src/lib/sitemap.ts:20-36]()

## Endpoints

```ts
export const GET: APIRoute = async ({ site }) => {
  const catalog = await loadCatalogEntries();
  const body = renderSitemapXml(catalog, String(site ?? DEFAULT_SITE));

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
```

Sources: [src/pages/sitemap.xml.ts:15-21]()

`robots.txt` is served the same way with `Content-Type: text/plain; charset=utf-8`.

Sources: [src/pages/robots.txt.ts:11-17]()

Both are static endpoints built at build time, emitted once at the root. The XML is built from the catalog rather than by walking the output directory.

Sources: [src/pages/sitemap.xml.ts:5-14]()

## robots.txt

```ts
export function renderRobots(site: string): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL(SITEMAP_PATH, site).href}`, ''].join(
    '\n',
  );
}
```

Sources: [src/lib/sitemap.ts:145-148]()

Everything is crawled. The raw simulation files under `/simulasi/` are still crawled rather than blocked: they already carry `X-Robots-Tag: noindex`, which keeps them out of the index while letting a crawler follow the links on them. Blocking them here as well would risk the framed pages being discovered nowhere at all.

Sources: [src/lib/sitemap.ts:130-144](), [src/integrations/copySimulations.ts:29-37](), [docs/adr/0005-embed-simulations-in-iframe.md:1-3]()

## Peta Situs page

The HTML page at `/sitemap/` groups entries by class and lists other pages separately.

| Block | Condition | Sources |
|---|---|---|
| Link to `/sitemap.xml` | Always | [src/pages/sitemap.astro:61]() |
| Other pages, excluding simulations and `/` | `other.length > 0` | [src/pages/sitemap.astro:65-79]() |
| One section per class with its simulations | Always | [src/pages/sitemap.astro:81-97]() |

Section ids are derived from the group key, `group-${key.replace('/', '-')}`, so `smp/kelas-7` becomes `group-smp-kelas-7`.

Sources: [src/pages/sitemap.astro:83-84]()

The page cross-checks itself against the sitemap list: `wordsFor(path)` throws `Entri sitemap tidak ditemukan untuk ${path}` if a rendered page has no matching `loc`. That is a build-failing assertion, not a silent fallback.

Sources: [src/pages/sitemap.astro:22-26]()

## Testing

- [`test/sitemap.test.ts`](../../test/sitemap.test.ts)
- [`test/sitemap-built.test.ts`](../../test/sitemap-built.test.ts)

## Related pages

- [Architecture Overview](../architecture/overview.md)
- [Printable Class Sheet](printable-class-sheet.md)
- [Landing Pages](landing-pages.md)
- [Cloudflare Deployment](../deployment/cloudflare-worker.md)
