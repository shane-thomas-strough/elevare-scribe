"use client";

import { useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { SeparationResponse, YouTubeMetadata } from "@/lib/api/ai-engine";

export interface SeparationRecord {
  id: string;
  track_id: string;
  youtube_url: string;
  video_title: string | null;
  video_author: string | null;
  thumbnail_url: string | null;
  processing_time_seconds: number | null;
  stem_urls: SeparationResponse["stem_urls"] | null;
  status: "processing" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
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
        .from("stem_separations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        // Table might not exist yet
        if (fetchError.code === "42P01") {
          setHistory([]);
          return;
        }
        throw fetchError;
      }

      setHistory(data || []);
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
          .from("stem_separations")
          .insert({
            user_id: user.id,
            track_id: trackId,
            youtube_url: youtubeUrl,
            video_title: metadata?.title || null,
            video_author: metadata?.author_name || null,
            thumbnail_url: metadata?.thumbnail_url || null,
            status: "processing",
          })
          .select("id")
          .single();

        if (insertError) {
          // Table might not exist yet - return null but don't fail
          if (insertError.code === "42P01") {
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
          .from("stem_separations")
          .update({
            status: "completed",
            processing_time_seconds: result.processing_time_seconds,
            stem_urls: result.stem_urls,
            completed_at: new Date().toISOString(),
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
        .from("stem_separations")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
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
