# Audio Configuration — Elevare Scribe

## Cloudflare R2 Bucket

| Property | Value |
|----------|-------|
| **Bucket Name** | `elevare-scribe-audio` |
| **Public URL** | `https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev` |
| **Region** | Automatic (Cloudflare edge) |
| **Access** | Public read via R2 public bucket URL |

---

## Audio Config File

All audio URLs are centralized in `src/config/audio.ts`:

```ts
export const AUDIO = {
  NO_HAY_QUIZAS: 'https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev/No-Hay-Quizás-Demo.wav',
  HAMMOCKS: 'https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev/Hammocks-and-Hardhats-Demo.wav',
  DOUBLE_OVERHEAD: 'https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev/Double-Overhead-v2-Demo.wav',
} as const;
```

Components import from this config rather than hardcoding URLs. If the R2 bucket URL changes, only this file needs to be updated.

---

## CORS Configuration

The R2 bucket is configured with the following CORS rules:

| Allowed Origin | Purpose |
|---------------|---------|
| `https://elevare-scribe.vercel.app` | Production deployment |
| `http://localhost:3000` | Local development |

### CORS Rule Details

- **Allowed Methods:** `GET`, `HEAD`
- **Allowed Headers:** `*`
- **Max Age:** `86400` (24 hours)

To update CORS rules, use the Cloudflare dashboard or the R2 API. Ensure any new deployment domains (preview deployments, custom domains) are added to the allowed origins list.

---

## Demo Tracks

| Track Name | Key in `audio.ts` | Filename in R2 |
|------------|-------------------|----------------|
| No Hay Quizas | `NO_HAY_QUIZAS` | `No-Hay-Quizás-Demo.wav` |
| Hammocks and Hardhats | `HAMMOCKS` | `Hammocks-and-Hardhats-Demo.wav` |
| Double Overhead | `DOUBLE_OVERHEAD` | `Double-Overhead-v2-Demo.wav` |

All demo tracks are sourced from Suno and normalized to -14 LUFS for consistent playback volume.

---

## Uploading Audio to R2

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed (`npm install -g wrangler`)
- Authenticated with Cloudflare (`wrangler login`)
- Access to the Elevare Edge Cloudflare account

### Upload Command

```bash
# Upload a single file
wrangler r2 object put elevare-scribe-audio/Filename-Here.wav \
  --file ./path/to/local/file.wav

# Upload with explicit content type
wrangler r2 object put elevare-scribe-audio/Filename-Here.wav \
  --file ./path/to/local/file.wav \
  --content-type audio/wav

# List objects in bucket
wrangler r2 object list elevare-scribe-audio

# Delete an object
wrangler r2 object delete elevare-scribe-audio/Filename-Here.wav
```

### After Upload

1. Verify the file is accessible at `https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev/Filename-Here.wav`
2. Update `src/config/audio.ts` with the new URL
3. Test playback in the browser on both `localhost:3000` and the deployed preview

---

## Naming Conventions

All filenames uploaded to R2 must follow these rules:

1. **URL-safe characters only.** Use hyphens (`-`) to separate words. Avoid spaces, underscores, or special characters except accented characters that are URL-encoded by the browser (e.g., `Quizás` becomes `Quiz%C3%A1s`).

2. **Descriptive names.** Format: `{Track-Name}-{Variant}-Demo.{ext}`
   - Examples: `No-Hay-Quizás-Demo.wav`, `Double-Overhead-v2-Demo.wav`

3. **Include version if applicable.** Use `-v2`, `-v3` suffix for revised versions rather than overwriting.

4. **Use WAV for demo quality.** WAV files are used for demo tracks to ensure highest quality pitch-shifting with Tone.js. MP3 compression artifacts are audible during real-time pitch manipulation.

5. **Normalize audio.** All tracks should be normalized to -14 LUFS (integrated loudness) before upload. This ensures consistent volume across tracks and prevents clipping during Tone.js processing.

---

## Cache Considerations

### R2 Caching Behavior

- R2 public buckets serve content through Cloudflare's CDN with default caching
- Files are cached at Cloudflare's edge locations after first request
- Cache TTL follows Cloudflare's default behavior (typically 2 hours for static assets)
- No `Cache-Control` headers are set by default on R2 objects

### Recommendations

- **Immutable naming:** Use versioned filenames (`-v2`, `-v3`) rather than overwriting. This avoids cache invalidation issues.
- **Cache busting:** If you must update a file in place, purge the Cloudflare cache via the dashboard or API.
- **Browser caching:** The CSP in `next.config.mjs` allows `media-src` from the R2 domain. Browsers will cache audio according to response headers.

### Content-Security-Policy

The `next.config.mjs` includes the R2 domain in the CSP `media-src` directive:

```
media-src 'self' https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev;
```

And in `connect-src` for fetch-based loading:

```
connect-src 'self' https://pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev https://*.ingest.sentry.io;
```

If the R2 public URL changes, both CSP directives must be updated.

---

## Failure Modes

### 1. CORS Error

**Symptom:** Browser console shows `Access-Control-Allow-Origin` error when loading audio.

**Cause:** The requesting domain is not in the R2 CORS allowed origins list.

**Fix:** Add the domain to the R2 CORS configuration. Common cases:
- Vercel preview deployments use unique URLs (e.g., `elevare-scribe-git-feature-x.vercel.app`) that are not in the CORS allow list
- Custom domains not yet added

### 2. 404 Not Found

**Symptom:** Audio fails to load with HTTP 404.

**Cause:** Filename mismatch between `audio.ts` and the actual object key in R2. Often caused by URL encoding of special characters (e.g., `á` in `Quizás`).

**Fix:** Verify the exact object key in R2 with `wrangler r2 object list elevare-scribe-audio` and match it in `audio.ts`.

### 3. CSP Blocked

**Symptom:** Audio blocked by Content-Security-Policy in production but works in dev.

**Cause:** The `media-src` or `connect-src` directive in `next.config.mjs` does not include the R2 domain.

**Fix:** Update the CSP in `next.config.mjs` to include the R2 public URL.

### 4. Audio Decoding Error

**Symptom:** `DOMException: The buffer passed to decodeAudioData contains an unknown content type.`

**Cause:** The file was uploaded without the correct content type, or it is corrupted.

**Fix:** Re-upload with explicit `--content-type audio/wav` flag. Verify the file plays locally before uploading.

### 5. Slow Initial Load

**Symptom:** Audio takes several seconds to load on first visit.

**Cause:** WAV files are large (a 10-second stereo WAV at 44.1kHz/16-bit is ~1.7MB). First request to a cold edge location has no cache.

**Mitigation:**
- Keep demo clips short (10 seconds max)
- Consider offering MP3 fallbacks for non-pitch-shifting playback
- Preload audio after critical content has rendered, not during initial page load
- Use `<link rel="preload" as="fetch">` for critical audio if needed
