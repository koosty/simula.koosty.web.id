import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// A simulation may load a library from these hosts only (docs/adr/0021). Every
// such load is pinned to an exact version and carries a subresource integrity
// hash, so a changed or hijacked file on the CDN is refused rather than run.
const ROOT = join(process.cwd(), 'simulations');
const ALLOWED_HOSTS = ['cdnjs.cloudflare.com', 'unpkg.com'];
const PINNED = /[@/]\d+\.\d+\.\d+\//;

const files = readdirSync(ROOT, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.html'));

describe('external scripts in simulations', () => {
  it('reads the simulations this check covers', () => {
    // Guards against a path mistake that would make every check below pass on nothing.
    expect(files.length).toBeGreaterThan(0);
  });

  it('loads every script from an allowed host, pinned to a version, with an integrity hash', () => {
    const problems: string[] = [];

    for (const file of files) {
      const html = readFileSync(join(ROOT, file), 'utf8');
      for (const [tag, url] of html.matchAll(/<script\b[^>]*\bsrc="(https?:\/\/[^"]+)"[^>]*>/g)) {
        if (!ALLOWED_HOSTS.includes(new URL(url).hostname)) problems.push(`${file}: host not allowed: ${url}`);
        if (!PINNED.test(url)) problems.push(`${file}: not pinned to a version: ${url}`);
        if (!/\sintegrity="sha384-[^"]+"/.test(tag)) problems.push(`${file}: no integrity hash: ${url}`);
        if (!/\scrossorigin="anonymous"/.test(tag)) problems.push(`${file}: no crossorigin="anonymous": ${url}`);
      }
    }

    expect(problems).toEqual([]);
  });

  it('pins every module URL in an import map to a version', () => {
    const problems: string[] = [];

    for (const file of files) {
      const html = readFileSync(join(ROOT, file), 'utf8');
      for (const [, map] of html.matchAll(/<script type="importmap">([\s\S]*?)<\/script>/g)) {
        for (const [url] of map.matchAll(/https?:\/\/[^"\s]+/g)) {
          if (!PINNED.test(url)) problems.push(`${file}: import map not pinned: ${url}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });
});
