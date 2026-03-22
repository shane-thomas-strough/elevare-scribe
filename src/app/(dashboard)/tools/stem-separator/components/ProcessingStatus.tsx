"use client";

import type { ReactElement } from "react";

interface ProcessingStatusProps {
  isProcessing: boolean;
  elapsedTime: number;
}

/**
 * Shows processing status with elapsed time counter.
 */
export function ProcessingStatus({
  isProcessing,
  elapsedTime,
}: ProcessingStatusProps): ReactElement | null {
  if (!isProcessing) return null;

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-es-cyan/30 bg-es-bg-secondary p-8">
      {/* Spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-es-bg-tertiary" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-es-cyan" />
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="font-clash text-lg font-semibold text-es-text-primary">
          Processing with RTX 5090
        </p>
        <p className="font-inter text-sm text-es-text-secondary mt-1">
          Separating vocals, drums, bass, and instrumentals...
        </p>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 rounded-full bg-es-bg-tertiary px-4 py-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-es-cyan" />
        <span className="font-mono text-sm text-es-text-primary">{timeDisplay}</span>
      </div>

      <p className="font-inter text-xs text-es-text-tertiary">
        Typical processing time: 3-5 minutes for a full song
      </p>
    </div>
  );
}
