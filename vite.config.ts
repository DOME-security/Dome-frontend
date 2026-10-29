/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { contentSecurityPolicy, headersFile } from './config/security-headers';
import { readConfig, rpcUrls } from './src/lib/config';

// Kept deliberately small: build config is an attack surface (see README).

/** Adds the CSP meta tag and a `_headers` file to production builds only; dev needs inline HMR scripts. */
function securityHeaders(apiUrl: string | undefined, rpc: string[]): Plugin {
  return {
    name: 'dome-security-headers',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy(apiUrl, rpc) },
        injectTo: 'head-prepend',
      },
    ],
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_headers', source: headersFile(apiUrl, rpc) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), securityHeaders(env.VITE_DOME_API_URL, rpcUrls(readConfig(env)))],
    server: {
      proxy: env.VITE_DOME_API_URL ? undefined : { '/v1': env.DOME_API_PROXY_TARGET || 'http://localhost:8080' },
    },
    build: { sourcemap: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'config/**/*.test.ts'],
      css: { modules: { classNameStrategy: 'non-scoped' } },
      restoreMocks: true,
      // A registry contract is configured so pages run their ledger checks; tests replace the chain with fakes.
      env: { VITE_REGISTRY_CONTRACT_ID: 'CCHLCPUBLL4ROEFP5PR3JY4LUB32TLNB2KDF3DQLG3R53IK5OUW7TZUY' },
    },
  };
});
