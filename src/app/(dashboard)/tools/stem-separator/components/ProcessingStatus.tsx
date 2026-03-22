"use client";

import type { ReactElement } from "react";

interface ProcessingStatusProps {
  isProcessing: boolean;
  elapsedTime: number;
}

interface Phase {
  name: string;
  description: string;
  icon: string;
}

const PHASES: Phase[] = [
  { name: "Downloading", description: "Fetching audio from YouTube", icon: "⬇️" },
  { name: "Separating", description: "AI splitting stems with RTX 5090", icon: "🎛️" },
  { name: "Encoding", description: "Converting to MP3 & uploading", icon: "📤" },
];

/**
 * Determines current processing phase based on elapsed time.
 * Optimized backend: ~1s download, ~2s GPU, ~3s encode/upload
 */
function getCurrentPhase(elapsedTime: number): number {
  if (elapsedTime < 2) return 0; // Downloading
  if (elapsedTime < 4) return 1; // Separating
  return 2; // Encoding & uploading
}

/**
 * Shows processing status with phase indicators and elapsed time.
 */
export function ProcessingStatus({
  isProcessing,
  elapsedTime,
}: ProcessingStatusProps): ReactElement | null {
  if (!isProcessing) return null;

  const currentPhase = getCurrentPhase(elapsedTime);
  const phase = PHASES[currentPhase];

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-es-cyan/30 bg-es-bg-secondary p-8 w-full max-w-md">
      {/* Phase Indicator */}
      <div className="flex items-center gap-2 w-full">
        {PHASES.map((p, index) => (
          <div key={p.name} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                index < currentPhase
                  ? "bg-es-green"
                  : index === currentPhase
                    ? "bg-es-cyan animate-pulse"
                    : "bg-es-bg-tertiary"
              }`}
            />
            <span
              className={`text-xs font-inter ${
                index === currentPhase ? "text-es-cyan" : "text-es-text-tertiary"
              }`}
            >
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* Current Phase Display */}
      <div className="flex items-center gap-4">
        <span className="text-4xl">{phase?.icon}</span>
        <div>
          <p className="font-clash text-lg font-semibold text-es-text-primary">{phase?.name}...</p>
          <p className="font-inter text-sm text-es-text-secondary">{phase?.description}</p>
        </div>
      </div>

      {/* Spinner */}
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-es-bg-tertiary" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-es-cyan" />
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 rounded-full bg-es-bg-tertiary px-4 py-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-es-cyan" />
        <span className="font-mono text-sm text-es-text-primary">{elapsedTime}s</span>
      </div>

      <p className="font-inter text-xs text-es-text-tertiary">
        Typical processing time: ~6 seconds
      </p>
    </div>
  );
}
