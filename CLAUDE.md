# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Elevare Scribe is the end-to-end operating system for independent AI-assisted musicians. It takes a Suno/Udio share link as input and produces a complete performance package: sheet music, tabs, transposed arrangements, backing tracks, copyright documentation, and a stage-ready interface. Seven-stage flywheel: Create > Process > Arrange > Practice > Protect > Perform > Monetize.

**This is not a standard SaaS landing page.** It is an immersive, generative browser experience built on MIT Media Lab + SpaceX design philosophies. The interface demonstrates the product by being the product. The visitor feels it working before they sign up.

## Critical Implementation Rules

- The hero uses React Three Fiber WebGL with custom GLSL shaders -- do not replace with video, static images, or particle effects
- The How It Works section uses Tone.js for real-time audio manipulation -- the user must hear the pitch shift, not just see it
- The Gig Mode section is a full browser takeover -- do not reduce to a standard page section
- The Founder Story uses GSAP horizontal scroll hijack -- do not replace with vertical layout
- The hero input field is the primary conversion touchpoint -- product experience begins before account creation (the Figma principle)
- Two animation libraries with strict domain separation: GSAP + ScrollTrigger for scroll-driven animations; Framer Motion for component-level transitions. Never cross them.

## Tech Stack

### Frontend (Next.js)
- **Framework:** Next.js 14 (App Router), TypeScript strict mode, Tailwind CSS + shadcn/ui
- **WebGL:** Three.js + @react-three/fiber + @react-three/drei (generative hero, GLSL shaders)
- **Scroll Animation:** GSAP + @gsap/react + ScrollTrigger (scroll hijacking, horizontal timeline, sticky scroll)
- **Component Animation:** Framer Motion (transitions, hovers, modals, micro-interactions)
- **Sheet Music:** OpenSheetMusicDisplay (OSMD) -- renders MusicXML as interactive notation
- **Audio Engine:** Tone.js (real-time pitch shifting, synchronized playback, stem mixing)
- **Audio Export:** ffmpeg.wasm (in-browser stem mixing and WAV/MP3 export)
- **State Management:** Zustand (global store in `useAppStore.ts`)
- **Real-Time Sync:** Supabase Realtime (WebSockets for Band Sync in Gig Mode)
- **Payments:** Stripe + Stripe Connect
- **Analytics:** PostHog
- **Hosting:** Vercel

### Backend API (Node.js)
- Next.js API Routes for orchestration
- PostgreSQL via Supabase (users, projects, song metadata)
- Redis + BullMQ via Upstash (async job queue)
- Cloudflare R2 (file storage: MP3s, stems, MusicXML, PDFs)
- Supabase Auth (email/password + Google OAuth)
- Resend (transactional email)

### Python AI Microservice (FastAPI)
- **Ingestion:** yt-dlp (audio/lyrics extraction from Suno/Udio URLs)
- **Stem Separation:** Demucs v4 (Meta) -- separates vocals, guitar, bass, drums, other
- **AMT Transcription:** Spotify Basic Pitch -- runs on isolated stems, never on master mix
- **Lyric Alignment:** WhisperX -- forced alignment of lyrics to vocal timestamps
- **Music Theory:** music21 (chord analysis, simplification, MusicXML generation)
- **Fretboard Logic:** Custom constraint-satisfaction algorithm for guitar tab optimization
- **GPU Hosting:** Replicate.com API (Phase 1) > RunPod dedicated GPU (Phase 2)

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (includes jsx-a11y)
npm run typecheck    # TypeScript strict mode check
npm run test         # Vitest unit tests
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright E2E tests
npm run format       # Prettier format
npm run analyze      # Bundle analysis (ANALYZE=true)
```

## Architecture

Three-tier microservices architecture:

1. **Frontend (Vercel):** Next.js App Router. SSR for SEO on marketplace/public pages, client components for WebGL/audio. The landing page itself is a product demo environment -- WebGL canvas, Tone.js engine, and OSMD renderer are working instances of core product features in a pre-auth context.

2. **Backend API (Next.js API Routes):** Orchestration layer. Receives URLs, creates projects in PostgreSQL, enqueues jobs to Redis/BullMQ. Frontend polls for completion status.

3. **Python AI Microservice (FastAPI):** Listens to Redis queue. Executes the Tri-Engine pipeline: Demucs stem separation > Basic Pitch AMT transcription > WhisperX lyric alignment > music21 chord analysis. Outputs MusicXML + stems to Cloudflare R2.

**Data Flow:** User pastes Suno URL > WebGL stem animation plays (pre-auth) > account gate > API receives URL > Python scraper extracts MP3/lyrics > Demucs separates stems > Basic Pitch transcribes per-stem MIDI > WhisperX aligns lyrics > music21 generates MusicXML > stored in R2 > frontend renders via OSMD + Tone.js.

## Zustand Global State (`useAppStore.ts`)

Must be initialized before any UI. All interactive elements read/write this store:

- `audioContextStarted: boolean` -- Web Audio API init status
- `currentStemVolumes: { vocal, guitar, bass, drums: number }`
- `isGigModeActive: boolean` -- triggers full browser takeover
- `mouseCoordinates: { x, y: number }` -- drives WebGL shader reactivity at 60fps
- `currentPitchShift: number` -- drives Tone.js PitchShift + OSMD transposition
- `demoLinkPasted: boolean` -- triggers hero stem separation WebGL animation
- `activeStemVisualization: string[]` -- which stems are currently highlighted

## Design System

### Color Palette
| Role | Hex |
|------|-----|
| Background Primary | `#0A0A0F` |
| Background Secondary | `#12121A` |
| Background Tertiary | `#1A1A28` |
| Accent Cyan (Stem 1: Vocal) | `#00D4FF` |
| Accent Gold (Stem 2: Guitar) | `#C7973A` |
| Accent Purple (Stem 3: Bass) | `#7B2FBE` |
| Accent Green (Stem 4: Drums) | `#00FF88` |
| Text Primary | `#F0F0F8` |
| Text Secondary | `#8888AA` |
| Text Tertiary | `#555575` |
| Gig Mode Black | `#000000` |
| Border Subtle | `#FFFFFF08` |

### Typography
- **Hero Headlines:** Clash Display Bold (96px desktop / 56px mobile) -- via Fontshare
- **Section Headlines:** Clash Display Medium (48px / 32px)
- **Body Copy:** Inter Regular/Medium (18px body, 14px small)
- **Founder Story:** Cormorant Garamond Italic (24px)
- **Code/Input:** JetBrains Mono
- **Gig Mode Chords:** Clash Display Bold (200px+)

## Five-Phase Build Sequence

Build in exact order. Do not skip phases. Each phase is a checkpoint.

1. **Phase 0 -- Repository + Deployment:** Git init, GitHub repo, Vercel auto-deploy, domain setup
2. **Phase 1 -- Foundation Architecture:** Next.js 14 + all dependencies + Zustand store + Tailwind theme + fonts. No UI yet.
3. **Phase 2 -- WebGL Hero:** React Three Fiber canvas, custom GLSL shader (fluid waveforms reacting to mouse), demo input field, stem separation animation, account gate
4. **Phase 3 -- Playable How It Works:** GSAP ScrollTrigger sticky section, Tone.js real-time pitch shifting with slider, OSMD MusicXML transposition, interactive stem visualization
5. **Phase 4 -- Gig Mode Browser Takeover:** Full-screen blackout, cursor:none + CSS spotlight, mix-blend-mode chord reveal, ambient stage audio, 8-second experience
6. **Phase 5 -- GSAP Horizontal Founder Timeline:** 4-stop horizontal scroll (xPercent:-100 over 4 scroll lengths), gold wash background, waveform > flatline > product reveal narrative

## Required Content Assets

These must exist before their respective phases:
- `No Hay Quizas` 10-second audio clip (Phases 3-4) -- normalized to -14 LUFS
- `No Hay Quizas` simplified MusicXML (Phase 3) -- Am, F, C, G, 8-16 measures
- 5-second ambient stage room noise (Phase 4) -- CC0 from freesound.org
- Clash Display font files (Phase 1) -- from Fontshare.com

## Performance Targets

- Lighthouse desktop: 90+ (WebGL impacts score -- acceptable)
- Lighthouse mobile: 80+
- FCP < 1.5s, LCP < 3.0s, TTI < 4.0s
- WebGL: 60fps (30fps graceful degradation)
- Tone.js pitch shift: < 50ms latency
- OSMD transposition: < 200ms visual update
- Progressive enhancement: CSS gradient fallback if WebGL unavailable

## Key Product Sections (13 total)

Navigation (sticky, glass morphism) > Hero (WebGL + demo input) > Problem > Value Props (3 cards) > How It Works (6 interactive steps) > Features Grid (6 cards) + Gig Mode (browser takeover) > Differentiation > Founder Story (GSAP horizontal) > Who It's For (4 persona cards) > Social Proof > Pricing (4 tiers: Free/$0, Pro/$12mo, Founding Artist/$149 once, Enterprise/$99mo) > FAQ (accordion) > Final CTA > Footer

## SSR-Safe Import Policy

These libraries MUST be imported with `dynamic(() => import(...), { ssr: false })` or inside `useEffect` with dynamic `import()`:
- `three`, `@react-three/fiber`, `@react-three/drei` -- WebGL requires browser globals
- `tone` -- Web Audio API requires browser context
- `opensheetmusicdisplay` -- DOM rendering requires browser environment
- `gsap`, `gsap/ScrollTrigger` -- ScrollTrigger requires DOM measurements

Never import these at module top level in components that may SSR. See `docs/SSR-GOTCHAS.md` for full policy.

## Engineering Standard (Permanent)

This project operates under a permanent professional engineering standard. No exceptions, no shortcuts, no partial implementations.

**Non-Claim Policy:** Do not claim work is complete unless:
- Every required file exists
- `npm run lint` passes with zero errors
- `npm run typecheck` passes with zero errors
- `npm run test` passes
- `npm run build` passes
- Evidence is shown for each claim

**Quality gates enforced by CI:**
- ESLint with jsx-a11y accessibility rules
- TypeScript strict mode with `noUncheckedIndexedAccess`
- Vitest unit tests (80% coverage threshold)
- Playwright E2E smoke tests
- Husky pre-commit hooks (Prettier + ESLint + TypeScript)

**Documentation requirements:**
- All docs in `docs/` directory must stay current
- CHANGELOG.md updated for every version
- CONTRIBUTING.md followed for all PRs

**Error handling requirements:**
- Global ErrorBoundary wraps the app
- WebGL has CSS gradient fallback (WebGLFallback.tsx)
- Audio has visual-only fallback (AudioFallback.tsx)
- No raw errors shown to users

## Environment Variables

All secrets live in `.env.local` (never committed to git). The committable reference template is `.env.example`.

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_R2_BASE` | Client | Cloudflare R2 public base URL for audio CDN |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key (safe to expose) |
| `STRIPE_SECRET_KEY` | Server only | Stripe secret key -- never expose client-side |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signing secret for signature verification |
| `STRIPE_FOUNDING_ARTIST_PRICE_ID` | Server only | Stripe Price ID for $149 Founding Artist one-time product |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Server only | Stripe Price ID for $12/month Pro subscription |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Server only | Stripe Price ID for $10/month annual Pro subscription |
| `NEXT_PUBLIC_APP_URL` | Client | Full production URL (e.g. `https://elevarescribe.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key -- never expose client-side |

**Rules:**
- Real values go in `.env.local` only -- this file is gitignored via `.env*.local`
- `.env.example` contains placeholder values and is committed to git as a reference
- `NEXT_PUBLIC_` prefixed vars are embedded in the client bundle -- only use for non-secret values
- Server-only vars (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) are only accessible in API routes

**Updating Vercel env vars from `.env.local`:**
```bash
vercel env rm <NAME> production --yes
vercel env add <NAME> production --value "<value>" --yes
vercel --prod --yes  # redeploy to pick up changes
```

## Key Rotation Procedure

**Never paste secrets into chat, PRs, issues, or any logged context.** Rotate keys using the service dashboards and update Vercel directly from `.env.local`.

### Stripe key rotation
1. Go to dashboard.stripe.com > Developers > API Keys
2. Click "Roll key" on the secret key -- Stripe generates a new one immediately
3. Copy the new `sk_live_...` value
4. Update `.env.local` locally with the new value
5. Update Vercel: `vercel env rm STRIPE_SECRET_KEY production --yes && vercel env add STRIPE_SECRET_KEY production --value "sk_live_NEW_KEY" --yes`
6. For webhook secret: Developers > Webhooks > your endpoint > Roll secret
7. Update `STRIPE_WEBHOOK_SECRET` in `.env.local` and Vercel the same way
8. Redeploy: `vercel --prod --yes`

### Supabase key rotation
1. Go to supabase.com > Project Settings > API
2. Click "Generate a new key" for the service role key
3. Copy the new `ey...` value
4. Update `.env.local` locally
5. Update Vercel: `vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes && vercel env add SUPABASE_SERVICE_ROLE_KEY production --value "eyNEW_KEY" --yes`
6. Redeploy: `vercel --prod --yes`

### After any rotation
- Verify the deployment works: check `https://elevarescribe.com/health`
- Test a waitlist signup to confirm Supabase connectivity
- Test a Stripe checkout flow to confirm payment works

## Confidentiality

This project is pre-seed / founding stage. All documents are confidential to Elevare Edge LLC.
