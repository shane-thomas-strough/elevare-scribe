"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import type { YouTubeMetadata } from "@/lib/api/ai-engine";

interface YouTubePreviewProps {
  metadata: YouTubeMetadata;
  onSeparate: () => void;
  disabled?: boolean;
}

/**
 * Displays YouTube video preview with thumbnail and title.
 */
export function YouTubePreview({
  metadata,
  onSeparate,
  disabled = false,
}: YouTubePreviewProps): ReactElement {
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-es-border bg-es-bg-secondary overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-es-bg-tertiary">
        <Image
          src={metadata.thumbnail_url}
          alt={metadata.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-clash font-semibold text-white text-lg line-clamp-2">
            {metadata.title}
          </p>
          <p className="font-inter text-sm text-white/70 mt-1">{metadata.author_name}</p>
        </div>
      </div>

      {/* Action */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-es-text-secondary">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          <span className="font-inter text-sm">Ready to separate</span>
        </div>
        <button
          onClick={onSeparate}
          disabled={disabled}
          className="rounded-xl bg-es-cyan px-6 py-3 font-inter font-medium text-es-bg-primary transition-all hover:bg-es-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>🎛️</span>
          <span>Separate Stems</span>
        </button>
      </div>
    </div>
  );
}
