"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

interface UserCredits {
  credits_remaining: number;
  credits_used: number;
  tier: string;
  credits_reset_at: string | null;
}

interface UseCreditsReturn {
  credits: UserCredits | null;
  loading: boolean;
  error: string | null;
  canSeparate: boolean;
  decrementCredits: () => Promise<boolean>;
  refreshCredits: () => Promise<void>;
}

const DEFAULT_CREDITS: UserCredits = {
  credits_remaining: 3, // PRD: 3 free transcriptions per month
  credits_used: 0,
  tier: "free",
  credits_reset_at: null,
};

/**
 * Hook for managing user credits for stem separation.
 * Uses the existing `users` table with credits columns.
 * Free tier: 3 credits
 */
export function useCredits(user: User | null): UseCreditsReturn {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async (): Promise<void> => {
    if (!user || !supabaseBrowser) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch from users table using email (users table uses email as identifier)
      const { data, error: fetchError } = await supabaseBrowser
        .from("users")
        .select("credits_remaining, credits_used, tier, credits_reset_at")
        .eq("email", user.email)
        .single();

      if (fetchError) {
        // If no row exists or column doesn't exist yet, use defaults
        if (fetchError.code === "PGRST116" || fetchError.code === "42703") {
          setCredits(DEFAULT_CREDITS);
        } else {
          throw fetchError;
        }
      } else {
        setCredits({
          credits_remaining: data.credits_remaining ?? 3,
          credits_used: data.credits_used ?? 0,
          tier: data.tier ?? "free",
          credits_reset_at: data.credits_reset_at,
        });
      }
    } catch (err) {
      console.error("Error fetching credits:", err);
      // Use default credits on error so users can still use the feature
      setCredits(DEFAULT_CREDITS);
      setError("Could not load credits. Using default values.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const decrementCredits = useCallback(async (): Promise<boolean> => {
    if (!user || !supabaseBrowser || !credits) {
      return false;
    }

    if (credits.credits_remaining <= 0) {
      setError("No credits remaining");
      return false;
    }

    try {
      const { error: updateError } = await supabaseBrowser
        .from("users")
        .update({
          credits_remaining: credits.credits_remaining - 1,
          credits_used: credits.credits_used + 1,
        })
        .eq("email", user.email);

      if (updateError) {
        // If column doesn't exist yet, still allow the operation locally
        if (updateError.code === "42703") {
          setCredits((prev) =>
            prev
              ? {
                  ...prev,
                  credits_remaining: prev.credits_remaining - 1,
                  credits_used: prev.credits_used + 1,
                }
              : null
          );
          return true;
        }
        throw updateError;
      }

      // Update local state
      setCredits((prev) =>
        prev
          ? {
              ...prev,
              credits_remaining: prev.credits_remaining - 1,
              credits_used: prev.credits_used + 1,
            }
          : null
      );

      return true;
    } catch (err) {
      console.error("Error decrementing credits:", err);
      setError("Could not update credits");
      return false;
    }
  }, [user, credits]);

  const refreshCredits = useCallback(async (): Promise<void> => {
    setLoading(true);
    await fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const canSeparate = credits !== null && credits.credits_remaining > 0;

  return {
    credits,
    loading,
    error,
    canSeparate,
    decrementCredits,
    refreshCredits,
  };
}
