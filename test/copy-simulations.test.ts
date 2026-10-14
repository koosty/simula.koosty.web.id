import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveSimulationRequest } from '../src/integrations/copySimulations';

const ROOT = resolve(process.cwd(), 'simulations');

/**
 * A simulation is served from /simulasi/<level>/<file>.html, but the files
 * arrive in English folders, so a request has to be translated before it can be
 * opened on disk.
 */
function requestTo(urlPath: string): string | null {
  return resolveSimulationRequest(urlPath, ROOT);
}

/**
 * A throwaway tree in the tool's folder layout, for the guards that only differ
 * from the real batch when a file the batch happens not to contain exists.
 *
 * Nothing here writes to simulations: those files are the tool's output
 * and this site does not reshape them (docs/adr/0005).
 */
function fixtureWith(...files: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'simulasi-'));
  const dir = join(root, 'lower-secondary', 'grade-7');
  mkdirSync(dir, { recursive: true });
  for (const file of files) writeFileSync(join(dir, file), '<html lang="id"></html>');
  return root;
}

describe('resolveSimulationRequest', () => {
  it('resolves a simulation the tool has written', () => {
    const file = requestTo('/simulasi/smp/angka-bulat-dan-garis-bilangan.html');
    expect(file).not.toBeNull();
    expect(existsSync(file!)).toBe(true);
    expect(readFileSync(file!, 'utf8')).toContain('<html lang="id"');
  });
  it('resolves every simulation the catalog publishes', () => {
    // If any one of them is unreachable in dev, its Halaman Simulasi renders
    // with a frame that 404s: the page looks complete and the simulation is
    // simply missing. That is exactly the failure this test exists to catch, so
    // it asks about all of them rather than a convenient sample.
    const slugs = readdirSync(resolve(process.cwd(), 'src/content/simulasi'))
      .filter((name) => name.endsWith('.yaml'))
      .map((name) => name.replace(/\.yaml$/, ''));
    expect(slugs.length).toBeGreaterThan(1);

    const unreachable = slugs.filter(
      (slug) => requestTo(`/simulasi/smp/${slug}.html`) === null,
    );
    expect(unreachable).toEqual([]);
  });

  it('serves a simulation asked for with a trailing slash', () => {
    // The site's own links always carry `.html`, but a trailing slash is what a
    // reader's browser produces from `trailingSlash: 'always'` conventions, and
    // serving one spelling while 404ing the other is a needless split.
    const withSlash = requestTo('/simulasi/smp/angka-bulat-dan-garis-bilangan.html/');
    expect(withSlash).not.toBeNull();
  });

  it('refuses a request with no file extension', () => {
    // A simulation is a flat file, so `foo` is not `foo.html` as far as the
    // filesystem is concerned. Guessing the extension would serve something the
    // address did not name.
    expect(requestTo('/simulasi/smp/angka-bulat-dan-garis-bilangan')).toBeNull();
  });

  it('refuses a path that climbs out of the simulation folder', () => {
    // The request comes from the address bar, so it is attacker-controlled.
    // `..` must not reach package.json.
    const escaped = requestTo('/simulasi/smp/../../../package.json');
    expect(escaped).toBeNull();
  });

  it('refuses an encoded climb out of the simulation folder', () => {
    // Browsers normalise %2e%2e before sending, but a hand-written request does
    // not have to, so the path is decoded before it is checked.
    const escaped = requestTo('/simulasi/smp/%2e%2e/%2e%2e/%2e%2e/package.json');
    expect(escaped).toBeNull();
  });
  it('reads an escaped separator as the separator it stands for', () => {
    // `%2F` is a `/`. Without decoding it the request has one segment and is
    // rejected as malformed, so the simulation would 404 for an address that
    // names it exactly. Decoding has to happen before the segments are counted.
    const escaped = requestTo(
      '/simulasi/smp%2Fangka-bulat-dan-garis-bilangan.html',
    );
    expect(escaped).not.toBeNull();
    expect(existsSync(escaped!)).toBe(true);
  });

  it('refuses a malformed escape sequence', () => {
    // `%zz` is not a valid escape. Guessing at it would mean serving a path the
    // address never named.
    expect(requestTo('/simulasi/smp/%zz.html')).toBeNull();
  });

  it('refuses a name that only looks like a simulation', () => {
    // Every name here would reach the disk if the extension check were removed
    // and a file by that name existed, so this fails for the reason under test
    // rather than because nothing happens to match.
    const real = 'angka-bulat-dan-garis-bilangan.html';
    expect(requestTo(`/simulasi/smp/${real}.bak`)).toBeNull();
    expect(requestTo(`/simulasi/smp/${real}x`)).toBeNull();
  });

  it('refuses a request outside /simulasi', () => {
    // Both spellings, because the prefix check and the segment count are
    // separate guards and either one alone could be deleted. Without the count,
    // a request that reaches here with the wrong shape throws rather than
    // returning null, so this asserts the shape of the refusal too.
    expect(requestTo('/package.json')).toBeNull();
    expect(requestTo('/simulasi')).toBeNull();
    expect(requestTo('/simulasi/smp')).toBeNull();
    expect(requestTo('/simulasi/smp/lower/extra/deeper.html')).toBeNull();
    expect(requestTo('/smp/kelas-7/matematika/angka-bulat-dan-garis-bulan/')).toBeNull();
  });

  it('serves only html files, even when the tool wrote something else', () => {
    // A fixture rather than a real file: the batch happens to contain nothing
    // but .html, so against the real folder this guard is indistinguishable from
    // "no such file". That is a fixture agreeing with the wrong answer, and it
    // would keep passing with the check deleted.
    const root = fixtureWith('seperti.html', 'catatan.txt', '.tersembunyi.html');

    expect(resolveSimulationRequest('/simulasi/smp/seperti.html', root)).not.toBeNull();
    expect(resolveSimulationRequest('/simulasi/smp/catatan.txt', root)).toBeNull();
    // A dot-prefixed name is not a simulation however it was named.
    expect(resolveSimulationRequest('/simulasi/smp/.tersembunyi.html', root)).toBeNull();
  });

  it('refuses a folder that is not a file', () => {
    // A folder named like a simulation would otherwise be served: the readdir
    // walk looks for any entry with that name, and reading it as a file would
    // throw. Only a fixture has a folder where a simulation's file is expected.
    const root = fixtureWith('seperti.html');
    mkdirSync(join(root, 'lower-secondary', 'grade-7', 'bukan-berkas.html'), {
      recursive: true,
    });

    expect(resolveSimulationRequest('/simulasi/smp/bukan-berkas.html', root)).toBeNull();
  });

  it('refuses a folder that has no Indonesian segment', () => {
    // An unmapped level is a build error (the copy step throws). In dev it must
    // not be served either.
    //
    // The file name here is one the tool has really written. With a name that
    // does not exist this test would pass for the wrong reason — it would be
    // proving "no such file" rather than "no such level" — and would keep
    // passing with the level check deleted.
    expect(requestTo('/simulasi/smp-xyz/angka-bulat-dan-garis-bilangan.html')).toBeNull();
  });

  it('refuses a simulation that is not an html file', () => {
    // Every guard in the resolver is checked against a name that would otherwise
    // have reached the disk: the level is real and the file exists. Without that
    // the assertion is satisfied by "not found" instead of by the guard.
    expect(requestTo('/simulasi/smp/../../../../etc/passwd')).toBeNull();
    expect(requestTo('/simulasi/smp/angka-bulat-dan-garis-bilangan.html.bak')).toBeNull();
  });

  it('refuses a simulation the tool has not written', () => {
    expect(requestTo('/simulasi/smp/tidak-ada.html')).toBeNull();
  });
});