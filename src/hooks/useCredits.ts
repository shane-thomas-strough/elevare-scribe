"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

interface UserCredits {
  credits_remaining: number;
  credits_used: number;
  tier: string;
  last_reset_at: string;
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
  credits_remaining: 3,
  credits_used: 0,
  tier: "free",
  last_reset_at: new Date().toISOString(),
};

/**
 * Hook for managing user credits for stem separation.
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

      // First, try to get existing credits
      const { data, error: fetchError } = await supabaseBrowser
        .from("user_credits")
        .select("credits_remaining, credits_used, tier, last_reset_at")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        // If no row exists, create one
        if (fetchError.code === "PGRST116") {
          const { data: newData, error: insertError } = await supabaseBrowser
            .from("user_credits")
            .insert({ user_id: user.id })
            .select("credits_remaining, credits_used, tier, last_reset_at")
            .single();

          if (insertError) {
            // If table doesn't exist yet, use defaults
            if (insertError.code === "42P01") {
              setCredits(DEFAULT_CREDITS);
              setLoading(false);
              return;
            }
            throw insertError;
          }

          setCredits(newData);
        } else if (fetchError.code === "42P01") {
          // Table doesn't exist yet - use defaults
          setCredits(DEFAULT_CREDITS);
        } else {
          throw fetchError;
        }
      } else {
        setCredits(data);
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
        .from("user_credits")
        .update({
          credits_remaining: credits.credits_remaining - 1,
          credits_used: credits.credits_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        // If table doesn't exist, still allow the operation
        if (updateError.code === "42P01") {
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
