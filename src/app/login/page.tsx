"use client";

import type { ReactElement } from "react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

/**
 * Loading fallback for the login page.
 */
function LoginLoading(): ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center bg-es-bg-primary">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-es-bg-tertiary border-t-es-cyan" />
        <p className="mt-4 font-inter text-sm text-es-text-secondary">Loading...</p>
      </div>
    </main>
  );
}

/**
 * Login form component with OAuth buttons.
 */
function LoginForm(): ReactElement {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push("/tools/stem-separator");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoginLoading />;
  }

  // Don't render login form if user is authenticated (will redirect)
  if (user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-es-bg-primary">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-es-bg-tertiary border-t-es-cyan" />
          <p className="mt-4 font-inter text-sm text-es-text-secondary">Redirecting...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-es-bg-primary px-4 py-12">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-es-cyan/5 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-es-magenta/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-clash text-3xl font-bold">
              <span className="text-es-text-primary">Elevare</span>
              <span className="text-es-cyan">Scribe</span>
            </h1>
          </Link>
          <p className="mt-2 font-inter text-es-text-tertiary text-sm">
            AI-Powered Music Production Tools
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-es-bg-tertiary/50 bg-es-bg-secondary/80 backdrop-blur-sm p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-es-cyan/10 p-4">
              <svg
                className="w-10 h-10 text-es-cyan"
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
          </div>

          <h2 className="font-clash text-2xl font-bold text-es-text-primary text-center mb-2">
            Welcome Back
          </h2>
          <p className="font-inter text-es-text-secondary text-center mb-8">
            Sign in to access AI stem separation and save your processing history.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
              <p className="font-inter text-sm text-red-400 text-center">
                {error === "config"
                  ? "Authentication is not configured. Please try again later."
                  : error}
              </p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 font-inter font-medium text-gray-800 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all w-full"
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
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-es-bg-tertiary" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-es-bg-secondary px-3 font-inter text-es-text-tertiary">
                Free to use
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-es-text-secondary">
              <svg
                className="w-5 h-5 text-es-cyan flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-inter text-sm">5 free separations per month</span>
            </div>
            <div className="flex items-center gap-3 text-es-text-secondary">
              <svg
                className="w-5 h-5 text-es-cyan flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-inter text-sm">GPU-accelerated AI processing</span>
            </div>
            <div className="flex items-center gap-3 text-es-text-secondary">
              <svg
                className="w-5 h-5 text-es-cyan flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-inter text-sm">Save and access your history</span>
            </div>
          </div>

          {/* Terms */}
          <p className="mt-8 font-inter text-xs text-es-text-tertiary text-center">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-es-cyan hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-es-cyan hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-inter text-sm text-es-text-secondary hover:text-es-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

/**
 * Login page with Google and Spotify OAuth authentication.
 * Redirects authenticated users to the stem separator tool.
 */
export default function LoginPage(): ReactElement {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
