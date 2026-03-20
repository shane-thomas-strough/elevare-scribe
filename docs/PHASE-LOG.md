# Phase Log — Elevare Scribe

This document records every completed build phase, what was built, what was verified, and what issues were encountered and resolved.

---

## Phase 0 — Repository + Deployment

**Status:** Complete

### What Was Built

- Initialized Git repository
- Created GitHub repository under Elevare Edge organization
- Connected Vercel project with auto-deploy from `main` branch
- Configured `vercel.json` with framework, build command, and output directory
- Domain setup for `elevare-scribe.vercel.app`

### What Was Verified

- Push to `main` triggers Vercel build and deployment automatically
- Deployment URL is accessible and serves the default Next.js page
- Git hooks (Husky) are installed via `prepare` script

### Issues Encountered

None. Clean setup.

---

## Phase 1 — Foundation Architecture

**Status:** Complete

### What Was Built

- Next.js 14 App Router project with TypeScript strict mode
- Installed all core dependencies:
  - `three`, `@react-three/fiber`, `@react-three/drei` (WebGL)
  - `gsap`, `@gsap/react` (scroll animations)
  - `framer-motion` (component animations)
  - `tone` (audio engine)
  - `opensheetmusicdisplay` (sheet music rendering)
  - `zustand` (state management)
  - `tailwindcss`, `tailwindcss-animate`, `tw-animate-css` (styling)
  - `shadcn` + `class-variance-authority`, `clsx`, `tailwind-merge` (UI primitives)
  - `lucide-react` (icons)
- Configured Tailwind with complete Elevare Scribe design system colors (`es-*` tokens)
- Registered custom font families in `tailwind.config.ts`: `font-clash`, `font-inter`, `font-cormorant`, `font-mono`
- Set up font loading in `layout.tsx`:
  - Clash Display via `next/font/local` (woff2 files in `src/app/fonts/`)
  - Inter via `next/font/google`
  - Cormorant Garamond via `next/font/google`
- Created Zustand global store at `src/store/useAppStore.ts` with all state fields and actions
- Configured dev tooling:
  - ESLint with `eslint-config-next` and `eslint-plugin-jsx-a11y`
  - Prettier for code formatting
  - Husky + lint-staged for pre-commit hooks
  - Vitest with jsdom environment, React plugin, path aliases, 80% coverage thresholds
  - Playwright for e2e testing (Chromium)
  - `@next/bundle-analyzer` for bundle analysis
  - Sentry integration (`@sentry/nextjs`)
  - Zod for runtime validation
- Set up `CLAUDE.md` with complete project context for AI-assisted development

### What Was Verified

- `npm run dev` starts without errors
- `npm run build` produces a clean production build
- `npm run lint` passes with zero warnings
- `npm run typecheck` passes with zero errors
- Tailwind custom colors render correctly
- Zustand store initializes with correct defaults
- Font files load with `display: swap` (no FOIT)

### Issues Encountered

None. Foundation was established cleanly before any UI work began.

---

## Phase 2 — WebGL Hero

**Status:** Complete

### What Was Built

- `HeroSection` component (`src/components/hero/HeroSection.tsx`) — composed wrapper
- `HeroCanvas` component (`src/components/hero/HeroCanvas.tsx`) — React Three Fiber canvas with custom GLSL shader producing generative fluid waveforms
- `HeroOverlay` component (`src/components/hero/HeroOverlay.tsx`) — text overlay with hero headline, subheadline, and CTA
- `DemoInput` component (`src/components/hero/DemoInput.tsx`) — URL paste input field; triggers stem separation animation via Zustand
- Custom GLSL fragment shader with mouse-reactive waveform distortion
- Shader uniforms driven by `mouseCoordinates` from Zustand store at 60fps
- Stem separation WebGL animation triggered when `demoLinkPasted` becomes `true`

### What Was Verified

- WebGL canvas renders on desktop Chrome, Firefox, Safari, Edge
- Mouse movement produces visible shader response at 60fps
- Pasting a URL in the demo input triggers the stem separation animation
- Text overlay is readable over the WebGL canvas
- No console errors or WebGL warnings in production build

### Issues Encountered

None during Phase 2 itself. The SSR crash was discovered later (see SSR Fix below).

---

## Phase 3 — Playable How It Works

**Status:** Complete

### What Was Built

- `HowItWorks` section (`src/components/how-it-works/HowItWorks.tsx`) — wrapper with GSAP ScrollTrigger sticky behavior
- `StepList` component (`src/components/how-it-works/StepList.tsx`) — navigation for 6 interactive steps
- `PreviewPane` component (`src/components/how-it-works/PreviewPane.tsx`) — preview container that swaps content per step
- Six step preview components:
  - `Step1Preview` — URL paste demonstration
  - `Step2Preview` — Stem separation visualization
  - `Step3Preview` — Real-time pitch shifting with Tone.js slider (reads/writes `currentPitchShift`)
  - `Step4Preview` — Arrangement editing preview
  - `Step5Preview` — OSMD sheet music rendering with MusicXML transposition
  - `Step6Preview` — Export and performance preview
- Tone.js integration for real-time pitch shifting with `PitchShift` node
- OpenSheetMusicDisplay integration for rendering MusicXML as interactive notation
- All 6 steps are interactive — the user hears pitch shift and sees notation update

### What Was Verified

- GSAP ScrollTrigger pins the section correctly during scroll
- Step navigation highlights the active step
- Tone.js pitch shift slider produces audible real-time pitch changes
- OSMD renders MusicXML notation and transposes when pitch shift changes
- All six preview panes render their content correctly
- Audio playback works after user interaction (AudioContext policy compliance)

### Issues Encountered

- **AudioContext autoplay policy:** Browsers block AudioContext creation until user interaction. Solved by gating Tone.js initialization on `audioContextStarted` from Zustand, set `true` only on first user click/tap.
- **OSMD container sizing:** OSMD required explicit container dimensions. Fixed by setting container width/height before calling `render()`.

---

## Audio Migration — Cloudflare R2

**Status:** Complete

### What Was Done

- Created Cloudflare R2 bucket: `elevare-scribe-audio`
- Uploaded three demo tracks via `wrangler r2 object put`:
  - `No-Hay-Quizás-Demo.wav`
  - `Hammocks-and-Hardhats-Demo.wav`
  - `Double-Overhead-v2-Demo.wav`
- Configured CORS on R2 bucket to allow `elevare-scribe.vercel.app` and `localhost:3000`
- Created `src/config/audio.ts` with centralized R2 URLs
- Updated all audio-consuming components to import from `audio.ts` instead of using local paths or hardcoded URLs
- Updated `next.config.mjs` CSP to allow `media-src` and `connect-src` from R2 public URL
- Removed local audio files from the Git repository to reduce repo size

### What Was Verified

- All three tracks play correctly from R2 URLs in local development
- All three tracks play correctly on deployed Vercel instance
- CORS headers are present in R2 responses for allowed origins
- CSP does not block audio loading
- No audio files remain in the Git repo

### Issues Encountered

- **CORS preflight:** Initially forgot to configure CORS on the R2 bucket. Browsers blocked cross-origin audio fetches. Fixed by adding CORS rules via Cloudflare dashboard.
- **CSP media-src:** Initial CSP did not include the R2 domain in `media-src`. Audio loaded via `<audio>` tag was blocked. Fixed by adding R2 URL to both `media-src` and `connect-src` directives.

---

## SSR Crash Fix

**Status:** Complete

### What Was Done

- Diagnosed production build crash: `TypeError: Cannot read properties of undefined (reading 'S')`
- Root cause: `page.tsx` used regular ES imports for `HeroSection` and `HowItWorks`, which transitively import Three.js, Tone.js, and OSMD — all of which crash in Node.js during SSR
- Fix: Changed `page.tsx` to use `next/dynamic` with `{ ssr: false }` for both components
- Documented the SSR import policy in `CLAUDE.md` and `docs/SSR-GOTCHAS.md`
- Audited all imports to ensure no other browser-only libraries are imported from server components

### What Was Verified

- `npm run build` completes successfully with zero errors
- Production deployment on Vercel succeeds
- All client-only components render correctly after hydration
- No regression in WebGL, audio, or sheet music functionality

### Issues Encountered

- **Misleading error message:** The `Cannot read properties of undefined (reading 'S')` error pointed to minified Three.js code, making it difficult to trace. The actual issue was module evaluation in Node.js attempting to access `window`.
- **Common misconception:** The `"use client"` directive was initially assumed to prevent SSR. It does not — it only marks the module boundary. Components still SSR-render. Only `dynamic(..., { ssr: false })` prevents SSR execution.
