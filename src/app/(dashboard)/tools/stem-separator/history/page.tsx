"use client";

import { type ReactElement, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";
import type { SeparationRecord } from "@/hooks/useSeparationHistory";

/**
 * History page for viewing past stem separations.
 * Uses the existing `projects` table.
 */
export default function StemSeparatorHistoryPage(): ReactElement {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<SeparationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (): Promise<void> => {
    if (!user || !supabaseBrowser) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabaseBrowser
        .from("projects")
        .select(
          "id, track_id, original_url, song_title, video_author, thumbnail_url, processing_time_seconds, status, created_at, stem_vocals_url, stem_drums_url, stem_bass_url, stem_other_url"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match our interface
      const transformed: SeparationRecord[] = (data || []).map((row) => ({
        id: row.id,
        track_id: row.track_id,
        original_url: row.original_url,
        song_title: row.song_title,
        video_author: row.video_author,
        thumbnail_url: row.thumbnail_url,
        processing_time_seconds: row.processing_time_seconds,
        status: row.status as "processing" | "completed" | "failed",
        created_at: row.created_at,
        stem_urls:
          row.stem_vocals_url && row.stem_drums_url && row.stem_bass_url
            ? {
                vocals: row.stem_vocals_url,
                drums: row.stem_drums_url,
                bass: row.stem_bass_url,
                other: row.stem_other_url || row.stem_vocals_url,
              }
            : null,
      }));

      setHistory(transformed);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Could not load history");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchHistory();
    }
  }, [authLoading, fetchHistory]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "—";
    return `${seconds.toFixed(1)}s`;
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-es-bg-tertiary border-t-es-cyan" />
          <p className="mt-4 font-inter text-sm text-es-text-secondary">Loading history...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-inter text-es-text-secondary mb-4">
            Sign in to view your separation history.
          </p>
          <Link
            href="/tools/stem-separator"
            className="rounded-xl bg-es-cyan px-6 py-3 font-inter font-medium text-es-bg-primary hover:bg-es-cyan/90 transition-colors"
          >
            Go to Stem Separator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/tools/stem-separator"
            className="flex items-center gap-2 font-inter text-sm text-es-text-secondary hover:text-es-cyan transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Separator
          </Link>
        </div>
        <h1 className="font-clash text-3xl font-bold text-es-text-primary">Separation History</h1>
        <p className="font-inter text-es-text-secondary mt-1">Your past stem separations</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6">
          <p className="font-inter text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 && !error && (
        <div className="rounded-2xl border border-es-border bg-es-bg-secondary p-12 text-center">
          <div className="rounded-full bg-es-bg-tertiary p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-es-text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <h3 className="font-clash text-lg font-semibold text-es-text-primary mb-2">
            No separations yet
          </h3>
          <p className="font-inter text-sm text-es-text-secondary mb-6">
            Your past stem separations will appear here.
          </p>
          <Link
            href="/tools/stem-separator"
            className="inline-block rounded-xl bg-es-cyan px-6 py-3 font-inter font-medium text-es-bg-primary hover:bg-es-cyan/90 transition-colors"
          >
            Separate Your First Track
          </Link>
        </div>
      )}

      {/* History List */}
      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              formatDate={formatDate}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HistoryCardProps {
  record: SeparationRecord;
  formatDate: (date: string) => string;
  formatDuration: (seconds: number | null) => string;
}

function HistoryCard({ record, formatDate, formatDuration }: HistoryCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    completed: "bg-green-500/20 text-green-400",
    processing: "bg-amber-500/20 text-amber-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="rounded-xl border border-es-border bg-es-bg-secondary overflow-hidden">
      {/* Main Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-es-bg-tertiary/30 transition-colors"
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-es-bg-tertiary flex-shrink-0">
          {record.thumbnail_url ? (
            <Image
              src={record.thumbnail_url}
              alt={record.song_title || "Video thumbnail"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-es-text-tertiary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-left min-w-0">
          <p className="font-inter font-medium text-es-text-primary truncate">
            {record.song_title || "Unknown video"}
          </p>
          <p className="font-inter text-xs text-es-text-tertiary">
            {record.video_author || "Unknown artist"} • {formatDate(record.created_at)}
          </p>
        </div>

        {/* Status & Duration */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-inter text-xs text-es-text-tertiary">
            {formatDuration(record.processing_time_seconds)}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[record.status]}`}
          >
            {record.status}
          </span>
          <svg
            className={`w-4 h-4 text-es-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && record.status === "completed" && record.stem_urls && (
        <div className="border-t border-es-border p-4 bg-es-bg-tertiary/30">
          <p className="font-inter text-xs text-es-text-tertiary mb-3">
            Download individual stems:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(record.stem_urls).map(([stem, url]) => (
              <a
                key={stem}
                href={url}
                download={`${stem}.mp3`}
                className="flex items-center justify-center gap-2 rounded-lg border border-es-border bg-es-bg-secondary px-3 py-2 font-inter text-sm text-es-text-secondary hover:border-es-cyan hover:text-es-cyan transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="capitalize">{stem}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Failed State */}
      {expanded && record.status === "failed" && (
        <div className="border-t border-es-border p-4 bg-red-500/5">
          <p className="font-inter text-sm text-red-400">
            This separation failed. Try separating this track again.
          </p>
          <Link
            href="/tools/stem-separator"
            className="inline-block mt-2 font-inter text-sm text-es-cyan hover:underline"
          >
            Try again →
          </Link>
        </div>
      )}
    </div>
  );
}
