/**
 * The Cloudflare deploy hook: what the URL must be before the publish script
 * posts to it.
 *
 * The value is pasted by hand out of a Cloudflare dashboard, so it arrives with
 * the typos a paste brings: a truncated string, a stray space, or a URL from
 * somewhere else entirely. The URL is the credential (README), so posting it to
 * whatever host it happens to name would hand that credential to a third party.
 * Checking it here also gives the caller a sentence to print, rather than a
 * rejected promise from fetch.
 */

/** Cloudflare's own API host. Nothing else is a deploy hook. */
const HOOK_HOST = 'api.cloudflare.com';

/**
 * Check a hook URL and return it, or say why it is not one.
 *
 * A `null` URL means the value is unusable. A `string` reason is written for the
 * person who set the variable, in Indonesian to match the rest of the script's
 * output.
 */
export function checkDeployHook(raw: string | undefined): { url: URL } | { error: string } {
  if (!raw) {
    return { error: 'SIMULA_DEPLOY_HOOK belum disetel.' };
  }

  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { error: `SIMULA_DEPLOY_HOOK bukan URL yang bisa dibaca: ${trimmed}` };
  }

  if (url.protocol !== 'https:') {
    return { error: `SIMULA_DEPLOY_HOOK harus memakai https, bukan ${url.protocol}` };
  }
  if (url.hostname !== HOOK_HOST) {
    return {
      error: `SIMULA_DEPLOY_HOOK harus menunjuk ${HOOK_HOST}, bukan ${url.hostname}`,
    };
  }

  return { url };
}