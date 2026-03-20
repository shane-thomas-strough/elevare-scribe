# Design System — Elevare Scribe

## Design Philosophy

Elevare Scribe's visual identity is rooted in MIT Media Lab experimentation and SpaceX engineering precision. The interface is dark, cinematic, and immersive. It does not look like a SaaS dashboard — it looks like a stage. The visitor should feel the product working before they understand what it does.

---

## Color Tokens

### Core Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `es-bg-primary` | `#0A0A0F` | `10, 10, 15` | Page background, canvas backdrop |
| `es-bg-secondary` | `#12121A` | `18, 18, 26` | Card backgrounds, elevated surfaces |
| `es-bg-tertiary` | `#1A1A28` | `26, 26, 40` | Hover states, active surface areas |
| `es-text-primary` | `#F0F0F8` | `240, 240, 248` | Headlines, primary body copy |
| `es-text-secondary` | `#8888AA` | `136, 136, 170` | Secondary text, descriptions, captions |
| `es-text-tertiary` | `#555575` | `85, 85, 117` | Disabled text, placeholder text |

### Accent Colors (Stem-Mapped)

Each accent color corresponds to a specific audio stem, maintaining visual consistency between the WebGL visualizer, stem mixer, and sheet music highlights.

| Token | Hex | RGB | Stem Assignment | Usage |
|-------|-----|-----|----------------|-------|
| `es-cyan` | `#00D4FF` | `0, 212, 255` | Vocals | Primary interactive accent, links, focus rings |
| `es-gold` | `#C7973A` | `199, 151, 58` | Guitar | Secondary accent, founder story wash, premium tier |
| `es-purple` | `#7B2FBE` | `123, 47, 190` | Bass | Tertiary accent, decorative gradients |
| `es-green` | `#00FF88` | `0, 255, 136` | Drums | Success states, active indicators, CTA glow |

### Special Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `es-gig-black` | `#000000` | Gig Mode full-screen blackout |
| `es-border` | `rgba(255, 255, 255, 0.03)` | Subtle borders, glass morphism edges |

### Tailwind Usage

All design system colors are registered in `tailwind.config.ts` under the `es-` prefix:

```tsx
<div className="bg-es-bg-primary text-es-text-primary">
  <h1 className="text-es-cyan">Heading</h1>
  <p className="text-es-text-secondary">Body copy</p>
</div>
```

### Gradient Patterns

| Gradient | CSS | Usage |
|----------|-----|-------|
| Hero glow | `radial-gradient(ellipse at center, rgba(0,212,255,0.15), transparent 70%)` | Behind hero text |
| Stem visualization | `linear-gradient(180deg, es-cyan, es-gold, es-purple, es-green)` | WebGL particle colors |
| Gold wash | `linear-gradient(135deg, rgba(199,151,58,0.1), transparent)` | Founder story background |
| Card border | `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))` | Glass morphism card borders |

---

## Typography

### Font Stack

| Font | Variable | Usage | Source |
|------|----------|-------|--------|
| **Clash Display** | `--font-clash` | Headlines, section titles, Gig Mode chords | Fontshare (local woff2 files) |
| **Inter** | `--font-inter` | Body copy, UI elements, buttons | Google Fonts (next/font) |
| **Cormorant Garamond** | `--font-cormorant` | Founder story section | Google Fonts (next/font) |
| **JetBrains Mono** | System / CDN | Code snippets, input fields, monospaced data | System font stack |

### Type Scale

| Element | Font | Weight | Size (Desktop) | Size (Mobile) | Line Height | Letter Spacing |
|---------|------|--------|----------------|---------------|-------------|----------------|
| Hero headline | Clash Display | Bold (700) | 96px | 56px | 1.0 | -0.02em |
| Section headline | Clash Display | Medium (500) | 48px | 32px | 1.1 | -0.01em |
| Section subhead | Clash Display | Regular (400) | 24px | 20px | 1.3 | 0 |
| Body large | Inter | Regular (400) | 18px | 16px | 1.6 | 0 |
| Body regular | Inter | Regular (400) | 16px | 14px | 1.5 | 0 |
| Body small | Inter | Medium (500) | 14px | 12px | 1.4 | 0.01em |
| Founder story | Cormorant Garamond | Italic (400i) | 24px | 18px | 1.7 | 0.02em |
| Code / input | JetBrains Mono | Regular (400) | 14px | 13px | 1.5 | 0 |
| Gig Mode chord | Clash Display | Bold (700) | 200px+ | 120px+ | 1.0 | -0.03em |

### Tailwind Usage

```tsx
<h1 className="font-clash text-[96px] font-bold leading-none tracking-tight">
  Hero Title
</h1>
<p className="font-inter text-lg leading-relaxed text-es-text-secondary">
  Body copy
</p>
<blockquote className="font-cormorant text-2xl italic text-es-gold">
  Founder quote
</blockquote>
<code className="font-mono text-sm">
  monospaced
</code>
```

### Font Loading Strategy

All fonts use `display: "swap"` to prevent invisible text during loading:

- **Clash Display:** Loaded as local font via `next/font/local` with woff2 files in `src/app/fonts/`
- **Inter:** Loaded via `next/font/google` with latin subset
- **Cormorant Garamond:** Loaded via `next/font/google` with latin subset, weights 400 and 600, normal and italic styles
- **JetBrains Mono:** Referenced in Tailwind config as system font; falls back to monospace

---

## Spacing and Border Radius

### Spacing Scale

Follow Tailwind's default spacing scale (4px base). Key patterns:

| Pattern | Spacing | Usage |
|---------|---------|-------|
| Section padding | `py-24` (96px) / `py-16` (64px mobile) | Vertical section separation |
| Container max-width | `max-w-7xl` (80rem) | Content container |
| Card padding | `p-6` (24px) / `p-4` (16px mobile) | Interior card spacing |
| Component gap | `gap-8` (32px) / `gap-4` (16px mobile) | Grid and flex gaps |
| Element spacing | `space-y-4` (16px) | Vertical stacking within cards |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | `var(--radius)` (0.5rem default) | Cards, containers |
| `rounded-md` | `calc(var(--radius) - 2px)` | Buttons, inputs |
| `rounded-sm` | `calc(var(--radius) - 4px)` | Tags, badges |
| `rounded-full` | `9999px` | Avatars, circular buttons |
| `rounded-none` | `0` | Gig Mode elements, full-bleed sections |

---

## Animation Principles

### Domain Separation: GSAP vs Framer Motion

This is a strict rule. Violating it causes animation conflicts, jank, and debugging nightmares.

| Library | Domain | Use For | Never Use For |
|---------|--------|---------|--------------|
| **GSAP + ScrollTrigger** | Scroll-driven animation | Scroll hijack, horizontal timeline, sticky scroll, parallax, element pinning | Component transitions, hover effects, modals |
| **Framer Motion** | Component-level animation | Hover states, mount/unmount transitions, layout animations, modals, micro-interactions | Scroll-based animations, pinning, timeline sequences |

### GSAP Conventions

```tsx
// Always use @gsap/react useGSAP hook for cleanup
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

useGSAP(() => {
  gsap.to(".element", {
    xPercent: -100,
    scrollTrigger: {
      trigger: ".container",
      scrub: true,
      pin: true,
    },
  });
}, { scope: containerRef });
```

### Framer Motion Conventions

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Component content
</motion.div>
```

### Animation Performance Rules

1. **Only animate `transform` and `opacity`.** Never animate `width`, `height`, `top`, `left`, or other layout-triggering properties.
2. **Use `will-change` sparingly.** Only on elements actively animating. Remove it after animation completes.
3. **WebGL at 60fps.** The Three.js canvas must maintain 60fps on desktop. Accept 30fps graceful degradation on mobile.
4. **Debounce scroll handlers.** All GSAP ScrollTrigger instances handle this automatically. Custom scroll listeners must be throttled to `requestAnimationFrame`.
5. **Reduce motion.** Respect `prefers-reduced-motion: reduce`. Disable parallax, reduce animation duration, keep essential transitions only.

---

## Accessibility Notes

### Color Contrast

| Combination | Ratio | WCAG AA | WCAG AAA |
|-------------|-------|---------|----------|
| `es-text-primary` on `es-bg-primary` (#F0F0F8 on #0A0A0F) | 17.6:1 | Pass | Pass |
| `es-text-secondary` on `es-bg-primary` (#8888AA on #0A0A0F) | 5.9:1 | Pass | Pass (large text) |
| `es-cyan` on `es-bg-primary` (#00D4FF on #0A0A0F) | 10.8:1 | Pass | Pass |
| `es-gold` on `es-bg-primary` (#C7973A on #0A0A0F) | 6.7:1 | Pass | Pass (large text) |
| `es-text-tertiary` on `es-bg-primary` (#555575 on #0A0A0F) | 3.2:1 | Fail | Fail |

**Note:** `es-text-tertiary` fails WCAG AA for normal text. Use only for decorative or non-essential text. For disabled states, pair with other visual indicators (opacity, strikethrough).

### Focus Indicators

- All interactive elements must have visible focus rings
- Use `es-cyan` for focus ring color: `focus-visible:ring-2 focus-visible:ring-es-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-es-bg-primary`
- Never remove outline without providing an alternative focus indicator

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Considerations

- WebGL canvas must have `role="img"` and `aria-label` describing the visual
- Audio controls must be keyboard accessible with ARIA labels
- Gig Mode must be escapable via keyboard (Escape key)
- Sheet music rendered by OSMD should have `aria-label` with textual description of the notation

---

## Zustand State Shape

The Zustand store (`src/store/useAppStore.ts`) holds all cross-component reactive state. This is the complete TypeScript interface:

```ts
interface StemVolumes {
  vocal: number;   // 0-1, default 1
  guitar: number;  // 0-1, default 1
  bass: number;    // 0-1, default 1
  drums: number;   // 0-1, default 1
}

interface MouseCoordinates {
  x: number;  // Normalized 0-1
  y: number;  // Normalized 0-1
}

interface AppState {
  // State
  audioContextStarted: boolean;          // Web Audio API initialized
  currentStemVolumes: StemVolumes;        // Per-stem volume levels
  isGigModeActive: boolean;              // Full browser takeover active
  mouseCoordinates: MouseCoordinates;    // For WebGL shader reactivity
  currentPitchShift: number;             // Semitones (-12 to +12)
  demoLinkPasted: boolean;               // Hero input activated
  activeStemVisualization: string[];      // Currently highlighted stems

  // Actions
  setAudioContextStarted: (started: boolean) => void;
  setStemVolume: (stem: keyof StemVolumes, volume: number) => void;
  setGigModeActive: (active: boolean) => void;
  setMouseCoordinates: (coords: MouseCoordinates) => void;
  setCurrentPitchShift: (shift: number) => void;
  setDemoLinkPasted: (pasted: boolean) => void;
  setActiveStemVisualization: (stems: string[]) => void;
}
```

### State Ownership Table

| State Field | Written By | Read By |
|-------------|-----------|---------|
| `audioContextStarted` | First user click/tap handler | All Tone.js components |
| `currentStemVolumes` | Stem mixer sliders | WebGL visualizer, Tone.js players |
| `isGigModeActive` | Gig Mode toggle button, Escape key handler | Layout component, all sections |
| `mouseCoordinates` | Global mousemove listener (60fps) | HeroCanvas GLSL shader uniforms |
| `currentPitchShift` | Pitch shift slider (Step 3) | Tone.js PitchShift node, OSMD transposition |
| `demoLinkPasted` | DemoInput on paste event | HeroCanvas (triggers stem separation animation) |
| `activeStemVisualization` | StepList on step selection | PreviewPane, WebGL visualizer |
