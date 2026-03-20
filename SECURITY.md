# Security Policy — Elevare Scribe

## Secret Handling

### Environment Variables Only

All secrets, API keys, and credentials must be stored as environment variables. They are managed through the Vercel dashboard and local `.env.local` files.

**Never hardcode secrets in source code.** This includes:

- API keys (Supabase, Stripe, Sentry, Replicate, PostHog, Resend)
- Database connection strings
- R2 access credentials
- OAuth client secrets
- Webhook signing secrets

### File-Level Protections

The following files must **never** be committed to the repository:

| File | Purpose | Gitignore Status |
|------|---------|-----------------|
| `.env` | Environment variables (generic) | Gitignored |
| `.env.local` | Local development environment variables | Gitignored |
| `.env.production` | Production-only environment variables | Gitignored |
| `.env.*.local` | Environment-specific local overrides | Gitignored |

Verify these entries exist in `.gitignore`. If a secret is accidentally committed, rotate the credential immediately — do not simply remove it from the repo (it remains in Git history).

### Environment Variable Scoping (Vercel)

| Variable Prefix | Accessible From |
|-----------------|----------------|
| `NEXT_PUBLIC_*` | Client-side JavaScript (visible to users) |
| No prefix | Server-side only (API routes, SSR, server components) |

**Rule:** Never put sensitive secrets in `NEXT_PUBLIC_*` variables. Only publishable/public keys belong there (e.g., `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Current Environment Variables

| Variable | Scope | Contains Secret? |
|----------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | No (public URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | No (public anon key, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **Yes** |
| `R2_ACCOUNT_ID` | Server only | No (account identifier) |
| `R2_ACCESS_KEY_ID` | Server only | **Yes** |
| `R2_SECRET_ACCESS_KEY` | Server only | **Yes** |
| `STRIPE_SECRET_KEY` | Server only | **Yes** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | No (publishable key) |
| `REPLICATE_API_TOKEN` | Server only | **Yes** |
| `RESEND_API_KEY` | Server only | **Yes** |
| `SENTRY_DSN` | Client | No (public DSN) |
| `SENTRY_AUTH_TOKEN` | Server only (CI/build) | **Yes** |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | No (public project key) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client | No (public URL) |

---

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Elevare Scribe, please report it responsibly.

### How to Report

1. **Do not open a public GitHub issue.** Security issues must be reported privately.
2. **Email:** Send details to the project maintainer at the email associated with the GitHub account `@shane-thomas-strough`.
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if applicable)

### Response Timeline

| Action | Target |
|--------|--------|
| Acknowledge receipt | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix deployed | Within 14 business days for critical issues |
| Public disclosure | After fix is deployed and verified |

---

## Dependency Update Expectations

### Automated Monitoring

- **Dependabot** (or equivalent) should be configured to monitor for known vulnerabilities in npm dependencies
- **Sentry** monitors runtime errors that could indicate exploitation
- `npm audit` should be run as part of the CI pipeline

### Update Cadence

| Priority | Update Within | Criteria |
|----------|--------------|----------|
| Critical (CVE with known exploit) | 24 hours | Active exploitation, RCE, data exfiltration |
| High (CVE, no known exploit) | 7 days | Authenticated exploit, privilege escalation |
| Medium | 30 days | Limited impact, requires specific conditions |
| Low / Maintenance | Next sprint | Non-security updates, minor patches |

### Update Process

```bash
# Check for known vulnerabilities
npm audit

# Update a specific package
npm update package-name

# Audit fix (auto-fix compatible vulnerabilities)
npm audit fix

# After updating, verify nothing is broken
npm run build
npm run lint
npm run typecheck
npm run test
```

---

## Sanitized Error Messages

### Client-Facing Errors

Never expose internal error details, stack traces, database queries, or file paths to the client.

**Wrong:**
```tsx
return res.status(500).json({
  error: "PostgreSQL error: relation 'projects' does not exist",
  stack: error.stack,
});
```

**Right:**
```tsx
console.error("Database error:", error); // Server log only
return res.status(500).json({
  error: "An internal error occurred. Please try again later.",
});
```

### Error Handling Rules

1. **Log full errors server-side** (to Sentry and console)
2. **Return generic messages client-side** with appropriate HTTP status codes
3. **Never include:** stack traces, SQL queries, file paths, environment variable names, internal service URLs
4. **Include:** a correlation ID (if implemented) so the user can reference it in support requests

### Sentry Integration

Sentry (`@sentry/nextjs`) is integrated for error tracking. It captures:
- Unhandled exceptions on both client and server
- Performance traces
- User context (without PII unless configured)

Sentry DSN is a public value (safe in client code). Sentry Auth Token is a secret (server/CI only).

---

## Security Headers

Security headers are configured in `next.config.mjs` and applied to all routes:

```js
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "..." },
      ],
    },
  ];
}
```

### Header Explanations

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents the site from being embedded in iframes (clickjacking protection) |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-type sniffing (forces declared content type) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full URL for same-origin requests, only origin for cross-origin |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables access to camera, microphone, and geolocation APIs |

---

## Content Security Policy (CSP)

The CSP is defined in `next.config.mjs` and controls which resources the browser is allowed to load.

### Current Policy

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://api.fontshare.com;
font-src 'self' https://cdn.fontshare.com https://fonts.gstatic.com;
img-src 'self' data: blob:;
media-src 'self' https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev;
connect-src 'self' https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev https://*.ingest.sentry.io;
worker-src 'self' blob:;
```

### Directive Breakdown

| Directive | Allowed Sources | Reason |
|-----------|----------------|--------|
| `default-src` | `'self'` | Baseline: only allow resources from the same origin |
| `script-src` | `'self' 'unsafe-eval' 'unsafe-inline'` | Next.js requires `unsafe-eval` for development and `unsafe-inline` for inline scripts |
| `style-src` | `'self' 'unsafe-inline'` + Fontshare API | Tailwind injects inline styles; Fontshare CSS API for font metadata |
| `font-src` | `'self'` + Fontshare CDN + Google Fonts | Custom fonts served from these origins |
| `img-src` | `'self' data: blob:` | Images from same origin, data URIs (inline images), blob URLs (WebGL textures) |
| `media-src` | `'self'` + R2 public URL | Audio files served from Cloudflare R2 |
| `connect-src` | `'self'` + R2 public URL + Sentry | Fetch/XHR to R2 for audio loading, Sentry for error reporting |
| `worker-src` | `'self' blob:` | Web Workers and Service Workers (Tone.js AudioWorklet) |

### CSP Hardening Roadmap

The current CSP includes `'unsafe-eval'` and `'unsafe-inline'` which weaken script protection. Future improvements:

1. **Remove `'unsafe-inline'` from `script-src`:** Replace with nonce-based CSP when Next.js supports it cleanly in App Router
2. **Remove `'unsafe-eval'` from `script-src`:** Requires verifying no runtime eval is needed (Three.js shader compilation may need this)
3. **Add `frame-ancestors 'none'`:** Redundant with `X-Frame-Options: DENY` but provides CSP-level protection
4. **Add `base-uri 'self'`:** Prevents base tag injection attacks
5. **Add `form-action 'self'`:** Restricts form submission targets

### Updating the CSP

When adding new external services, update the CSP in `next.config.mjs`:

1. Identify which directive the new service requires (script, style, font, img, media, connect)
2. Add the service's domain to the appropriate directive
3. Use the most specific origin possible (e.g., `https://specific.cdn.example.com` not `https://*.example.com`)
4. Test that the resource loads without CSP violations in the browser console
5. Document the change in this file

---

## Additional Security Considerations

### Authentication (Future)

- Supabase Auth with email/password and Google OAuth
- Row-Level Security (RLS) on all Supabase tables
- Service role key used only in server-side API routes, never exposed to client

### Payment Security (Future)

- Stripe handles all payment processing — PCI compliance is Stripe's responsibility
- No credit card numbers are ever stored or processed by Elevare Scribe
- Stripe webhook signatures must be verified on the server

### File Upload Security (Future)

- Uploaded files (audio, MusicXML) must be validated for type and size before storage
- File type validation: check both MIME type and file extension
- Maximum file size: enforce limits in API routes before forwarding to R2
- Never serve user-uploaded content with `Content-Type: text/html` (XSS risk)

### Rate Limiting (Future)

- API routes should implement rate limiting to prevent abuse
- Consider using Vercel Edge Middleware or Upstash Redis for rate limiting
- AI pipeline jobs should have per-user rate limits to prevent GPU abuse
