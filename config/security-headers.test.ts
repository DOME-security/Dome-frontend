import { describe, expect, it } from 'vitest';
import { apiOrigin, contentSecurityPolicy, headersFile } from './security-headers';

describe('contentSecurityPolicy', () => {
  it('allows only self when no API URL is set', () => {
    const csp = contentSecurityPolicy('');
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('adds only the API origin, never its path', () => {
    expect(contentSecurityPolicy('https://api.dome.example/base/')).toContain("connect-src 'self' https://api.dome.example;");
  });

  it('adds Stellar RPC origins once each', () => {
    const csp = contentSecurityPolicy('https://api.dome.example', [
      'https://soroban-testnet.stellar.org',
      'https://soroban-testnet.stellar.org/',
      'https://rpc.mainnet.example/path',
    ]);
    expect(csp).toContain(
      "connect-src 'self' https://api.dome.example https://soroban-testnet.stellar.org https://rpc.mainnet.example;",
    );
  });

  it('rejects relative or non-http URLs', () => {
    expect(() => apiOrigin('/v1')).toThrow(/absolute/);
    expect(() => apiOrigin('javascript:alert(1)')).toThrow(/http/);
  });

  it('adds frame-ancestors and hardening headers to the _headers file', () => {
    const file = headersFile('https://api.dome.example');
    expect(file).toMatch(/^\/\*\n/);
    expect(file).toContain("frame-ancestors 'none'");
    expect(file).toContain('X-Content-Type-Options: nosniff');
    expect(file).toContain('Referrer-Policy: no-referrer');
  });
});
