# Changelog

All notable changes to Elevare Scribe are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-03-20

### Added
- Comprehensive project documentation suite in `docs/`
  - `ARCHITECTURE.md` — three-tier system architecture with ASCII diagrams and data flow
  - `SSR-GOTCHAS.md` — full incident report and import policy for browser-only libraries
  - `AUDIO-CONFIG.md` — Cloudflare R2 configuration, upload guide, failure modes
  - `DESIGN-SYSTEM.md` — complete color tokens, typography specs, animation principles
  - `PHASE-LOG.md` — detailed log of all completed build phases
  - `BUNDLE-REPORT.md` — known heavy dependencies and JS budget targets
  - `PERFORMANCE-BUDGET.md` — Core Web Vitals targets and rendering budgets
  - `ACCESSIBILITY-REPORT.md` — known gaps and WCAG compliance checklist
  - `RELEASE-PROCESS.md` — versioning, tagging, deployment, and rollback procedures
- `CONTRIBUTING.md` with build sequence, conventions, and testing requirements
- `SECURITY.md` with secret handling, reporting process, and CSP documentation
- `CODEOWNERS` file for code review routing
- Professional `README.md` with setup, build commands, architecture, and troubleshooting

### Changed
- Replaced default Next.js README with project-specific documentation
- Applied professional engineering documentation standards across the repository

## [0.3.3] - 2026-03-20

### Fixed
- **SSR crash:** `TypeError: Cannot read properties of undefined (reading 'S')` during `npm run build`
  - Root cause: `page.tsx` imported `HeroSection` and `HowItWorks` as regular ES imports; Three.js, Tone.js, and OSMD crash when evaluated in Node.js during SSR
  - Fix: Changed to `next/dynamic` with `{ ssr: false }` for both components in `page.tsx`
  - Documented SSR import policy in `CLAUDE.md`

## [0.3.2] - 2026-03-19

### Changed
- **Audio CDN migration:** Moved all demo audio files from local storage to Cloudflare R2
  - Bucket: `elevare-scribe-audio`
  - Public URL: `https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev`
- Created centralized audio config at `src/config/audio.ts`
- Updated Content-Security-Policy in `next.config.mjs` to allow R2 domain in `media-src` and `connect-src`
- Configured CORS on R2 bucket for `elevare-scribe.vercel.app` and `localhost:3000`
- Removed local audio files from the Git repository

## [0.3.1] - 2026-03-19

### Added
- Three real demo tracks from Suno, normalized to -14 LUFS:
  - No Hay Quizas
  - Hammocks and Hardhats
  - Double Overhead (v2)

## [0.3.0] - 2026-03-18

### Added
- **How It Works section** (`src/components/how-it-works/`)
  - `HowItWorks.tsx` — wrapper with GSAP ScrollTrigger sticky behavior
  - `StepList.tsx` — navigation for 6 interactive steps
  - `PreviewPane.tsx` — preview container with step content switching
  - `Step1Preview.tsx` — URL paste demonstration
  - `Step2Preview.tsx` — Stem separation visualization
  - `Step3Preview.tsx` — Real-time pitch shifting with Tone.js PitchShift node and interactive slider
  - `Step4Preview.tsx` — Arrangement editing preview
  - `Step5Preview.tsx` — OSMD sheet music rendering with MusicXML transposition
  - `Step6Preview.tsx` — Export and performance preview
- Tone.js integration for real-time audio pitch shifting
- OpenSheetMusicDisplay (OSMD) integration for rendering MusicXML as interactive notation
- GSAP ScrollTrigger pinning for sticky scroll behavior
- Zustand state integration: `currentPitchShift` drives both Tone.js and OSMD simultaneously

## [0.2.0] - 2026-03-17

### Added
- **WebGL hero section** (`src/components/hero/`)
  - `HeroSection.tsx` — composed hero wrapper
  - `HeroCanvas.tsx` — React Three Fiber canvas with custom GLSL fragment shader
  - `HeroOverlay.tsx` — text overlay with headline, subheadline, CTA
  - `DemoInput.tsx` — URL paste input field
- Custom GLSL shader producing generative fluid waveforms
- Mouse-reactive shader uniforms driven by Zustand `mouseCoordinates` at 60fps
- Stem separation WebGL animation triggered by `demoLinkPasted` state
- Hero input field as primary conversion touchpoint

## [0.1.0] - 2026-03-16

### Added
- **Repository initialization** (Phase 0)
  - Git repository created
  - GitHub remote configured
  - Vercel project connected with auto-deploy from `main`
  - `vercel.json` configured
- **Foundation architecture** (Phase 1)
  - Next.js 14 App Router with TypeScript strict mode
  - Core dependencies installed: three, @react-three/fiber, @react-three/drei, gsap, @gsap/react, framer-motion, tone, opensheetmusicdisplay, zustand
  - Tailwind CSS with complete Elevare Scribe design system (`es-*` color tokens)
  - shadcn/ui integration with base UI components
  - Custom font loading: Clash Display (local woff2), Inter (Google Fonts), Cormorant Garamond (Google Fonts)
  - Zustand global store (`src/store/useAppStore.ts`) with all state fields and actions
  - ESLint + eslint-plugin-jsx-a11y
  - Prettier code formatting
  - Husky + lint-staged pre-commit hooks
  - Vitest with jsdom, React plugin, 80% coverage thresholds
  - Playwright for e2e testing
  - `@next/bundle-analyzer` integration
  - Sentry error tracking integration
  - `CLAUDE.md` project context file
