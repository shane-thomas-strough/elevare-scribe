# Bundle Report — Elevare Scribe

## Status

**Bundle analysis has not yet been run.** This document records known heavy dependencies and the target budget. Run the analyzer to populate actual measurements.

### How to Run Bundle Analysis

```bash
npm run analyze
# Equivalent to: ANALYZE=true next build
```

This uses `@next/bundle-analyzer` configured in `next.config.mjs`. It opens an interactive treemap in the browser showing the size contribution of every module.

---

## Known Heavy Dependencies

| Package | Estimated Uncompressed Size | Import Strategy | Used By |
|---------|---------------------------|-----------------|---------|
| `three` | ~600 KB | Dynamic import, `ssr: false` | HeroCanvas, HeroSection |
| `tone` | ~300 KB | Dynamic import, `ssr: false` | Step3Preview, Step5Preview, HowItWorks |
| `opensheetmusicdisplay` | ~400 KB | Dynamic import, `ssr: false` | Step5Preview, HowItWorks |
| `gsap` | ~100 KB | Dynamic import, `ssr: false` | HowItWorks (ScrollTrigger), Founder Timeline |
| `@react-three/fiber` | ~50 KB (+ three) | Dynamic import, `ssr: false` | HeroCanvas |
| `@react-three/drei` | ~80 KB (selective) | Dynamic import, `ssr: false` | HeroCanvas |
| `framer-motion` | ~100 KB | Tree-shakeable, client components only | Various component transitions |
| `zustand` | ~3 KB | Always loaded | useAppStore (global) |
| `react` + `react-dom` | ~140 KB | Always loaded (framework) | Core framework |
| `next` | ~90 KB (client runtime) | Always loaded (framework) | Core framework |

### Total Estimated Heavy Dependencies: ~1,860 KB uncompressed

All heavy dependencies (three, tone, OSMD, gsap) are loaded via `next/dynamic` with `{ ssr: false }`, which means they are:

1. **Not included in the initial server-rendered HTML payload**
2. **Code-split into separate chunks** loaded on demand after hydration
3. **Not evaluated during SSR** (prevents Node.js crashes and reduces server memory)

---

## JS Budget Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Main bundle (compressed)** | < 200 KB | Framework runtime + Zustand + Tailwind + layout |
| **Hero chunk (compressed)** | < 250 KB | Three.js + R3F + Drei + shader code |
| **How It Works chunk (compressed)** | < 350 KB | Tone.js + OSMD + GSAP + step previews |
| **Total initial load (compressed)** | < 200 KB | Only main bundle loads initially |
| **Total all-chunks (compressed)** | < 800 KB | All chunks combined after full page interaction |

### Compression Notes

- Vercel serves with Brotli compression by default (typically 70-80% reduction)
- A 600 KB uncompressed Three.js bundle compresses to approximately 150-180 KB with Brotli
- Actual compressed sizes must be measured with `npm run analyze` and browser DevTools Network tab

---

## Optimization Opportunities (To Investigate)

### Three.js Tree-Shaking

Three.js supports tree-shaking when importing specific modules:

```tsx
// Preferred — only imports what's used
import { WebGLRenderer, Scene, PerspectiveCamera } from "three";

// Avoid — imports entire library
import * as THREE from "three";
```

R3F abstracts most Three.js imports, but custom shader code should import selectively.

### OSMD Subset Loading

OSMD is a large library. Investigate whether a subset build is available or if lazy-loading specific rendering engines can reduce the chunk size.

### Tone.js Selective Imports

Tone.js supports importing specific modules:

```tsx
// Preferred
import { Player, PitchShift } from "tone";

// Avoid
import * as Tone from "tone";
```

### Code Splitting by Route

Currently the app is a single-page landing. When additional routes are added (dashboard, project editor), each route should have its own chunk boundary. Next.js App Router handles this automatically per route segment.

---

## Action Items

- [ ] Run `npm run analyze` and record actual bundle sizes
- [ ] Capture compressed transfer sizes from browser DevTools
- [ ] Verify Three.js tree-shaking is effective with R3F
- [ ] Investigate Tone.js selective import savings
- [ ] Investigate OSMD bundle reduction options
- [ ] Set up automated bundle size checks in CI (e.g., `bundlewatch` or `size-limit`)
- [ ] Document compressed sizes for each chunk in this file after measurement
