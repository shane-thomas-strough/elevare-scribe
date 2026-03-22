"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface UseAuthReturn extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithSpotify: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Hook for managing user authentication state.
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    if (!supabaseBrowser) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    // Get initial session
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabaseBrowser) return;

    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/tools/stem-separator`,
      },
    });
  }, []);

  const signInWithSpotify = useCallback(async () => {
    if (!supabaseBrowser) return;

    await supabaseBrowser.auth.signInWithOAuth({
      provider: "spotify",
      options: {
        redirectTo: `${window.location.origin}/tools/stem-separator`,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabaseBrowser) return;
    await supabaseBrowser.auth.signOut();
  }, []);

  return {
    ...state,
    signInWithGoogle,
    signInWithSpotify,
    signOut,
  };
}
