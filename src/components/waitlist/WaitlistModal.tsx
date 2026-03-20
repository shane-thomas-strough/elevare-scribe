"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function WaitlistModal() {
  const isWaitlistModalOpen = useAppStore((s) => s.isWaitlistModalOpen);
  const closeWaitlistModal = useAppStore((s) => s.closeWaitlistModal);

  const [email, setEmail] = useState("");
  const [tools, setTools] = useState("");
  const [instrument, setInstrument] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    position: number;
    referralLink: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tools, instrument }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess({
        position: data.position,
        referralLink: data.referralLink,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isWaitlistModalOpen) return null;

  return (
    <AnimatePresence>
      {isWaitlistModalOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeWaitlistModal}
            onKeyDown={(e) => { if (e.key === "Escape") closeWaitlistModal(); }}
            role="button"
            tabIndex={-1}
            aria-label="Close modal"
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl border border-es-border bg-es-bg-secondary p-8 mx-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeWaitlistModal}
              className="absolute right-4 top-4 text-es-text-tertiary transition-colors hover:text-es-text-primary"
              aria-label="Close modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {!success ? (
              <>
                {/* Title */}
                <h2 className="font-clash text-2xl font-bold text-es-text-primary">
                  Join the Founding Artists
                </h2>
                <p className="mt-2 text-sm text-es-text-secondary">
                  Be one of the first 500 musicians to shape what we build next.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-es-border bg-es-bg-primary px-4 py-3 font-inter text-sm text-es-text-primary placeholder:text-es-text-tertiary focus:border-es-cyan/50 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Tools select */}
                  <div>
                    <select
                      value={tools}
                      onChange={(e) => setTools(e.target.value)}
                      className="w-full rounded-xl border border-es-border bg-es-bg-primary px-4 py-3 font-inter text-sm text-es-text-primary focus:border-es-cyan/50 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="" disabled>
                        What AI music tools do you use?
                      </option>
                      <option value="Suno">Suno</option>
                      <option value="Udio">Udio</option>
                      <option value="Both">Both</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Instrument */}
                  <div>
                    <input
                      type="text"
                      placeholder="Guitar, Piano, Voice..."
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      className="w-full rounded-xl border border-es-border bg-es-bg-primary px-4 py-3 font-inter text-sm text-es-text-primary placeholder:text-es-text-tertiary focus:border-es-cyan/50 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-es-cyan py-3 font-inter font-medium text-es-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Join the Waitlist"}
                  </button>
                </form>
              </>
            ) : (
              /* Success state */
              <div className="text-center">
                <div className="mb-4 text-4xl">&#127881;</div>
                <h3 className="font-clash text-xl font-bold text-es-text-primary">
                  You&apos;re in!
                </h3>
                <p className="mt-3 text-sm text-es-text-secondary">
                  You are number{" "}
                  <span className="font-semibold text-es-cyan">
                    {success.position}
                  </span>{" "}
                  on the Founding Artist list.
                </p>

                <div className="mt-6 rounded-xl border border-es-border bg-es-bg-primary p-4">
                  <p className="mb-2 text-xs text-es-text-tertiary">
                    Your referral link:
                  </p>
                  <p className="break-all font-mono text-xs text-es-text-secondary">
                    {success.referralLink}
                  </p>
                </div>

                <p className="mt-4 text-xs text-es-text-tertiary">
                  Each signup with your link moves you 10 spots closer to early
                  access.
                </p>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-4 w-full rounded-xl bg-es-cyan py-3 font-inter font-medium text-es-bg-primary transition-opacity hover:opacity-90"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
