"use client";

import { type ReactElement, useState, useCallback } from "react";
import { isValidYouTubeUrl } from "@/lib/api/ai-engine";

interface YouTubeInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

/**
 * YouTube URL input component with validation.
 */
export function YouTubeInput({ onSubmit, disabled = false }: YouTubeInputProps): ReactElement {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!url.trim()) {
        setError("Please enter a YouTube URL");
        return;
      }

      if (!isValidYouTubeUrl(url)) {
        setError("Please enter a valid YouTube URL");
        return;
      }

      onSubmit(url);
    },
    [url, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col gap-3">
        <label
          htmlFor="youtube-url"
          className="font-inter text-sm font-medium text-es-text-secondary"
        >
          YouTube URL
        </label>
        <div className="flex gap-3">
          <input
            id="youtube-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={disabled}
            className="flex-1 rounded-xl border border-es-border bg-es-bg-tertiary px-4 py-3 font-inter text-es-text-primary placeholder:text-es-text-tertiary focus:border-es-cyan focus:outline-none focus:ring-1 focus:ring-es-cyan disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled}
            className="rounded-xl bg-es-cyan px-6 py-3 font-inter font-medium text-es-bg-primary transition-all hover:bg-es-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Separate
          </button>
        </div>
        {error && <p className="font-inter text-sm text-red-400">{error}</p>}
      </div>
    </form>
  );
}
