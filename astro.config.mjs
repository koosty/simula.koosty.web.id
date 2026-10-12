import { defineConfig } from 'astro/config';

// The site is a catalogue of simulations produced elsewhere, so it is
// generated pages plus a directory of untouched HTML files. Nothing here
// processes a simulation; the build only copies it.
//
// `output: 'static'` is Astro's default and is stated explicitly because a
// reader should not have to know that.
export default defineConfig({
  site: 'https://simula.koosty.web.id',
  output: 'static',
  // Every URL ends in a slash, so /smp/kelas-7/matematika/ and
  // /smp/kelas-7/matematika are one address rather than two.
  trailingSlash: 'always',
});