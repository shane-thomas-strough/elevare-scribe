# Elevare Scribe — Architecture

## Overview

Elevare Scribe is a three-tier microservices application that transforms AI-generated music (from Suno/Udio) into performance-ready sheet music, transposed arrangements, stem-separated backing tracks, and a stage-ready live interface. The landing page itself is an immersive product demo: WebGL visuals, real-time audio manipulation, and interactive notation rendering all run in the browser before the user creates an account.

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                                  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Three.js /   │  │  Tone.js     │  │  OSMD        │  │  GSAP       │  │
│  │  R3F / Drei   │  │  Audio       │  │  Sheet Music │  │  Scroll     │  │
│  │  WebGL Hero   │  │  Engine      │  │  Renderer    │  │  Animations │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         │                 │                 │                  │          │
│         └────────────┬────┴─────────────────┴──────────────────┘          │
│                      │                                                   │
│              ┌───────▼────────┐                                          │
│              │  Zustand Store  │  (useAppStore.ts)                        │
│              │  Global State   │                                          │
│              └───────┬────────┘                                          │
│                      │                                                   │
│  ┌───────────────────▼──────────────────────────────────────────────┐    │
│  │              Next.js 14 App Router (Vercel)                       │    │
│  │  ┌─────────┐  ┌───────────────┐  ┌────────────┐  ┌───────────┐  │    │
│  │  │ page.tsx │  │ HeroSection   │  │ HowItWorks │  │ GigMode   │  │    │
│  │  │ (SSR)   │  │ (client-only) │  │ (client)   │  │ (client)  │  │    │
│  │  └─────────┘  └───────────────┘  └────────────┘  └───────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                          HTTPS / fetch
                                   │
┌──────────────────────────────────▼───────────────────────────────────────┐
│                    BACKEND API (Next.js API Routes)                      │
│                                                                          │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────────┐  │
│  │  Supabase    │  │  Redis/BullMQ  │  │  Cloudflare R2              │  │
│  │  PostgreSQL  │  │  (Upstash)     │  │  (elevare-scribe-audio)     │  │
│  │  + Auth      │  │  Job Queue     │  │  Audio/Stems/MusicXML/PDF   │  │
│  └──────┬───────┘  └───────┬────────┘  └──────────────┬──────────────┘  │
│         │                  │                           │                 │
│  ┌──────▼──────┐    ┌──────▼──────┐                    │                 │
│  │ Supabase    │    │  Resend     │                    │                 │
│  │ Realtime    │    │  Email      │                    │                 │
│  │ (WebSocket) │    └─────────────┘                    │                 │
│  └─────────────┘                                       │                 │
└─────────────────────────────┬──────────────────────────┘─────────────────┘
                              │
                     Redis Queue / HTTP
                              │
┌─────────────────────────────▼────────────────────────────────────────────┐
│                  PYTHON AI MICROSERVICE (FastAPI)                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    Tri-Engine Pipeline                             │    │
│  │                                                                   │    │
│  │  1. yt-dlp          Extract audio/lyrics from Suno/Udio URL       │    │
│  │  2. Demucs v4       Stem separation (vocals, guitar, bass, drums) │    │
│  │  3. Basic Pitch     AMT transcription per isolated stem           │    │
│  │  4. WhisperX        Forced lyric alignment to vocal timestamps    │    │
│  │  5. music21         Chord analysis + MusicXML generation          │    │
│  │  6. Tab Optimizer   Custom CSP for guitar tab fingering           │    │
│  │                                                                   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  GPU Hosting: Replicate.com (Phase 1) → RunPod (Phase 2)                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Suno URL to Rendered Sheet Music

```
User pastes Suno URL in hero input
        │
        ▼
WebGL stem separation animation plays (pre-auth demo experience)
        │
        ▼
Account gate — user signs up / logs in via Supabase Auth
        │
        ▼
POST /api/projects — creates project record in PostgreSQL
        │
        ▼
BullMQ job enqueued in Redis (Upstash)
        │
        ▼
Python microservice picks up job from queue
        │
        ▼
yt-dlp extracts MP3 + lyrics from Suno URL
        │
        ▼
Demucs v4 separates into stems: vocal, guitar, bass, drums, other
        │
        ▼
Basic Pitch transcribes each isolated stem to MIDI
  (never runs on master mix — always on isolated stems)
        │
        ▼
WhisperX aligns lyrics to vocal timestamps (forced alignment)
        │
        ▼
music21 performs chord analysis, simplification, MusicXML generation
        │
        ▼
All outputs (stems WAV, MusicXML, metadata) stored in Cloudflare R2
        │
        ▼
Job status updated in Redis — frontend polls for completion
        │
        ▼
Frontend fetches MusicXML from R2, renders via OSMD
Frontend fetches stems from R2, plays via Tone.js
User manipulates pitch, arrangement, stem mix in real time
```

---

## External Services

| Service | Purpose | Environment Variable(s) |
|---------|---------|------------------------|
| **Vercel** | Frontend hosting, edge functions, auto-deploy from `main` | Automatic via Vercel CLI |
| **Supabase** | PostgreSQL database, Auth (email + Google OAuth), Realtime WebSockets | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Cloudflare R2** | File storage CDN for audio, stems, MusicXML, PDFs | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| **Upstash** | Redis + BullMQ async job queue | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Replicate** | GPU hosting for Python AI pipeline (Phase 1) | `REPLICATE_API_TOKEN` |
| **Stripe** | Payments + Stripe Connect for artist payouts | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Resend** | Transactional email | `RESEND_API_KEY` |
| **PostHog** | Product analytics | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| **Sentry** | Error tracking and performance monitoring | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |

---

## SSR-Sensitive Modules and Client-Only Boundaries

The following libraries crash when imported in a Node.js SSR context. They must **always** be loaded via `next/dynamic` with `{ ssr: false }`.

| Library | Why It Crashes in SSR | Where Used |
|---------|----------------------|------------|
| `three` | Requires `window`, `document`, WebGL context | HeroCanvas, HeroSection |
| `@react-three/fiber` | Wraps Three.js, requires DOM | HeroCanvas, HeroSection |
| `@react-three/drei` | Three.js helpers, requires WebGL | HeroCanvas |
| `tone` | Requires Web Audio API (`AudioContext`) | Step3Preview, Step5Preview, HowItWorks |
| `opensheetmusicdisplay` | Requires DOM (`document.createElement`) | Step5Preview, HowItWorks |

**Import policy:** In `page.tsx` (or any server component that renders these), always use:

```tsx
const HeroSection = dynamic(
  () => import("@/components/hero/HeroSection"),
  { ssr: false }
);
```

Never use regular `import HeroSection from "..."` for components that transitively depend on the libraries above. See `docs/SSR-GOTCHAS.md` for the full incident report.

---

## Zustand Store Ownership

The global store lives at `src/store/useAppStore.ts`. It is the single source of truth for all cross-component reactive state. Components read from and write to this store; they never manage shared state locally.

### State Fields

| Field | Type | Default | Owner / Consumer |
|-------|------|---------|-----------------|
| `audioContextStarted` | `boolean` | `false` | Set by first user interaction; guards all Tone.js operations |
| `currentStemVolumes` | `{ vocal, guitar, bass, drums: number }` | All `1` | Stem mixer UI, WebGL visualizer, Tone.js playback |
| `isGigModeActive` | `boolean` | `false` | Gig Mode toggle; triggers full browser takeover |
| `mouseCoordinates` | `{ x, y: number }` | `{ x: 0, y: 0 }` | Tracked at 60fps; drives WebGL shader reactivity |
| `currentPitchShift` | `number` | `0` | Pitch slider; drives Tone.js PitchShift + OSMD transposition |
| `demoLinkPasted` | `boolean` | `false` | Hero input field; triggers stem separation WebGL animation |
| `activeStemVisualization` | `string[]` | `[]` | Which stems are currently highlighted in the visualizer |

### Actions

| Action | Signature | Purpose |
|--------|-----------|---------|
| `setAudioContextStarted` | `(started: boolean) => void` | Initialize Web Audio API on first interaction |
| `setStemVolume` | `(stem: keyof StemVolumes, volume: number) => void` | Adjust individual stem volume |
| `setGigModeActive` | `(active: boolean) => void` | Enter/exit Gig Mode |
| `setMouseCoordinates` | `(coords: { x, y }) => void` | Update mouse position for shader |
| `setCurrentPitchShift` | `(shift: number) => void` | Change pitch shift value |
| `setDemoLinkPasted` | `(pasted: boolean) => void` | Signal that demo URL was pasted |
| `setActiveStemVisualization` | `(stems: string[]) => void` | Set active stem highlights |

---

## Directory Structure

```
elevare-scribe/
├── docs/                        # Project documentation
├── e2e/                         # Playwright end-to-end tests
├── public/
│   └── audio/                   # Local audio fallbacks (dev only)
├── src/
│   ├── app/
│   │   ├── fonts/               # Clash Display woff2 files
│   │   ├── globals.css          # Tailwind + CSS custom properties
│   │   ├── layout.tsx           # Root layout (fonts, metadata)
│   │   └── page.tsx             # Home page (dynamic imports, ssr:false)
│   ├── components/
│   │   ├── hero/                # WebGL hero section
│   │   │   ├── HeroCanvas.tsx   # Three.js/R3F canvas
│   │   │   ├── HeroOverlay.tsx  # Text overlay, CTA
│   │   │   ├── HeroSection.tsx  # Composed hero component
│   │   │   └── DemoInput.tsx    # URL paste input field
│   │   ├── how-it-works/        # Interactive 6-step section
│   │   │   ├── HowItWorks.tsx   # Section wrapper
│   │   │   ├── StepList.tsx     # Step navigation
│   │   │   ├── PreviewPane.tsx  # Preview container
│   │   │   └── Step[1-6]Preview.tsx  # Individual step previews
│   │   └── ui/                  # shadcn/ui primitives
│   ├── config/
│   │   └── audio.ts             # R2 audio URLs
│   ├── lib/
│   │   └── utils.ts             # Utility functions (cn helper)
│   ├── store/
│   │   └── useAppStore.ts       # Zustand global store
│   └── test/
│       └── setup.ts             # Vitest setup
├── CHANGELOG.md
├── CLAUDE.md                    # AI assistant context
├── CODEOWNERS
├── CONTRIBUTING.md
├── SECURITY.md
├── next.config.mjs              # Next.js config + security headers + CSP
├── package.json
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── vitest.config.ts
```

---

## Key Architectural Decisions

1. **SSR with client-only islands:** `page.tsx` is a server component that dynamically imports client-only sections with `{ ssr: false }`. This gives us fast initial HTML delivery while keeping browser-only libraries (Three.js, Tone.js, OSMD) safely client-side.

2. **Animation domain separation:** GSAP with ScrollTrigger handles all scroll-driven animations (horizontal scroll hijack, sticky sections, parallax). Framer Motion handles component-level transitions (hover states, modals, micro-interactions). These two systems must never be mixed within the same animation.

3. **Zustand over React Context:** Zustand was chosen for its minimal boilerplate, selector-based re-render optimization, and compatibility with both SSR and client contexts. The store is framework-agnostic and can be tested in isolation.

4. **Cloudflare R2 for audio CDN:** Audio assets are served from R2's public bucket rather than Vercel's static assets to avoid bloating the deployment and to leverage R2's edge caching and zero egress fees.

5. **Python microservice isolation:** The AI pipeline (Demucs, Basic Pitch, WhisperX, music21) runs as a separate FastAPI service on GPU hardware. This keeps the Next.js frontend lightweight and allows independent scaling of compute-intensive operations.
