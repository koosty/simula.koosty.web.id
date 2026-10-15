<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`src/lib/sheet.ts`](../../src/lib/sheet.ts)
- [`src/components/Sheet.astro`](../../src/components/Sheet.astro)
- [`src/pages/[tingkat]/[segmen]/cetak/index.astro`](../../src/pages/[tingkat]/[segmen]/cetak/index.astro)
- [`src/components/LandingPage.astro`](../../src/components/LandingPage.astro)
- [`src/lib/landing.ts`](../../src/lib/landing.ts)
- [`src/lib/katalogFilter.ts`](../../src/lib/katalogFilter.ts)
- [`src/lib/catalog.ts`](../../src/lib/catalog.ts)
- [`src/layouts/Base.astro`](../../src/layouts/Base.astro)
- [`test/sheet.test.ts`](../../test/sheet.test.ts)
- [`test/sheet-built.test.ts`](../../test/sheet-built.test.ts)
- [`docs/adr/0008-printable-sheet-per-class.md`](../../docs/adr/0008-printable-sheet-per-class.md)
- [`CONTEXT.md`](../../CONTEXT.md)
</details>

# Printable Class Sheet (Daftar Cetak)

The Daftar Cetak is the printable list of every simulation one Kelas has, in teaching order, at `/smp/kelas-7/cetak/`. It is meant for paper: it prints black on white without the site navigation, and each entry shows its address as text so a teacher holding the sheet can type it back in. See [Landing Pages](landing-pages.md) for the class page it sits under and [Catalog Model](../content/catalog-model.md) for the entries it reads.

## Address

```ts
export const SHEET_SEGMENT = 'cetak';

export function sheetPath(level: string, classSegment: string): string {
  return `${landingPath(level, classSegment)}${SHEET_SEGMENT}/`;
}
```

Sources: [src/lib/sheet.ts:17](), [src/lib/sheet.ts:53-56]()

The segment is Indonesian rather than `print` or `sheet`, because every other segment in a URL here is Indonesian and a teacher looking for the sheet types what they would say for it. The sheet sits under the class page rather than beside it or at the top level, so it is one click from the page a teacher is already on and can never be mistaken for that page.

Sources: [src/lib/sheet.ts:8-16](), [src/lib/sheet.ts:46-52](), [docs/adr/0003-bahasa-url-path-segments.md:1-3]()

`SHEET_SEGMENT` cannot itself move the route — Astro takes a page's address from the path of its file on disk — so a test ties the constant to the route directory and is what notices when the two disagree.

Sources: [src/lib/sheet.ts:14-17](), [test/sheet.test.ts]()

## Routes

```astro
  return sheetPages(catalog).map((page) => ({
    params: { tingkat: page.level, segmen: kelasSegment(page.grade) },
    props: { page },
  }));
```

Sources: [src/pages/[tingkat]/[segmen]/cetak/index.astro:15-21]()

Routes come from `sheetPages`, not `landingPages`, so a subject segment never gets a sheet and a class with no simulations gets none. An empty sheet is a page a teacher prints, finds nothing on, and reads as a broken site rather than as an unfinished one.

Sources: [src/lib/sheet.ts:58-74](), [src/pages/[tingkat]/[segmen]/cetak/index.astro:15-21]()

The route's whole body is `<Sheet {page} />`.

Sources: [src/pages/[tingkat]/[segmen]/cetak/index.astro:26]()

## Sheet item shape

```ts
export interface SheetItem {
  title: string;
  /** The Mata Pelajaran, as the rest of the site writes it. */
  subject: string;
  description: string;
  /** The Halaman Simulasi address: linked on screen, printed as text. */
  url: string;
}
```

Sources: [src/lib/sheet.ts:26-34]()

`subject` is already passed through `subjectLabel`, so a card and a sheet never disagree on how a subject is spelled, and `url` is `simulasiUrl(entry)`, complete with its trailing slash.

Sources: [src/lib/sheet.ts:83-98](), [src/lib/katalogFilter.ts:54-60](), [src/lib/catalog.ts:33]()

Items are sorted by `order` here as well as in `groupByKelas`. The two sorts agree today, and keeping one here means the function is right for whoever calls it next rather than right only because its caller happened to sort first.

Sources: [src/lib/sheet.ts:83-88]()

The position on the sheet is not a stored field. The page is an ordered list, so the browser's own numbers are what a teacher ticks off, and they keep counting correctly if an entry is ever removed.

Sources: [src/lib/sheet.ts:89-92]()

## Rendered page

`Sheet.astro` takes one `SheetPage` prop and derives `classPath` from `landingPath(level, kelasSegment(grade))` and `classLabel` from `landingHeading`.

Sources: [src/components/Sheet.astro:6-21]()

| Element | Content | Sources |
|---|---|---|
| `<Base>` | `title={sheetTitle(page)}`, `description={sheetDescription(page)}`, `noindex={true}` | [src/components/Sheet.astro:28]() |
| `.origin` back-link | `← {classLabel}` linking to the class page | [src/components/Sheet.astro:30-32]() |
| `<h1>` | `Daftar Cetak {classLabel}` | [src/components/Sheet.astro:35]() |
| `.lead` | `Cetak halaman ini dan kerjakan bersama-sama dari atas ke bawah.` | [src/components/Sheet.astro:39]() |
| `<ol class="entries">` | One `<li>` per item: title, `Mata pelajaran: {subject}`, description, address | [src/components/Sheet.astro:42-58]() |
| `<footer>` | `Simula · simula.koosty.web.id` | [src/components/Sheet.astro:60-62]() |

```ts
export function sheetTitle(page: Pick<SheetPage, 'level' | 'grade'>): string {
  return `Daftar Cetak ${tingkatLabel(page.level)} Kelas ${page.grade} · Simula`;
}

export function sheetDescription(page: Pick<SheetPage, 'items'>): string {
  return `${page.items.length} simulasi untuk dicetak, disusun sesuai urutan materi pelajaran.`;
}
```

Sources: [src/lib/sheet.ts:107-109](), [src/lib/sheet.ts:116-118]()

The title names the class, because a teacher with one sheet per class on the desk has to tell them apart without reading to the bottom of the page. Indonesian does not pluralise the noun, so one simulation and many read the same way.

Sources: [src/lib/sheet.ts:102-105](), [src/lib/sheet.ts:111-115]()

## Indexing

The sheet is `noindex`: it repeats the class page's content at a second address, and two URLs serving the same words split the ranking between them. It is linked from the class page, so it is reachable without being indexed.

Sources: [src/components/Sheet.astro:24-28](), [src/layouts/Base.astro:36-39](), [docs/adr/0008-printable-sheet-per-class.md:1-3]()

It is also absent from the sitemap. `sitemapEntries` builds from the Katalog and landing pages, and the sheet is neither.

Sources: [src/lib/sitemap.ts:57-91]()

## Printing

The layout is built for paper first and the screen inherits it — `max-width: 720px` — and nothing carries meaning in colour alone: the order is a numbered list, the subject is a labelled line, and the address is text.

Sources: [src/components/Sheet.astro:66-72]()

```css
  @media print {
    :global(html) {
      background: #ffffff;
      color: #000000;
    }

    :global(.site-nav),
    .origin {
      display: none;
    }
```

Sources: [src/components/Sheet.astro:158-167]()

The sheet needs no print settings changed — the browser's own print dialog is enough.

Sources: [README.md:186-195]()

Everything a reader uses on screen is removed rather than shrunk: the site navigation and the link back to the class page, which is dead weight on paper. Ink is black on white, because a dark background spends a cartridge to print a grey page.

Sources: [src/components/Sheet.astro:153-157]()

Printed link addresses get `text-decoration: underline`, because a link printed in black-on-white with no underline is a word, not an address.

Sources: [src/components/Sheet.astro:49-51](), [src/components/Sheet.astro:184-187]()

`break-after: avoid` on entry titles stops the browser repeating a heading at the top of each page above a continuation the teacher cannot tell from the first.

Sources: [src/components/Sheet.astro:193-199]()

## How the sheet is reached

A class page links to its own sheet. `LandingPage.astro` computes the link only when the page is a class page:

```astro
const sheetHref = page.kind === 'kelas' ? sheetPath(page.level, page.segment) : null;
```

Sources: [src/components/LandingPage.astro:28]()

The link renders only when `sheetHref` is set, so a stage or subject page shows none.

Sources: [src/components/LandingPage.astro:49-57]()

## Testing

- [`test/sheet.test.ts`](../../test/sheet.test.ts)
- [`test/sheet-built.test.ts`](../../test/sheet-built.test.ts)

## Related pages

- [Landing Pages](landing-pages.md)
- [Catalog Model](../content/catalog-model.md)
- [Sitemap and Robots](sitemap-and-robots.md)
- [Site Theming](../development/theming.md)
