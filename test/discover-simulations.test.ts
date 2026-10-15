import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverSimulations } from '../src/lib/simulations';

/** A throwaway tree in the tool's layout. Each argument is a file path under the root. */
function treeWith(...files: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'simulasi-scan-'));
  for (const file of files) {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '<html lang="id"></html>');
  }
  return root;
}

describe('discoverSimulations', () => {
  it('reports each simulation with the subject folder it sits in', () => {
    const root = treeWith(
      'lower-secondary/grade-7/matematika/sudut.html',
      'lower-secondary/grade-7/ipa/tekanan.html',
    );

    const folders = Object.fromEntries(
      discoverSimulations(root).found.map((s) => [s.filename, s.sourceFolder]),
    );
    expect(folders).toEqual({
      'sudut.html': 'lower-secondary/grade-7/matematika',
      'tekanan.html': 'lower-secondary/grade-7/ipa',
    });
  });

  it('refuses a file name that two subjects both use', () => {
    // The copy step writes every simulation flat under its level, so a second
    // file of the same name would silently replace the first.
    const root = treeWith(
      'lower-secondary/grade-7/matematika/pecahan.html',
      'lower-secondary/grade-7/ipa/pecahan.html',
    );

    expect(() => discoverSimulations(root)).toThrow(/pecahan\.html/);
  });

  it('refuses a simulation placed directly in its grade folder', () => {
    // With no subject folder the file would be filed under whichever subject the
    // catalog names, so the scanner refuses it instead of guessing.
    const root = treeWith('lower-secondary/grade-7/sudut.html');

    expect(() => discoverSimulations(root)).toThrow(/langsung di folder kelas/);
  });
});
