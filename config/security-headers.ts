/**
 * Content Security Policy and response headers for the static build.
 *
 * The policy allows scripts, styles and images from the app's own origin only,
 * and network connections only to the app itself, the Dome API and the
 * configured Stellar RPC endpoints. There is no 'unsafe-inline' and no
 * third-party host.
 */

/** Origin of an absolute http(s) URL, or null for empty values. */
export function urlOrigin(value: string | undefined, name = 'VITE_DOME_API_URL'): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not an absolute URL: ${value}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${name} must use http or https: ${value}`);
  }
  return url.origin;
}

export const apiOrigin = (apiUrl: string | undefined) => urlOrigin(apiUrl);

/** `rpcUrls` are the Soroban RPC endpoints the app reads from and submits to. */
export function contentSecurityPolicy(apiUrl: string | undefined, rpcUrls: string[] = []): string {
  const connect = new Set(["'self'"]);
  const origin = apiOrigin(apiUrl);
  if (origin) connect.add(origin);
  for (const rpc of rpcUrls) connect.add(urlOrigin(rpc, 'Stellar RPC URL')!);
  return [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${[...connect].join(' ')}`,
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
}

/**
 * Headers for hosts that read a `_headers` file (Cloudflare Pages, Netlify).
 * `frame-ancestors` only works as a header, not in a meta tag.
 */
export function headersFile(apiUrl: string | undefined, rpcUrls: string[] = []): string {
  const csp = `${contentSecurityPolicy(apiUrl, rpcUrls)}; frame-ancestors 'none'`;
  return [
    '/*',
    `  Content-Security-Policy: ${csp}`,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: no-referrer',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
    '  Cross-Origin-Opener-Policy: same-origin',
    '',
  ].join('\n');
}
