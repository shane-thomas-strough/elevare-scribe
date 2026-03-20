"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function FloatingCTA() {
  const [pastHero, setPastHero] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isGigModeActive = useAppStore((s) => s.isGigModeActive);

  useEffect(() => {
    const handleScroll = () => {
      setPastHero(window.scrollY > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!dismissed) return;

    const timer = setTimeout(() => {
      setDismissed(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, [dismissed]);

  if (isGigModeActive) return null;

  const show = pastHero && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <button
            type="button"
            onClick={() => useAppStore.getState().openWaitlistModal()}
            className="rounded-full bg-es-cyan px-5 py-2.5 font-inter text-sm font-medium text-es-bg-primary shadow-lg transition-opacity hover:opacity-90"
          >
            Apply for Access &rarr;
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-es-bg-secondary text-es-text-tertiary transition-colors hover:text-es-text-primary"
            aria-label="Dismiss"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3L3 9M3 3L9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
