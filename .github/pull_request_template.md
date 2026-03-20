## What changed
<!-- Describe what was modified and in which files -->

## Why it changed
<!-- Explain the motivation — bug fix, feature, refactor, etc. -->

## What was tested
<!-- Describe manual and automated testing performed -->

## Screenshots
<!-- If UI changed, include before/after screenshots -->

## Vercel preview URL
<!-- Paste the Vercel preview deployment URL -->

## Rollback notes
<!-- If this needs to be reverted, describe the process -->

## Checklist
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] No hardcoded secrets or credentials
- [ ] SSR-sensitive imports use `dynamic(() => import(...), { ssr: false })`
- [ ] New components have `"use client"` if they use browser APIs
