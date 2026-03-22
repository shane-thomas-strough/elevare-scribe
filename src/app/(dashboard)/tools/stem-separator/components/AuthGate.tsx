"use client";

import type { ReactElement, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Requires authentication to access children.
 * Shows sign-in prompt if not authenticated.
 */
export function AuthGate({ children }: AuthGateProps): ReactElement {
  const { user, loading, signInWithGoogle, signInWithSpotify } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-es-bg-tertiary border-t-es-cyan" />
        <p className="mt-4 font-inter text-sm text-es-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 max-w-md mx-auto text-center">
        <div className="rounded-full bg-es-cyan/10 p-4 mb-6">
          <svg
            className="w-12 h-12 text-es-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <h2 className="font-clash text-2xl font-bold text-es-text-primary mb-2">
          Sign in to continue
        </h2>
        <p className="font-inter text-es-text-secondary mb-8">
          Create a free account to use the AI Stem Separator and save your processing history.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-inter font-medium text-gray-800 shadow-lg hover:shadow-xl transition-all w-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={signInWithSpotify}
            className="flex items-center justify-center gap-3 rounded-xl bg-[#1DB954] px-6 py-3 font-inter font-medium text-white shadow-lg hover:bg-[#1ed760] transition-all w-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span>Continue with Spotify</span>
          </button>
        </div>

        <p className="mt-6 font-inter text-xs text-es-text-tertiary">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
