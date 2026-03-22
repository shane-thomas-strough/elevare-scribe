"use client";

import { useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { SeparationResponse, YouTubeMetadata } from "@/lib/api/ai-engine";

export interface SeparationRecord {
  id: string;
  track_id: string | null;
  original_url: string;
  song_title: string | null;
  video_author: string | null;
  thumbnail_url: string | null;
  processing_time_seconds: number | null;
  stem_urls: {
    vocals: string;
    drums: string;
    bass: string;
    other: string;
  } | null;
  status: "processing" | "completed" | "failed";
  created_at: string;
}

interface UseSeparationHistoryReturn {
  history: SeparationRecord[];
  loading: boolean;
  error: string | null;
  recordSeparation: (
    trackId: string,
    youtubeUrl: string,
    metadata: YouTubeMetadata | null
  ) => Promise<string | null>;
  completeSeparation: (recordId: string, result: SeparationResponse) => Promise<void>;
  failSeparation: (recordId: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
}

/**
 * Hook for managing stem separation history.
 * Uses the existing `projects` table.
 */
export function useSeparationHistory(user: User | null): UseSeparationHistoryReturn {
  const [history, setHistory] = useState<SeparationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (): Promise<void> => {
    if (!user || !supabaseBrowser) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
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
                other: row.stem_other_url || row.stem_vocals_url, // fallback
              }
            : null,
      }));

      setHistory(transformed);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Could not load history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordSeparation = useCallback(
    async (
      trackId: string,
      youtubeUrl: string,
      metadata: YouTubeMetadata | null
    ): Promise<string | null> => {
      if (!user || !supabaseBrowser) {
        return null;
      }

      try {
        const { data, error: insertError } = await supabaseBrowser
          .from("projects")
          .insert({
            user_id: user.id,
            track_id: trackId,
            original_url: youtubeUrl,
            song_title: metadata?.title || null,
            video_author: metadata?.author_name || null,
            thumbnail_url: metadata?.thumbnail_url || null,
            status: "processing",
          })
          .select("id")
          .single();

        if (insertError) {
          // Column might not exist yet - return null but don't fail
          if (insertError.code === "42703") {
            return null;
          }
          throw insertError;
        }

        return data.id;
      } catch (err) {
        console.error("Error recording separation:", err);
        return null;
      }
    },
    [user]
  );

  const completeSeparation = useCallback(
    async (recordId: string, result: SeparationResponse): Promise<void> => {
      if (!supabaseBrowser || !recordId) {
        return;
      }

      try {
        await supabaseBrowser
          .from("projects")
          .update({
            status: "completed",
            processing_time_seconds: result.processing_time_seconds,
            stem_vocals_url: result.stem_urls.vocals,
            stem_drums_url: result.stem_urls.drums,
            stem_bass_url: result.stem_urls.bass,
            stem_other_url: result.stem_urls.other,
          })
          .eq("id", recordId);
      } catch (err) {
        console.error("Error completing separation record:", err);
      }
    },
    []
  );

  const failSeparation = useCallback(async (recordId: string): Promise<void> => {
    if (!supabaseBrowser || !recordId) {
      return;
    }

    try {
      await supabaseBrowser
        .from("projects")
        .update({
          status: "failed",
        })
        .eq("id", recordId);
    } catch (err) {
      console.error("Error failing separation record:", err);
    }
  }, []);

  return {
    history,
    loading,
    error,
    recordSeparation,
    completeSeparation,
    failSeparation,
    fetchHistory,
  };
}
