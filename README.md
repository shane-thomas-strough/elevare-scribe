# Elevare Scribe

**From Suno to Stage.** Turn AI-generated songs into live performances.

Elevare Scribe is the end-to-end operating system for independent AI-assisted musicians. It takes a Suno or Udio share link and produces a complete performance package: sheet music, tabs, transposed arrangements, backing tracks, copyright documentation, and a stage-ready interface.

The landing page is not a standard SaaS marketing page. It is an immersive, generative browser experience built on MIT Media Lab and SpaceX design philosophies. The interface demonstrates the product by being the product: WebGL visuals, real-time audio manipulation, and interactive sheet music rendering all work before the visitor creates an account.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **WebGL** | Three.js, @react-three/fiber, @react-three/drei, custom GLSL shaders |
| **Audio** | Tone.js (real-time pitch shifting, stem mixing) |
| **Sheet Music** | OpenSheetMusicDisplay (OSMD) for MusicXML rendering |
| **Scroll Animation** | GSAP + ScrollTrigger (scroll hijack, pinning, parallax) |
| **Component Animation** | Framer Motion (transitions, hovers, micro-interactions) |
| **State Management** | Zustand |
| **Audio CDN** | Cloudflare R2 |
| **Hosting** | Vercel |
| **Error Tracking** | Sentry |

---

## Local Setup

### Prerequisites

- **Node.js** 18.17 or later
- **npm** 9 or later
- **Git**

### Clone and Install

```bash
git clone https://github.com/elevare-edge/elevare-scribe.git
cd elevare-scribe
npm install
```

### Environment Variables

Create a `.env.local` file in the project root. The following variables are used in production but are not required for local development of the landing page:

```env
# Supabase (required for auth/database features)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2 (required for audio upload management)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

# Stripe (required for payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Sentry (optional, for error tracking)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# PostHog (optional, for analytics)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

**Note:** The landing page demo experience (WebGL hero, audio playback, sheet music) works without any environment variables. Audio is served from the public R2 CDN URL configured in `src/config/audio.ts`.

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run analyze` | Production build with bundle analyzer |

---

## Adding Audio to Cloudflare R2

Demo audio files are served from Cloudflare R2. To add or update audio:

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 2. Upload the File

```bash
wrangler r2 object put elevare-scribe-audio/Track-Name-Demo.wav \
  --file ./path/to/local/file.wav \
  --content-type audio/wav
```

### 3. Update Audio Config

Add the new track URL to `src/config/audio.ts`:

```ts
export const AUDIO = {
  // ... existing tracks
  NEW_TRACK: 'https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev/Track-Name-Demo.wav',
} as const;
```

### Naming Conventions

- Use hyphens to separate words: `Track-Name-Demo.wav`
- Use WAV format for demo tracks (required for quality pitch-shifting)
- Normalize audio to -14 LUFS before uploading
- Keep demo clips to 10 seconds or less

For full details, see [docs/AUDIO-CONFIG.md](docs/AUDIO-CONFIG.md).

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage report
npx vitest run --coverage
```

Coverage thresholds are set to 80% for statements, branches, functions, and lines (configured in `vitest.config.ts`).

### End-to-End Tests (Playwright)

```bash
# Run e2e tests (starts dev server automatically)
npm run test:e2e

# Run with headed browser for debugging
npx playwright test --headed

# Run specific test file
npx playwright test e2e/smoke.spec.ts
```

### Linting and Type Checking

```bash
# ESLint
npm run lint

# TypeScript
npm run typecheck

# Prettier format check
npm run format:check
```

### Bundle Analysis

```bash
npm run analyze
```

This runs a production build with `@next/bundle-analyzer` enabled, opening an interactive treemap showing the size of every module.

---

## Troubleshooting

### SSR Crash: `TypeError: Cannot read properties of undefined (reading 'S')`

This error occurs when browser-only libraries (Three.js, Tone.js, OSMD) are imported from server-rendered components.

**Fix:** Use `next/dynamic` with `{ ssr: false }` in `page.tsx`:

```tsx
import dynamic from "next/dynamic";

const HeroSection = dynamic(
  () => import("@/components/hero/HeroSection"),
  { ssr: false }
);
```

The `"use client"` directive alone does NOT prevent SSR. Only `{ ssr: false }` does.

For full details, see [docs/SSR-GOTCHAS.md](docs/SSR-GOTCHAS.md).

### Audio Not Playing

1. **Browser autoplay policy:** Audio requires a user interaction before playing. Ensure `audioContextStarted` is set in the Zustand store after the first click.
2. **CORS error:** The requesting domain must be in the R2 CORS allow list. Check `elevare-scribe.vercel.app` and `localhost:3000` are configured.
3. **CSP blocking:** Verify the `media-src` and `connect-src` directives in `next.config.mjs` include the R2 domain.

### WebGL Not Rendering

1. **Browser support:** Check `chrome://gpu` or equivalent. WebGL2 must be enabled.
2. **SSR issue:** Ensure the component using Three.js/R3F is behind a `{ ssr: false }` boundary.
3. **Console errors:** Check DevTools Console for shader compilation errors or WebGL context loss.

### Fonts Not Loading

1. **Clash Display:** Verify woff2 files exist in `src/app/fonts/`. These are loaded via `next/font/local`.
2. **Inter / Cormorant Garamond:** Loaded via `next/font/google`. Requires network access on first load.
3. **Font swap:** All fonts use `display: "swap"`. A brief flash of system fonts is expected on first visit.

---

## Architecture Overview

Elevare Scribe uses a three-tier architecture:

```
┌─────────────────────────────────┐
│  Client (Next.js on Vercel)     │
│  Three.js / Tone.js / OSMD     │
│  Zustand state management       │
└──────────────┬──────────────────┘
               │
       HTTPS / API Routes
               │
┌──────────────▼──────────────────┐
│  Backend API (Next.js Routes)   │
│  Supabase (PostgreSQL + Auth)   │
│  Redis/BullMQ (Upstash)         │
│  Cloudflare R2 (file storage)   │
└──────────────┬──────────────────┘
               │
          Redis Queue
               │
┌──────────────▼──────────────────┐
│  Python AI Microservice         │
│  FastAPI + Demucs + Basic Pitch │
│  WhisperX + music21             │
│  GPU: Replicate → RunPod        │
└─────────────────────────────────┘
```

**Data flow:** User pastes Suno URL -> API creates project -> Python pipeline extracts audio, separates stems, transcribes to MIDI, aligns lyrics, generates MusicXML -> stored in R2 -> frontend renders via OSMD + Tone.js.

For the full architecture document, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Deployment

### Production

Vercel auto-deploys from the `main` branch. Every push to `main` triggers a production deployment to `elevare-scribe.vercel.app`.

### Preview Deployments

Every push to a feature branch or pull request creates a preview deployment with a unique URL.

### Rollback

To roll back a broken deployment, go to the Vercel dashboard, find the last working deployment under **Deployments**, and select **Promote to Production**.

For the full release process, see [docs/RELEASE-PROCESS.md](docs/RELEASE-PROCESS.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, external services |
| [docs/SSR-GOTCHAS.md](docs/SSR-GOTCHAS.md) | SSR crash analysis and import policy |
| [docs/AUDIO-CONFIG.md](docs/AUDIO-CONFIG.md) | Cloudflare R2 audio configuration |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Colors, typography, animation principles |
| [docs/PHASE-LOG.md](docs/PHASE-LOG.md) | Build phase completion log |
| [docs/BUNDLE-REPORT.md](docs/BUNDLE-REPORT.md) | Bundle analysis and JS budget |
| [docs/PERFORMANCE-BUDGET.md](docs/PERFORMANCE-BUDGET.md) | Performance targets and budgets |
| [docs/ACCESSIBILITY-REPORT.md](docs/ACCESSIBILITY-REPORT.md) | Accessibility gaps and compliance |
| [docs/RELEASE-PROCESS.md](docs/RELEASE-PROCESS.md) | Versioning, tagging, deployment |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](SECURITY.md) | Security policies |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [CLAUDE.md](CLAUDE.md) | AI assistant project context |

---

## License

Confidential. All rights reserved by Elevare Edge LLC.
