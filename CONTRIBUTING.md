# Contributing to Elevare Scribe

## Phase-Based Build Sequence

Elevare Scribe is built in strict sequential phases. Each phase is a checkpoint — do not skip ahead or build features from a later phase before the current phase is verified.

| Phase | Name | Key Deliverables |
|-------|------|-----------------|
| 0 | Repository + Deployment | Git, GitHub, Vercel auto-deploy |
| 1 | Foundation Architecture | Next.js 14, dependencies, Zustand store, Tailwind theme, fonts |
| 2 | WebGL Hero | R3F canvas, GLSL shader, demo input, stem separation animation |
| 3 | Playable How It Works | GSAP ScrollTrigger sticky section, Tone.js pitch shifting, OSMD notation |
| 4 | Gig Mode Browser Takeover | Full-screen blackout, spotlight cursor, chord reveal, ambient audio |
| 5 | GSAP Horizontal Founder Timeline | Horizontal scroll, gold wash, waveform narrative |

Each phase has a corresponding entry in `docs/PHASE-LOG.md`. When a phase is complete, log what was built, what was verified, and what issues were encountered.

---

## Repository Conventions

### Directory Structure

```
src/
├── app/           # Next.js App Router pages and layouts
├── components/    # React components, organized by section
│   ├── hero/      # WebGL hero section components
│   ├── how-it-works/  # How It Works section components
│   └── ui/        # shadcn/ui base components
├── config/        # Configuration constants (audio URLs, etc.)
├── lib/           # Utility functions
├── store/         # Zustand stores
└── test/          # Test setup and utilities
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `HeroCanvas.tsx` |
| Utility files | camelCase | `utils.ts` |
| Config files | camelCase | `audio.ts` |
| Store files | camelCase with `use` prefix | `useAppStore.ts` |
| Test files | Same name + `.test` | `useAppStore.test.ts` |
| CSS classes | Tailwind utility classes | `className="bg-es-bg-primary"` |
| Design tokens | `es-` prefix | `es-cyan`, `es-bg-primary`, `es-text-secondary` |

### Code Style

- **TypeScript strict mode** — no `any` types unless absolutely unavoidable (document why)
- **Prettier** handles formatting — do not override
- **ESLint** with `eslint-config-next` and `eslint-plugin-jsx-a11y` — zero warnings policy
- **Husky + lint-staged** runs Prettier and ESLint on every commit automatically
- Import paths use the `@/` alias (maps to `src/`)

---

## Branch and PR Expectations

### Branch Naming

```
feature/{phase}-{description}    # New features
fix/{description}                # Bug fixes
chore/{description}              # Maintenance, deps, docs
refactor/{description}           # Code restructuring
```

Examples:
- `feature/phase-4-gig-mode`
- `fix/ssr-three-js-crash`
- `chore/update-dependencies`
- `refactor/extract-audio-hook`

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make changes** with clear, atomic commits
3. **Verify locally:**
   ```bash
   npm run build      # Must pass — catches SSR issues
   npm run lint       # Zero warnings
   npm run typecheck  # Zero errors
   npm run test       # All tests pass
   ```
4. **Push and open a PR** against `main`
5. **PR description must include:**
   - What changed and why
   - Which phase this relates to
   - Screenshots or recordings for visual changes
   - How to test the changes
6. **Vercel preview deployment** is created automatically — verify changes there
7. **Request review** from `@shane-thomas-strough`
8. **Squash and merge** into `main` after approval

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` — new feature
- `fix` — bug fix
- `chore` — maintenance (deps, config, CI)
- `refactor` — code restructuring without behavior change
- `docs` — documentation only
- `test` — adding or updating tests
- `style` — formatting, no code change
- `perf` — performance improvement

Examples:
```
feat(hero): add GLSL shader mouse reactivity
fix(ssr): use dynamic import for HeroSection to prevent SSR crash
chore(deps): update three.js to 0.183.2
docs: add SSR-GOTCHAS.md
test(store): add unit tests for useAppStore pitch shift
```

---

## Testing Requirements

### Unit Tests (Vitest)

- **Coverage threshold:** 80% across statements, branches, functions, and lines
- **Test file location:** Co-located with source files or in `src/test/`
- **Environment:** jsdom (configured in `vitest.config.ts`)
- **Naming:** `{filename}.test.ts` or `{filename}.test.tsx`

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npx vitest run --coverage  # With coverage report
```

### End-to-End Tests (Playwright)

- **Test directory:** `e2e/`
- **Browser:** Chromium (configured in `playwright.config.ts`)
- **Base URL:** `http://localhost:3000`

```bash
npm run test:e2e       # Run e2e tests
npx playwright test --headed  # Debug with visible browser
```

### What to Test

| Layer | What to Test | Tool |
|-------|-------------|------|
| Zustand store | State mutations, action behaviors, initial values | Vitest |
| Utility functions | Pure function input/output | Vitest |
| Components | Rendering, user interactions, accessibility | Vitest + Testing Library |
| Page flows | Navigation, audio playback, visual regression | Playwright |

### What NOT to Test

- Three.js/WebGL rendering internals (test at the integration level with Playwright)
- Tone.js audio output (test state changes, not audio signal)
- OSMD SVG rendering (test that the container exists and receives content)

---

## Working with SSR-Sensitive Code

This is the most common source of build failures. Read `docs/SSR-GOTCHAS.md` for the full story.

### The Rule

**Any component that imports Three.js, Tone.js, OSMD, or any library that accesses browser globals must be loaded via `next/dynamic` with `{ ssr: false }` from `page.tsx` or any server component.**

### Checklist Before Adding Browser-Only Code

1. Does the new code import `three`, `@react-three/fiber`, `@react-three/drei`, `tone`, or `opensheetmusicdisplay`?
2. Is the component that imports it already behind a `{ ssr: false }` dynamic import in `page.tsx`?
3. If not, add one.
4. Run `npm run build` to verify.

### Verification

```bash
npm run build
```

If it passes, SSR is safe. If it fails with a reference to `window`, `document`, `AudioContext`, or a minified property access error, you have an SSR boundary issue.

---

## Browser-Only Library Isolation Strategy

### Architecture

```
page.tsx (Server Component)
  │
  ├── dynamic(() => import("HeroSection"), { ssr: false })
  │     └── HeroCanvas.tsx
  │           └── imports three, @react-three/fiber, @react-three/drei
  │
  └── dynamic(() => import("HowItWorks"), { ssr: false })
        ├── Step3Preview.tsx
        │     └── imports tone
        └── Step5Preview.tsx
              └── imports tone, opensheetmusicdisplay
```

### Rules

1. **SSR boundary at the section level.** Each major section (HeroSection, HowItWorks, GigMode, FounderTimeline) is dynamically imported with `{ ssr: false }` in `page.tsx`.

2. **Normal imports below the boundary.** Within a section that is already behind `{ ssr: false }`, child components can use normal `import` statements for browser-only libraries.

3. **No browser-only imports in `src/lib/`, `src/config/`, or `src/store/`.** These files may be imported by server components. If a utility function needs browser APIs, guard it with `typeof window !== "undefined"`.

4. **New sections with browser dependencies must get their own `{ ssr: false }` boundary.** When building Phase 4 (Gig Mode) or Phase 5 (Founder Timeline), add a new `dynamic()` import in `page.tsx`.

---

## Coverage Thresholds

Configured in `vitest.config.ts`:

```ts
coverage: {
  provider: "v8",
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
}
```

If coverage drops below 80% on any metric, the test command will fail. When adding new code, write tests to maintain or improve coverage.

### Excluded from Coverage

- `src/app/layout.tsx` (minimal boilerplate)
- `src/app/page.tsx` (dynamic import wiring only)
- Generated/config files (Tailwind, PostCSS, Vitest config)

---

## Development Workflow Summary

```bash
# 1. Create feature branch
git checkout -b feature/phase-4-gig-mode

# 2. Make changes, test locally
npm run dev          # Visual verification
npm run build        # SSR safety check
npm run lint         # Code quality
npm run typecheck    # Type safety
npm run test         # Unit tests

# 3. Commit with conventional format
git add -A
git commit -m "feat(gig-mode): implement full-screen browser takeover"

# 4. Push and open PR
git push -u origin feature/phase-4-gig-mode
# Open PR on GitHub against main

# 5. Verify Vercel preview deployment
# 6. Request review
# 7. Squash and merge after approval
```
