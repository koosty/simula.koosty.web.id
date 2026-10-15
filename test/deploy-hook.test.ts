import { describe, it, expect } from 'vitest';
import { checkDeployHook } from '../src/lib/deployHook';

const HOOK = 'https://api.cloudflare.com/client/v4/pages/simula/deploys';

describe('the deploy hook URL', () => {
  it('accepts a Cloudflare deploy hook', () => {
    expect(checkDeployHook(HOOK)).toEqual({ url: new URL(HOOK) });
  });

  it('ignores whitespace around a pasted URL', () => {
    // The value is copied out of a dashboard by hand, and a trailing newline or
    // space is the most ordinary paste mistake there is.
    expect(checkDeployHook(`  ${HOOK}\n`)).toEqual({ url: new URL(HOOK) });
  });

  it('refuses a URL that is not one', () => {
    // Half a pasted URL would otherwise be sent to fetch, which reports it as a
    // network failure rather than as the typo it is.
    expect(checkDeployHook('api.cloudflare.com/client/v4')).toMatchObject({
      error: expect.stringContaining('bukan URL'),
    });
  });

  it('refuses a host that is not Cloudflare', () => {
    // The URL is the credential. A value pointing anywhere else would hand that
    // credential to whoever owns that host.
    expect(checkDeployHook('https://evil.example/pages/simula/deploys')).toMatchObject({
      error: expect.stringContaining('api.cloudflare.com'),
    });
  });

  it('refuses plain http, so the credential is never sent in the clear', () => {
    expect(checkDeployHook('http://api.cloudflare.com/client/v4/pages/simula/deploys')).toMatchObject({
      error: expect.stringContaining('https'),
    });
  });

  it('says when it is unset rather than reporting an empty URL', () => {
    // A missing hook is a normal run: the batch is written and pushed by hand.
    expect(checkDeployHook(undefined)).toEqual({
      error: 'SIMULA_DEPLOY_HOOK belum disetel.',
    });
    expect(checkDeployHook('')).toMatchObject({ error: expect.stringContaining('belum disetel') });
  });
});