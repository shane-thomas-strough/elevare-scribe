"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import ChordDisplay from "./ChordDisplay";
import GigModeAudio from "./GigModeAudio";

const TOTAL_CHORDS = 8;

/**
 * GigModeOverlay — full browser takeover stage teleprompter.
 *
 * Controls: Spacebar / Right arrow = advance chord.
 *           Left arrow = rewind chord. Escape = exit.
 *
 * Features:
 * - Teleprompter chord display with runway opacity (prev 10%, active 100%, next 40%)
 * - Visual metronome pulse on active chord (CSS keyframe 500ms)
 * - Paired lyrics for No Hay Quizás
 * - Stage light bleed background (rotating radial gradients at 5% opacity)
 * - Band sync simulation toasts (bassist 2s, drummer 4s)
 * - Low-pass filtered ambient audio via GigModeAudio
 * - Smooth scroll snap on chord advance
 */
export default function GigModeOverlay() {
  const isActive = useAppStore((s) => s.isGigModeActive);
  const setGigModeActive = useAppStore((s) => s.setGigModeActive);
  const [activeChord, setActiveChord] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [bandToasts, setBandToasts] = useState<string[]>([]);

  const exitGigMode = useCallback(() => {
    setGigModeActive(false);
    setShowPrompt(false);
    setActiveChord(0);
    setBandToasts([]);
  }, [setGigModeActive]);

  const advanceChord = useCallback(() => {
    setActiveChord((prev) => Math.min(prev + 1, TOTAL_CHORDS - 1));
  }, []);

  const rewindChord = useCallback(() => {
    setActiveChord((prev) => Math.max(prev - 1, 0));
  }, []);

  /** Body style overrides + 8-second exit prompt */
  useEffect(() => {
    if (!isActive) return;

    const origBg = document.body.style.backgroundColor;
    const origCursor = document.body.style.cursor;
    const origOverflow = document.body.style.overflow;

    document.body.style.transition = "background-color 600ms ease";
    document.body.style.backgroundColor = "#000000";
    document.body.style.cursor = "default";
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => setShowPrompt(true), 8000);

    return () => {
      clearTimeout(timer);
      document.body.style.transition = "background-color 600ms ease";
      document.body.style.backgroundColor = origBg;
      document.body.style.cursor = origCursor;
      document.body.style.overflow = origOverflow;
    };
  }, [isActive]);

  /** Keyboard controls: Spacebar/Right = advance, Left = rewind, Escape = exit */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitGigMode();
      } else if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        advanceChord();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        rewindChord();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, exitGigMode, advanceChord, rewindChord]);

  /** Band sync simulation toasts: bassist at 2s, drummer at 4s */
  useEffect(() => {
    if (!isActive) return;

    const t1 = setTimeout(() => {
      setBandToasts((prev) => [...prev, "Bassist connected."]);
    }, 2000);

    const t2 = setTimeout(() => {
      setBandToasts((prev) => [...prev, "Drummer synced."]);
    }, 4000);

    const t3 = setTimeout(() => {
      setBandToasts([]);
    }, 7000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive]);

  /** Copy band sync link */
  const copyBandLink = useCallback(async () => {
    const url = `${window.location.origin}/band-sync?session=demo`;
    try {
      await navigator.clipboard.writeText(url);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    } catch {
      /* clipboard may fail */
    }
  }, []);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 9980 }}
      role="dialog"
      aria-label="Gig Mode — stage teleprompter. Use Spacebar or Right Arrow to advance chords. Left Arrow to go back. Escape to exit."
      aria-modal="true"
    >
      {/* Stage light bleed — rotating radial gradients at 5% opacity */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9981 }} aria-hidden="true">
        <div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            top: "-10%",
            right: "-10%",
            background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)",
            animation: "stageLightRotate 25s linear infinite",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            bottom: "-15%",
            left: "-5%",
            background: "radial-gradient(circle, rgba(199,151,58,0.05) 0%, transparent 70%)",
            animation: "stageLightRotate 30s linear infinite reverse",
          }}
        />
      </div>

      {/* Chord teleprompter */}
      <ChordDisplay activeIndex={activeChord} />

      {/* Ambient audio with low-pass filter */}
      <GigModeAudio />

      {/* Control hints — bottom center */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/20 text-xs font-mono pointer-events-none"
        style={{ zIndex: 9995 }}
      >
        <span>← Prev</span>
        <span className="px-3 py-1 border border-white/10 rounded text-white/30">Space / →</span>
        <span>Next →</span>
        <span className="ml-4 text-white/15">Esc to exit</span>
      </div>

      {/* Chord counter — top left */}
      <div
        className="fixed top-4 left-4 text-white/20 text-xs font-mono pointer-events-none"
        style={{ zIndex: 9995 }}
      >
        {String(activeChord + 1).padStart(2, "0")} / {String(TOTAL_CHORDS).padStart(2, "0")}
      </div>

      {/* Band Sync button — top right */}
      <button
        onClick={copyBandLink}
        className="fixed top-4 right-4 px-3 py-1.5 rounded-md text-xs font-mono border border-es-cyan/30 text-es-cyan/60 hover:text-es-cyan hover:border-es-cyan/50 transition-colors pointer-events-auto"
        style={{ zIndex: 9998 }}
      >
        Band Sync — Share Link
      </button>

      {/* Link copied toast */}
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

      {/* Band sync simulation toasts — bottom left */}
      <div className="fixed bottom-16 left-6 flex flex-col gap-2" style={{ zIndex: 9996 }}>
        <AnimatePresence>
          {bandToasts.map((msg, i) => (
            <motion.div
              key={msg}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="px-3 py-1.5 rounded-md bg-es-green/10 border border-es-green/30 text-es-green text-xs font-mono"
            >
              {msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 8-second exit prompt */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto"
            style={{ zIndex: 9995 }}
          >
            <p className="font-inter text-lg text-white/60 mb-3">
              This is what your audience sees.
            </p>
            <button
              onClick={exitGigMode}
              className="px-6 py-2.5 rounded-xl border border-white/20 text-white/50 font-inter text-sm hover:text-white hover:border-white/40 transition-colors"
            >
              Exit Gig Mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage light rotation keyframe */}
      <style jsx global>{`
        @keyframes stageLightRotate {
          from { transform: rotate(0deg) translateX(30px); }
          to { transform: rotate(360deg) translateX(30px); }
        }
      `}</style>
    </div>
  );
}
