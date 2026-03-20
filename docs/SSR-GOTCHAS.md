# SSR Gotchas — Elevare Scribe

## The Crash: `TypeError: Cannot read properties of undefined (reading 'S')`

### Symptoms

- Production build (`npm run build`) fails with a cryptic error
- Error occurs during Next.js static rendering / SSR pass
- Stack trace points into minified Three.js or Tone.js internals
- The error message `Cannot read properties of undefined (reading 'S')` is a minified symbol; the real issue is access to `window`, `document`, or `AudioContext` in a Node.js environment

### Root Cause

`page.tsx` originally imported `HeroSection` and `HowItWorks` as regular ES module imports:

```tsx
// BROKEN — DO NOT DO THIS
import HeroSection from "@/components/hero/HeroSection";
import HowItWorks from "@/components/how-it-works/HowItWorks";
```

Even though these components use `"use client"` at the top of their files, **Next.js still SSR-renders client components**. The `"use client"` directive only marks the client/server boundary for the module graph — it does not skip server-side rendering. During SSR, Next.js executes the component code in Node.js to produce initial HTML, which means all transitive imports are evaluated in a Node.js environment.

Three.js, Tone.js, and OSMD all assume browser globals exist at import time:

- **Three.js** accesses `window`, `document`, `navigator`, and the WebGL rendering context during module initialization
- **Tone.js** accesses `AudioContext` and `window` at import time
- **OSMD** calls `document.createElement` during initialization

When Node.js evaluates these modules, the browser globals are `undefined`, producing the crash.

### The Fix

Use `next/dynamic` with `{ ssr: false }` in `page.tsx` to completely skip server-side rendering for these components:

```tsx
// CORRECT — page.tsx
import dynamic from "next/dynamic";

const HeroSection = dynamic(
  () => import("@/components/hero/HeroSection"),
  { ssr: false }
);

const HowItWorks = dynamic(
  () => import("@/components/how-it-works/HowItWorks"),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
    </main>
  );
}
```

With `{ ssr: false }`, Next.js will:
1. Render nothing (or a fallback) for these components during SSR
2. Load and render them only on the client after hydration
3. Never evaluate their transitive dependency tree in Node.js

---

## Libraries Requiring `{ ssr: false }`

Every component that transitively imports any of these libraries must be dynamically imported with `{ ssr: false }`:

| Library | npm Package | Reason |
|---------|-------------|--------|
| Three.js | `three` | Requires `window`, `document`, WebGL context at import time |
| React Three Fiber | `@react-three/fiber` | Wraps Three.js; creates WebGL renderer |
| React Three Drei | `@react-three/drei` | Three.js utility components; depends on WebGL context |
| Tone.js | `tone` | Requires `AudioContext`, `window` at import time |
| OpenSheetMusicDisplay | `opensheetmusicdisplay` | Calls `document.createElement` during initialization |

### Current Components Behind SSR Boundary

| Component | File | Browser-Only Deps |
|-----------|------|-------------------|
| `HeroSection` | `src/components/hero/HeroSection.tsx` | three, @react-three/fiber, @react-three/drei |
| `HeroCanvas` | `src/components/hero/HeroCanvas.tsx` | three, @react-three/fiber, @react-three/drei |
| `HowItWorks` | `src/components/how-it-works/HowItWorks.tsx` | tone, opensheetmusicdisplay |
| `Step3Preview` | `src/components/how-it-works/Step3Preview.tsx` | tone |
| `Step5Preview` | `src/components/how-it-works/Step5Preview.tsx` | tone, opensheetmusicdisplay |

---

## Import Policy

### Rule 1: Never directly import browser-only components from server components

```tsx
// WRONG — in any server component or page.tsx
import HeroSection from "@/components/hero/HeroSection";

// RIGHT
const HeroSection = dynamic(
  () => import("@/components/hero/HeroSection"),
  { ssr: false }
);
```

### Rule 2: Browser-only libraries may be imported normally within client-only subtrees

Once a component is behind a `dynamic(..., { ssr: false })` boundary, its children can use normal imports for browser-only libraries:

```tsx
// This is fine inside HeroCanvas.tsx because HeroSection (its parent)
// is already loaded with { ssr: false }
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
```

### Rule 3: When adding a new browser-only dependency, check the import chain

Before adding any library that depends on browser APIs, trace the import chain back to `page.tsx` and verify the component is behind a `{ ssr: false }` boundary. If it is not, add one.

### Rule 4: Use `typeof window !== 'undefined'` as a secondary guard

For code that might run in both contexts (e.g., utility functions), guard browser-specific logic:

```tsx
const isBrowser = typeof window !== "undefined";

function getAudioContext() {
  if (!isBrowser) return null;
  return new AudioContext();
}
```

This is a fallback, not a replacement for `{ ssr: false }`. The dynamic import approach is always preferred because it completely avoids loading heavy browser libraries on the server.

### Rule 5: Test with `npm run build`, not just `npm run dev`

The SSR crash may not manifest during `npm run dev` because Next.js dev mode handles errors more leniently. Always verify with a full production build:

```bash
npm run build
```

If the build succeeds, SSR is safe.

---

## Common Mistakes

### Mistake 1: Thinking `"use client"` prevents SSR

It does not. `"use client"` tells Next.js where the server/client module boundary is, but the component still gets SSR-rendered. Only `dynamic(..., { ssr: false })` truly skips SSR.

### Mistake 2: Conditional imports inside components

```tsx
// WRONG — the import still gets evaluated at module load time
"use client";
import { Canvas } from "@react-three/fiber"; // Crashes in SSR

export default function Hero() {
  if (typeof window === "undefined") return null;
  return <Canvas />;
}
```

The `import` statement at the top runs during module evaluation, before your component function executes. The `typeof window` check inside the function body is too late.

### Mistake 3: Lazy import inside useEffect

```tsx
// WORKS but unnecessarily complex — prefer { ssr: false }
useEffect(() => {
  import("tone").then((Tone) => {
    // use Tone here
  });
}, []);
```

This works but creates complexity around async initialization. Use `{ ssr: false }` at the component boundary and import normally inside the component.

---

## Debugging Checklist

When you encounter an SSR-related crash:

1. **Read the full stack trace.** Look for references to `three`, `tone`, `opensheetmusicdisplay`, or any library known to require browser globals.

2. **Trace the import chain.** Start from `page.tsx` and follow imports to find the browser-only library. Every link in the chain must be behind a `{ ssr: false }` boundary.

3. **Check `page.tsx`.** Verify all components that use browser-only libraries are loaded via `dynamic(..., { ssr: false })`.

4. **Run `npm run build`.** This is the definitive SSR test. If it passes, the issue is resolved.

5. **Check for new dependencies.** If someone added a new dependency, verify it does not assume browser globals at import time.
