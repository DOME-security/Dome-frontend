/**
 * Content Security Policy and response headers for the static build.
 *
 * The policy allows scripts, styles and images from the app's own origin only,
 * and network connections only to the app itself and the Dome API. There is no
 * 'unsafe-inline' and no third-party host.
 */

/** Origin of an absolute http(s) URL, or null for empty or relative values. */
export function apiOrigin(apiUrl: string | undefined): string | null {
  if (!apiUrl) return null;
  let url: URL;
  try {
    url = new URL(apiUrl);
  } catch {
    throw new Error(`VITE_DOME_API_URL is not an absolute URL: ${apiUrl}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`VITE_DOME_API_URL must use http or https: ${apiUrl}`);
  }
  return url.origin;
}

export function contentSecurityPolicy(apiUrl: string | undefined): string {
  const connect = ["'self'"];
  const origin = apiOrigin(apiUrl);
  if (origin) connect.push(origin);
  return [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
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
export function headersFile(apiUrl: string | undefined): string {
  const csp = `${contentSecurityPolicy(apiUrl)}; frame-ancestors 'none'`;
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
