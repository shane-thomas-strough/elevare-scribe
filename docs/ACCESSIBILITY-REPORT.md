# Accessibility Report — Elevare Scribe

## Status

**Full accessibility audit has not yet been performed.** This document tracks known accessibility gaps, implemented measures, and priority items to address. An axe-core automated scan and Lighthouse accessibility audit are pending.

---

## Audit Tools (To Be Run)

| Tool | Purpose | Status |
|------|---------|--------|
| **axe-core / axe DevTools** | Automated WCAG 2.1 AA violation detection | Not yet run |
| **Lighthouse Accessibility** | Automated scoring with remediation guidance | Not yet run |
| **WAVE** | Visual overlay of accessibility issues | Not yet run |
| **Manual keyboard testing** | Tab order, focus management, interaction | Partially tested |
| **Screen reader testing** | VoiceOver (macOS), NVDA (Windows) | Not yet run |

---

## Currently Implemented

### Color Contrast

The design system color palette was chosen with contrast ratios in mind:

| Combination | Ratio | WCAG AA |
|-------------|-------|---------|
| `es-text-primary` (#F0F0F8) on `es-bg-primary` (#0A0A0F) | 17.6:1 | Pass |
| `es-text-secondary` (#8888AA) on `es-bg-primary` (#0A0A0F) | 5.9:1 | Pass |
| `es-cyan` (#00D4FF) on `es-bg-primary` (#0A0A0F) | 10.8:1 | Pass |
| `es-gold` (#C7973A) on `es-bg-primary` (#0A0A0F) | 6.7:1 | Pass |

**Known issue:** `es-text-tertiary` (#555575 on #0A0A0F) has a 3.2:1 ratio, which fails WCAG AA for normal-sized text. This color should only be used for decorative or non-essential content.

### Font Loading

All fonts use `display: "swap"` to prevent Flash of Invisible Text (FOIT). Users see fallback system fonts immediately, then swap to custom fonts when loaded.

### Semantic HTML

- `<main>` element wraps primary content in `page.tsx`
- `<html lang="en">` is set in `layout.tsx`

### ESLint a11y Plugin

`eslint-plugin-jsx-a11y` is installed and configured, catching common accessibility issues during development (missing alt text, invalid ARIA attributes, etc.).

---

## Known Gaps — Priority Items

### P0: Critical (Must Fix Before Launch)

#### 1. WebGL Canvas Needs ARIA Label

**Issue:** The Three.js `<canvas>` element rendered by React Three Fiber has no ARIA role or label. Screen readers cannot describe the visual content.

**Required fix:**
```tsx
<Canvas
  role="img"
  aria-label="Generative fluid waveform visualization responding to mouse movement"
  tabIndex={-1}
>
```

**Location:** `src/components/hero/HeroCanvas.tsx`

#### 2. Audio Controls Must Be Keyboard Accessible

**Issue:** The pitch shift slider and stem volume controls in the How It Works section need to be operable via keyboard (arrow keys for value adjustment, Tab for focus).

**Required fix:**
- Use `<input type="range">` or a custom slider with `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-label`
- Ensure arrow key handlers adjust values in meaningful increments
- Provide visible focus indicator using `es-cyan` focus ring

**Locations:** `src/components/how-it-works/Step3Preview.tsx`, `Step5Preview.tsx`

#### 3. Escape Key for Gig Mode

**Issue:** Gig Mode performs a full browser takeover (black background, hidden cursor). Users must be able to exit via the Escape key. Currently, there is no keyboard escape handler.

**Required fix:**
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isGigModeActive) {
      setGigModeActive(false);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isGigModeActive, setGigModeActive]);
```

**Location:** Gig Mode component (Phase 4)

#### 4. Focus Trap in Gig Mode

**Issue:** When Gig Mode is active, focus should be trapped within the Gig Mode overlay. Tab should not reach elements behind the overlay.

**Required fix:** Implement a focus trap using `inert` attribute on background content or a focus trap library.

### P1: Important (Should Fix Before Launch)

#### 5. Skip Navigation Link

**Issue:** No "Skip to main content" link is provided for keyboard users to bypass the navigation.

**Required fix:** Add a visually-hidden skip link as the first focusable element:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-es-bg-secondary focus:text-es-text-primary focus:px-4 focus:py-2 focus:rounded">
  Skip to main content
</a>
```

#### 6. Reduced Motion Support

**Issue:** Animations (WebGL, GSAP scroll hijack, Framer Motion transitions) continue at full intensity for users who prefer reduced motion.

**Required fix:**
- Check `prefers-reduced-motion: reduce` media query
- Disable or simplify WebGL shader animation
- Disable GSAP scroll hijacking (fall back to standard scroll)
- Reduce Framer Motion animation durations

```tsx
const prefersReducedMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;
```

#### 7. OSMD Sheet Music Alternative Text

**Issue:** The rendered SVG sheet music from OSMD is not accessible to screen readers.

**Required fix:** Provide an `aria-label` or adjacent text description of the notation content (e.g., "Sheet music showing measures 1-16 in the key of C major, chord progression Am - F - C - G").

#### 8. Alt Text for Decorative vs. Informative Images

**Issue:** Need to audit all `<img>` elements and ensure decorative images have `alt=""` and informative images have meaningful descriptions.

### P2: Nice to Have (Post-Launch)

#### 9. High Contrast Mode

Consider supporting `forced-colors` / Windows High Contrast mode. The dark theme with neon accents may not render well in high contrast mode.

#### 10. Audio Descriptions for Demo Content

For demo tracks, provide text descriptions of what the audio contains (genre, instruments, tempo) for users who cannot hear the audio.

#### 11. Touch Target Sizes

Verify all interactive elements meet the 44x44 CSS pixel minimum touch target size per WCAG 2.5.8.

---

## WCAG 2.1 AA Compliance Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | Needs work | WebGL canvas, OSMD SVG need alt text |
| 1.3.1 Info and Relationships | Needs audit | Semantic HTML structure |
| 1.4.1 Use of Color | Needs audit | Stem colors used alone to distinguish elements |
| 1.4.3 Contrast (Minimum) | Partial pass | `es-text-tertiary` fails |
| 1.4.11 Non-text Contrast | Needs audit | Focus rings, borders |
| 2.1.1 Keyboard | Needs work | Audio controls, Gig Mode exit |
| 2.1.2 No Keyboard Trap | Needs work | Gig Mode focus trap needed |
| 2.4.1 Bypass Blocks | Needs work | Skip nav link needed |
| 2.4.3 Focus Order | Needs audit | Tab order through sections |
| 2.4.7 Focus Visible | Needs audit | Focus ring visibility |
| 2.5.8 Target Size | Needs audit | Touch targets |
| 3.1.1 Language of Page | Pass | `lang="en"` set |
| 4.1.2 Name, Role, Value | Needs work | Custom slider controls |

---

## Next Steps

1. Run axe-core scan on the deployed site and record all violations
2. Run Lighthouse accessibility audit and record score
3. Address all P0 items before public launch
4. Address P1 items in the sprint following launch
5. Schedule quarterly accessibility audits
