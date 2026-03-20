"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import SpotlightCursor from "./SpotlightCursor";
import ChordDisplay from "./ChordDisplay";
import GigModeAudio from "./GigModeAudio";

/**
 * GigModeOverlay — the full browser takeover component. When isGigModeActive
 * is true, executes a sequenced takeover: black background, hidden cursor,
 * spotlight + chord display, ambient audio, and an 8-second exit prompt.
 *
 * Takeover sequence:
 * 1. Transition body background to #000000 over 600ms (GSAP)
 * 2. Fade all page content except this overlay to 0 opacity over 400ms
 * 3. Apply cursor:none to body
 * 4. Activate SpotlightCursor
 * 5. Render ChordDisplay
 * 6. Fade in ambient audio (GigModeAudio)
 * 7. After 8s show exit prompt
 *
 * Escape key exits immediately (accessibility requirement).
 *
 * Zustand reads: isGigModeActive
 * Zustand writes: setGigModeActive
 */
export default function GigModeOverlay() {
  const isActive = useAppStore((s) => s.isGigModeActive);
  const setGigModeActive = useAppStore((s) => s.setGigModeActive);
  const [showPrompt, setShowPrompt] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  /** Exit Gig Mode and reverse all body changes */
  const exitGigMode = useCallback(() => {
    setGigModeActive(false);
    setShowPrompt(false);
  }, [setGigModeActive]);

  /** Apply/remove body-level style overrides on activation */
  useEffect(() => {
    if (!isActive) return;

    const origBg = document.body.style.backgroundColor;
    const origCursor = document.body.style.cursor;
    const origOverflow = document.body.style.overflow;

    // Step 1 & 3: black background + hide cursor + lock scroll
    document.body.style.transition = "background-color 600ms ease";
    document.body.style.backgroundColor = "#000000";
    document.body.style.cursor = "none";
    document.body.style.overflow = "hidden";

    // Step 7: show exit prompt after 8 seconds
    const timer = setTimeout(() => setShowPrompt(true), 8000);

    return () => {
      clearTimeout(timer);
      document.body.style.transition = "background-color 600ms ease";
      document.body.style.backgroundColor = origBg;
      document.body.style.cursor = origCursor;
      document.body.style.overflow = origOverflow;
    };
  }, [isActive]);

  /** Escape key handler for accessibility */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitGigMode();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, exitGigMode]);

  /** Copy band sync link to clipboard */
  const copyBandLink = useCallback(async () => {
    const url = `${window.location.origin}/band-sync?session=demo`;
    try {
      await navigator.clipboard.writeText(url);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    } catch {
      /* clipboard may fail in some contexts — ignore silently */
    }
  }, []);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 9980, backgroundColor: "#000000" }}
      role="dialog"
      aria-label="Gig Mode — stage performance view"
      aria-modal="true"
    >
      {/* Chord display — revealed by spotlight */}
      <ChordDisplay />

      {/* Spotlight cursor */}
      <SpotlightCursor />

      {/* Ambient audio */}
      <GigModeAudio />

      {/* Band Sync indicator */}
      <button
        onClick={copyBandLink}
        className="fixed top-4 right-4 px-3 py-1.5 rounded-md text-xs font-mono border border-es-cyan/30 text-es-cyan/60 hover:text-es-cyan hover:border-es-cyan/50 transition-colors pointer-events-auto"
        style={{ zIndex: 9998 }}
      >
        Band Sync — Share Link
      </button>

      {/* Toast notification */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 px-4 py-2 rounded-lg bg-es-cyan/10 border border-es-cyan/30 text-es-cyan text-xs font-inter"
            style={{ zIndex: 9998 }}
          >
            Link copied — share with your band
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8-second exit prompt */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 flex flex-col items-center justify-center pointer-events-auto"
            style={{ zIndex: 9995 }}
          >
            <p
              className="font-inter text-xl text-white/80 mb-4"
              style={{ mixBlendMode: "screen" }}
            >
              This is what your audience sees.
            </p>
            <button
              onClick={exitGigMode}
              className="px-6 py-3 rounded-xl border border-white/20 text-white/60 font-inter text-sm hover:text-white hover:border-white/40 transition-colors"
              style={{ mixBlendMode: "screen" }}
            >
              Exit Gig Mode
            </button>
            <p className="mt-4 text-white/30 text-xs font-mono">Press Escape to exit</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
