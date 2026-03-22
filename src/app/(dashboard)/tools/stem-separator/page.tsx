"use client";

import { type ReactElement, useState, useEffect, useCallback, useRef } from "react";
import {
  separateAudio,
  generateTrackId,
  fetchYouTubeMetadata,
  type SeparationResponse,
  type YouTubeMetadata,
} from "@/lib/api/ai-engine";
import { YouTubeInput } from "./components/YouTubeInput";
import { YouTubePreview } from "./components/YouTubePreview";
import { ProcessingStatus } from "./components/ProcessingStatus";
import { StemPlayer } from "./components/StemPlayer";
import { AuthGate } from "./components/AuthGate";
import { CreditsDisplay } from "./components/CreditsDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useSeparationHistory } from "@/hooks/useSeparationHistory";

type PageState = "idle" | "loading-preview" | "preview" | "processing" | "complete" | "error";

/**
 * Stem Separator Tool Page
 *
 * Allows users to separate audio from YouTube videos into individual stems
 * (vocals, drums, bass, other) using the GPU-accelerated AI Engine.
 */
export default function StemSeparatorPage(): ReactElement {
  const [state, setState] = useState<PageState>("idle");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [result, setResult] = useState<SeparationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { user, signOut } = useAuth();
  const {
    credits,
    loading: creditsLoading,
    canSeparate,
    decrementCredits,
    refreshCredits,
  } = useCredits(user);
  const { recordSeparation, completeSeparation, failSeparation } = useSeparationHistory(user);

  // Track current separation record ID
  const currentRecordIdRef = useRef<string | null>(null);

  // Timer for processing status
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state === "processing") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const performSeparation = useCallback(
    async (url: string, meta: YouTubeMetadata | null) => {
      // Check credits before processing
      if (!canSeparate) {
        setError("No credits remaining. Credits reset monthly.");
        setState("error");
        return;
      }

      setState("processing");
      setError(null);
      setResult(null);

      const trackId = generateTrackId();

      // Decrement credits before starting
      const decremented = await decrementCredits();
      if (!decremented) {
        setError("Could not use credit. Please try again.");
        setState("error");
        return;
      }

      // Record separation in history
      const recordId = await recordSeparation(trackId, url, meta);
      currentRecordIdRef.current = recordId;

      try {
        const response = await separateAudio(url, trackId);
        setResult(response);
        setState("complete");

        // Update history record
        if (recordId) {
          await completeSeparation(recordId, response);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setState("error");

        // Mark separation as failed in history
        if (recordId) {
          await failSeparation(recordId);
        }

        // Refresh credits (in case there was an issue)
        await refreshCredits();
      }
    },
    [
      canSeparate,
      decrementCredits,
      recordSeparation,
      completeSeparation,
      failSeparation,
      refreshCredits,
    ]
  );

  const handleSeparate = useCallback(
    async (url?: string) => {
      const targetUrl = url || currentUrl;
      await performSeparation(targetUrl, metadata);
    },
    [currentUrl, metadata, performSeparation]
  );

  const handleUrlSubmit = useCallback(
    async (url: string) => {
      setCurrentUrl(url);
      setState("loading-preview");
      setError(null);

      const meta = await fetchYouTubeMetadata(url);
      if (meta) {
        setMetadata(meta);
        setState("preview");
      } else {
        // If metadata fails, still allow processing
        setMetadata(null);
        await performSeparation(url, null);
      }
    },
    [performSeparation]
  );

  const handleReset = useCallback(() => {
    setState("idle");
    setCurrentUrl("");
    setMetadata(null);
    setResult(null);
    setError(null);
    currentRecordIdRef.current = null;
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="font-clash text-3xl font-bold text-es-text-primary mb-2">
          AI Stem Separator
        </h1>
        <p className="font-inter text-es-text-secondary">
          Powered by Demucs &amp; RTX 5090 GPU acceleration
        </p>
      </div>

      {/* Auth Gate */}
      <AuthGate>
        {/* User Info Bar */}
        {user && (
          <div className="flex flex-col gap-3 mb-6 p-4 rounded-xl bg-es-bg-secondary border border-es-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.user_metadata?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="font-inter text-sm text-es-text-primary">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="font-inter text-xs text-es-text-tertiary hover:text-es-cyan transition-colors"
              >
                Sign out
              </button>
            </div>
            {/* Credits Display */}
            <div className="flex items-center justify-between pt-2 border-t border-es-border">
              <CreditsDisplay
                creditsRemaining={credits?.credits_remaining ?? 0}
                creditsUsed={credits?.credits_used ?? 0}
                tier={credits?.tier ?? "free"}
                loading={creditsLoading}
              />
              <div className="flex items-center gap-4">
                <a
                  href="/tools/stem-separator/history"
                  className="font-inter text-xs text-es-text-tertiary hover:text-es-cyan transition-colors"
                >
                  View History
                </a>
                <a href="/pricing" className="font-inter text-xs text-es-cyan hover:underline">
                  Upgrade for more
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col items-center gap-8">
          {/* Input Form - Show when idle or error */}
          {(state === "idle" || state === "error") && (
            <>
              <YouTubeInput onSubmit={handleUrlSubmit} disabled={false} />
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center max-w-md">
                  <p className="font-inter text-sm text-red-400">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-2 font-inter text-sm text-es-cyan hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </>
          )}

          {/* Loading Preview */}
          {state === "loading-preview" && (
            <div className="flex items-center gap-3 text-es-text-secondary">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-es-bg-tertiary border-t-es-cyan" />
              <span className="font-inter text-sm">Loading video info...</span>
            </div>
          )}

          {/* YouTube Preview */}
          {state === "preview" && metadata && (
            <>
              <YouTubePreview
                metadata={metadata}
                onSeparate={() => handleSeparate()}
                disabled={!canSeparate || creditsLoading}
              />
              {!canSeparate && !creditsLoading && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center max-w-md">
                  <p className="font-inter text-sm text-amber-400">
                    You&apos;ve used all your free credits. Upgrade to continue separating tracks.
                  </p>
                  <a
                    href="/pricing"
                    className="inline-block mt-3 rounded-lg bg-es-cyan px-4 py-2 font-inter text-sm font-medium text-es-bg-primary hover:bg-es-cyan/90 transition-colors"
                  >
                    View Pricing
                  </a>
                </div>
              )}
            </>
          )}

          {/* Processing Status */}
          {state === "processing" && (
            <ProcessingStatus isProcessing={true} elapsedTime={elapsedTime} />
          )}

          {/* Results */}
          {state === "complete" && result && (
            <>
              <StemPlayer
                stems={result.stem_urls}
                trackId={result.track_id}
                processingTime={result.processing_time_seconds}
              />
              <button
                onClick={handleReset}
                className="rounded-xl border border-es-border px-6 py-3 font-inter text-sm text-es-text-secondary hover:border-es-cyan hover:text-es-cyan transition-all"
              >
                Separate Another Track
              </button>
            </>
          )}
        </div>
      </AuthGate>

      {/* Info Section */}
      <div className="mt-12 rounded-2xl border border-es-border bg-es-bg-secondary p-6">
        <h2 className="font-clash text-lg font-semibold text-es-text-primary mb-4">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-es-cyan/10 text-es-cyan font-clash font-bold">
              1
            </span>
            <div>
              <p className="font-inter font-medium text-es-text-primary">Paste URL</p>
              <p className="font-inter text-sm text-es-text-secondary">
                Enter any YouTube video URL
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-es-cyan/10 text-es-cyan font-clash font-bold">
              2
            </span>
            <div>
              <p className="font-inter font-medium text-es-text-primary">AI Processing</p>
              <p className="font-inter text-sm text-es-text-secondary">
                Demucs separates the audio in ~6 seconds
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-es-cyan/10 text-es-cyan font-clash font-bold">
              3
            </span>
            <div>
              <p className="font-inter font-medium text-es-text-primary">Download Stems</p>
              <p className="font-inter text-sm text-es-text-secondary">
                Get vocals, drums, bass &amp; more
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
