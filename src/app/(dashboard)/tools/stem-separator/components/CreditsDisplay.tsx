"use client";

import type { ReactElement } from "react";

interface CreditsDisplayProps {
  creditsRemaining: number;
  creditsUsed: number;
  tier: string;
  loading?: boolean;
}

/**
 * Displays user's remaining credits and usage statistics.
 */
export function CreditsDisplay({
  creditsRemaining,
  creditsUsed: _creditsUsed,
  tier,
  loading = false,
}: CreditsDisplayProps): ReactElement {
  const totalCredits = tier === "free" ? 3 : tier === "pro" ? 50 : 3;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-es-text-secondary">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-es-bg-tertiary border-t-es-cyan" />
        <span className="font-inter text-xs">Loading credits...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Credit count */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(totalCredits)].map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i < creditsRemaining ? "bg-es-cyan" : "bg-es-bg-tertiary"
              }`}
            />
          ))}
        </div>
        <span className="font-inter text-sm text-es-text-secondary">
          <span className="font-medium text-es-text-primary">{creditsRemaining}</span>/
          {totalCredits} credits
        </span>
      </div>

      {/* Tier badge */}
      <span
        className={`rounded-full px-2 py-0.5 font-inter text-xs font-medium uppercase ${
          tier === "pro" ? "bg-es-cyan/20 text-es-cyan" : "bg-es-bg-tertiary text-es-text-secondary"
        }`}
      >
        {tier}
      </span>

      {/* Out of credits warning */}
      {creditsRemaining === 0 && (
        <span className="font-inter text-xs text-amber-400">Credits reset monthly</span>
      )}
    </div>
  );
}
