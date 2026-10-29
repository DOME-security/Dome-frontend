# Deploying dome-frontend

The app is a static site. `pnpm build` writes everything to `dist/`; there is no server and nothing secret in the bundle.

## Build-time configuration

Every value is read at build time and ends up in public JavaScript.

| Variable                    | Default             | Meaning                                                                                                                 |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `VITE_DOME_API_URL`         | empty (same origin) | Base URL of dome-backend, e.g. `https://api.dome.example`. Its origin is added to the CSP `connect-src`.                |
| `VITE_STELLAR_NETWORK`      | `testnet`           | `testnet` or `mainnet`. Used for explorer links and network labels.                                                     |
| `VITE_REGISTRY_CONTRACT_ID` | empty               | Dome Registry contract id, shown and linked on `/registry`. The current id per network is in the dome-contracts README. |

```bash
VITE_DOME_API_URL=https://api.dome.example \
VITE_REGISTRY_CONTRACT_ID=CCHLCPUBLL4ROEFP5PR3JY4LUB32TLNB2KDF3DQLG3R53IK5OUW7TZUY \
pnpm build
```

The backend must list the app's origin in its `CORS_ORIGINS` setting, or the browser blocks API calls.

## Security headers

The build injects a `Content-Security-Policy` meta tag into `index.html` and writes `dist/_headers`, which Cloudflare Pages and Netlify apply automatically. `_headers` adds what a meta tag cannot carry:

- `Content-Security-Policy` with `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy` denying camera, microphone, geolocation and payment
- `Cross-Origin-Opener-Policy: same-origin`

On other hosts (S3 + CloudFront, nginx, Vercel, GitHub Pages behind a proxy), copy these headers from `dist/_headers` into the host's configuration. Both policies come from `config/security-headers.ts`, and `connect-src` lists only the app itself, the Dome API and the configured Stellar RPC endpoints. There are no third-party analytics or trackers to allow.

## Routing

All routes are client-side. Configure the host to serve `index.html` for unknown paths (Cloudflare Pages does this by default; on Netlify add a `/* /index.html 200` rewrite; on nginx use `try_files $uri /index.html`).

## Caching

Files under `dist/assets/` have content hashes in their names and can be cached for a year (`Cache-Control: public, max-age=31536000, immutable`). Serve `index.html` with `Cache-Control: no-cache` so users get new releases.
