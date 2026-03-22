"use client";

import { type ReactElement, useState, useEffect, useCallback } from "react";
import { separateAudio, generateTrackId, type SeparationResponse } from "@/lib/api/ai-engine";
import { YouTubeInput } from "./components/YouTubeInput";
import { ProcessingStatus } from "./components/ProcessingStatus";
import { StemPlayer } from "./components/StemPlayer";

type PageState = "idle" | "processing" | "complete" | "error";

/**
 * Stem Separator Tool Page
 *
 * Allows users to separate audio from YouTube videos into individual stems
 * (vocals, drums, bass, other) using the GPU-accelerated AI Engine.
 */
export default function StemSeparatorPage(): ReactElement {
  const [state, setState] = useState<PageState>("idle");
  const [result, setResult] = useState<SeparationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const handleSubmit = useCallback(async (url: string) => {
    setState("processing");
    setError(null);
    setResult(null);

    const trackId = generateTrackId();

    try {
      const response = await separateAudio(url, trackId);
      setResult(response);
      setState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setState("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
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

      {/* Main Content Area */}
      <div className="flex flex-col items-center gap-8">
        {/* Input Form - Show when idle or error */}
        {(state === "idle" || state === "error") && (
          <>
            <YouTubeInput onSubmit={handleSubmit} disabled={false} />
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
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
                Demucs separates the audio on RTX 5090
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
