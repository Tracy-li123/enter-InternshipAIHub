/**
 * auth-redirect: Email callback proxy for Supabase auth.
 *
 * Why this exists:
 * Supabase validates the `emailRedirectTo` URL against an allowlist.
 * This Edge Function lives on the same Supabase project domain
 * (mqlhknolbjnsfrqyzidh.supabase.co), so it is accepted as a redirect target.
 * It then forwards the PKCE `code` to the actual React app URL.
 *
 * Flow:
 *   Email link → Supabase verifies → redirects here with ?code=xxx
 *   → this function → redirects to {app_url}/auth?code=xxx
 *   → Supabase JS on the auth page auto-exchanges the code
 *   → onAuthStateChange fires SIGNED_IN or PASSWORD_RECOVERY
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const rawAppUrl = url.searchParams.get('app_url') || '';

  // Validate app_url — must be an absolute http(s) URL
  let appUrl = 'https://mqlhknolbjnsfrqyzidh.supabase.co';
  if (rawAppUrl) {
    try {
      const parsed = new URL(rawAppUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        appUrl = rawAppUrl;
      }
    } catch {
      // keep default
    }
  }

  // Build target: /auth with optional ?code=
  const target = new URL('/auth', appUrl);
  if (code) target.searchParams.set('code', code);

  return Response.redirect(target.toString(), 302);
});
