# Release Process — Elevare Scribe

## Versioning

Elevare Scribe follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Component | Increment When |
|-----------|---------------|
| **MAJOR** | Breaking changes to public-facing functionality, major UI redesigns, API contract changes |
| **MINOR** | New features, new sections, significant enhancements (each build phase is a minor version) |
| **PATCH** | Bug fixes, performance improvements, content updates, dependency patches |

### Pre-1.0 Convention

While the project is in pre-launch development (0.x.y), MINOR increments represent completed build phases, and PATCH increments represent fixes and migrations within a phase.

### Examples

- `0.1.0` — Phase 0-1 complete (repo + foundation)
- `0.2.0` — Phase 2 complete (WebGL hero)
- `0.3.0` — Phase 3 complete (How It Works)
- `0.3.1` — Patch: demo tracks added
- `0.3.2` — Patch: audio migrated to R2
- `0.3.3` — Patch: SSR crash fix
- `0.4.0` — Phase 4 complete (Gig Mode)
- `1.0.0` — Public launch

---

## Git Tag Process

### Creating a Release Tag

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Verify the build passes
npm run build
npm run lint
npm run typecheck
npm run test

# Create an annotated tag
git tag -a v0.3.3 -m "v0.3.3: SSR crash fix for Three.js/Tone.js/OSMD"

# Push the tag to remote
git push origin v0.3.3
```

### Tag Naming

- Always prefix with `v`: `v0.3.3`, not `0.3.3`
- Use the exact semver version from `package.json`
- Include a brief description in the tag annotation

### Updating package.json Version

Before tagging, update the version in `package.json`:

```bash
# For a patch release
npm version patch --no-git-tag-version

# For a minor release
npm version minor --no-git-tag-version

# For a major release
npm version major --no-git-tag-version
```

Then commit the version bump, tag, and push:

```bash
git add package.json package-lock.json
git commit -m "chore: bump version to 0.3.3"
git tag -a v0.3.3 -m "v0.3.3: SSR crash fix"
git push origin main --tags
```

---

## Deployment

### Automatic Deployment (Vercel)

Vercel is configured for automatic deployment:

| Branch | Deployment Type | URL |
|--------|----------------|-----|
| `main` | Production | `elevare-scribe.vercel.app` |
| Feature branches | Preview | `elevare-scribe-git-{branch}.vercel.app` |
| Pull requests | Preview | `elevare-scribe-{pr-number}.vercel.app` |

Every push to `main` triggers a production deployment. Every push to a feature branch or PR creates a preview deployment.

### Vercel Configuration

Deployment settings are defined in `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### Environment Variables

Environment variables are managed in the Vercel dashboard under **Settings > Environment Variables**. They are scoped to Production, Preview, and/or Development environments.

**Never commit environment variables to the repository.** See `SECURITY.md` for details.

---

## Rollback Process

### Via Vercel Dashboard

1. Go to the Vercel project dashboard
2. Navigate to **Deployments**
3. Find the last known good deployment
4. Click the three-dot menu and select **Promote to Production**
5. The previous deployment is instantly promoted, no rebuild required

### Via Git

```bash
# Revert the problematic commit
git revert HEAD
git push origin main
# Vercel will auto-deploy the revert
```

### Emergency Rollback

If the site is completely broken and needs immediate rollback:

1. Open Vercel dashboard
2. Go to **Deployments**
3. Find the last working deployment (green checkmark)
4. Click **Promote to Production**
5. This takes effect in seconds, no rebuild needed

---

## Deploy Verification Checklist

Run this checklist after every production deployment:

### Automated (Pre-Deploy)

- [ ] `npm run build` — production build completes without errors
- [ ] `npm run lint` — zero lint warnings or errors
- [ ] `npm run typecheck` — TypeScript compilation passes
- [ ] `npm run test` — all unit tests pass
- [ ] Vercel build log shows no errors or warnings

### Manual (Post-Deploy)

- [ ] **Page loads:** Visit `elevare-scribe.vercel.app` — page loads without blank screen
- [ ] **No console errors:** Open DevTools Console — no red errors
- [ ] **WebGL hero renders:** The Three.js canvas displays the generative waveform
- [ ] **Mouse reactivity:** Moving the mouse over the hero changes the shader output
- [ ] **Demo input works:** Pasting a URL triggers the stem separation animation
- [ ] **Scroll to How It Works:** Section pins correctly with GSAP ScrollTrigger
- [ ] **Step navigation:** Clicking steps 1-6 shows the correct preview
- [ ] **Audio plays:** Click play on a demo track — audio is audible
- [ ] **Pitch shift:** Moving the pitch slider changes the audio pitch in real time
- [ ] **Sheet music renders:** OSMD displays notation in the Step 5 preview
- [ ] **Fonts loaded:** Clash Display, Inter, and Cormorant Garamond render correctly
- [ ] **Mobile responsive:** Check on a mobile viewport — layout adapts correctly
- [ ] **Security headers:** Check response headers for X-Frame-Options, CSP, X-Content-Type-Options

---

## Post-Deploy Smoke Test

A quick 2-minute test to run after every production deployment:

1. Open `https://elevare-scribe.vercel.app` in an incognito/private window
2. Wait for the page to fully load (WebGL canvas should be visible)
3. Move mouse over the hero — shader should react
4. Scroll down to How It Works — section should pin
5. Click through all 6 steps — previews should render
6. If Step 3 or Step 5 has audio — verify it plays after clicking
7. Open DevTools Network tab — verify no failed requests (red entries)
8. Open DevTools Console — verify no errors
9. Check the page on a mobile viewport (DevTools responsive mode)
10. Verify fonts: headlines should be in Clash Display, body in Inter

If any step fails, initiate rollback and investigate.

---

## Release Communication

For significant releases (minor version bumps):

1. Update `CHANGELOG.md` with the new version entry
2. Create a GitHub Release from the tag with release notes
3. If applicable, notify stakeholders via the project communication channel
