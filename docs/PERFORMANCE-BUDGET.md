# Performance Budget — Elevare Scribe

## Overview

Elevare Scribe is a visually and sonically rich web application. Performance budgets are critical because the page loads Three.js (WebGL), Tone.js (Web Audio), OSMD (SVG sheet music), and GSAP (scroll animations). Without discipline, the experience degrades rapidly on mid-range devices.

All targets below are aspirational until baseline measurements are captured.

---

## Core Web Vitals Targets

| Metric | Target | Measurement Tool | Current Baseline |
|--------|--------|-----------------|-----------------|
| **Largest Contentful Paint (LCP)** | < 2.5 s | Lighthouse, CrUX | TBD |
| **First Contentful Paint (FCP)** | < 1.5 s | Lighthouse | TBD |
| **First Input Delay (FID)** | < 100 ms | CrUX | TBD |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Lighthouse, CrUX | TBD |
| **Time to Interactive (TTI)** | < 4.0 s | Lighthouse | TBD |
| **Interaction to Next Paint (INP)** | < 200 ms | CrUX | TBD |

---

## JavaScript Budget

| Chunk | Compressed Target | Content |
|-------|-------------------|---------|
| **Main bundle** | < 200 KB | Next.js runtime, React, Zustand, Tailwind, layout components |
| **Hero chunk** | < 250 KB | Three.js, @react-three/fiber, @react-three/drei, GLSL shaders |
| **How It Works chunk** | < 350 KB | Tone.js, OSMD, GSAP + ScrollTrigger, step preview components |
| **Total initial load** | < 200 KB | Only main bundle loads on initial paint |

Heavy libraries are all dynamically imported with `{ ssr: false }` and load asynchronously after the initial paint. The user sees the page skeleton before the WebGL canvas, audio engine, or sheet music renderer initializes.

---

## Rendering Performance Targets

| Metric | Target | Context |
|--------|--------|---------|
| **WebGL frame rate (desktop)** | 60 fps | Three.js hero canvas with GLSL shader |
| **WebGL frame rate (mobile)** | 30 fps | Graceful degradation; reduce shader complexity if needed |
| **WebGL frame budget** | < 16.67 ms/frame (desktop) | Total GPU + JS time per frame |
| **GSAP scroll animation** | 60 fps | ScrollTrigger pinning and scrub animations |
| **CSS animation** | 60 fps | Only animate `transform` and `opacity` |

---

## Audio Performance Targets

| Metric | Target | Context |
|--------|--------|---------|
| **Tone.js pitch shift latency** | < 50 ms | Time from slider input to audible pitch change |
| **Audio buffer decode** | < 500 ms | Initial WAV decode for a 10-second demo clip |
| **AudioContext resume** | < 100 ms | Time from user click to AudioContext running state |

---

## Sheet Music Rendering Targets

| Metric | Target | Context |
|--------|--------|---------|
| **OSMD initial render** | < 500 ms | First render of a 16-measure MusicXML score |
| **OSMD transposition update** | < 200 ms | Re-render after pitch shift change |
| **OSMD container layout** | No CLS | Container must have explicit dimensions before render |

---

## Network Budget

| Resource Type | Target Per Resource | Notes |
|---------------|-------------------|-------|
| **HTML document** | < 50 KB | Server-rendered shell with minimal inlined CSS |
| **CSS (total)** | < 50 KB compressed | Tailwind purge removes unused classes |
| **Fonts (total)** | < 200 KB | Clash Display woff2 (4 weights) + Inter + Cormorant |
| **Audio (demo clip)** | < 2 MB per clip | 10-second WAV at 44.1kHz/16-bit stereo |
| **Images** | < 100 KB each | Use WebP/AVIF, lazy load below fold |

---

## Lighthouse Score Targets

| Category | Desktop Target | Mobile Target | Notes |
|----------|---------------|---------------|-------|
| **Performance** | 90+ | 80+ | WebGL impacts mobile score; acceptable |
| **Accessibility** | 95+ | 95+ | ARIA labels, focus rings, color contrast |
| **Best Practices** | 95+ | 95+ | HTTPS, no deprecated APIs, CSP headers |
| **SEO** | 100 | 100 | Meta tags, structured data, semantic HTML |

---

## Progressive Enhancement

| Capability | Full Experience | Degraded Experience |
|------------|----------------|-------------------|
| **WebGL** | Three.js generative hero | CSS gradient fallback background |
| **Web Audio** | Tone.js real-time pitch shift | Static audio player with no pitch control |
| **OSMD** | Interactive notation rendering | Static image of sheet music |
| **GSAP ScrollTrigger** | Pinned scroll, parallax | Standard vertical scroll layout |

Detection strategy:

```tsx
const hasWebGL = typeof window !== "undefined" &&
  !!document.createElement("canvas").getContext("webgl2");

const hasAudioContext = typeof window !== "undefined" &&
  !!(window.AudioContext || window.webkitAudioContext);
```

---

## Measurement Cadence

| When | What | Tool |
|------|------|------|
| Every PR | Bundle size diff | `npm run analyze` (manual) |
| Weekly | Lighthouse audit (desktop + mobile) | Chrome DevTools Lighthouse |
| Weekly | Core Web Vitals check | PageSpeed Insights or CrUX |
| Pre-release | Full performance audit | Lighthouse CI, WebPageTest |
| Post-deploy | Smoke test for regressions | Manual check on production URL |

---

## Action Items

- [ ] Run Lighthouse on `elevare-scribe.vercel.app` and record baseline scores
- [ ] Measure actual compressed bundle sizes with browser DevTools
- [ ] Profile WebGL frame rate on desktop and mobile devices
- [ ] Measure Tone.js pitch shift latency with performance marks
- [ ] Measure OSMD render and transposition times
- [ ] Set up Lighthouse CI in GitHub Actions for automated regression detection
- [ ] Implement CSS gradient fallback for WebGL-unsupported browsers
- [ ] Add `prefers-reduced-motion` media query support
