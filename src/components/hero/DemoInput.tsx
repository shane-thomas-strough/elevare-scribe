"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

type DemoPhase = "input" | "processing" | "complete";

export default function DemoInput() {
  const [phase, setPhase] = useState<DemoPhase>("input");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const setDemoLinkPasted = useAppStore((s) => s.setDemoLinkPasted);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);

  const handleInput = useCallback(
    (value: string) => {
      // Accept any URL-like input
      if (value.length > 8 && (value.includes("suno") || value.includes("udio") || value.includes("http"))) {
        setPhase("processing");
        setDemoLinkPasted(true);
        setAudioContextStarted(true);

        // Animate progress bar over 3 seconds
        const start = performance.now();
        const duration = 3000;
        const animate = (now: number) => {
          const elapsed = now - start;
          const p = Math.min(elapsed / duration, 1);
          setProgress(p);
          if (p < 1) {
            requestAnimationFrame(animate);
          } else {
            // After progress completes, wait for stem animation (8s total from paste)
            setTimeout(() => {
              setPhase("complete");
            }, 5000);
          }
        };
        requestAnimationFrame(animate);
      }
    },
    [setDemoLinkPasted, setAudioContextStarted]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text");
      // Small delay so the input value updates
      setTimeout(() => handleInput(text), 50);
    },
    [handleInput]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleInput(e.target.value);
    },
    [handleInput]
  );

  return (
    <div className="w-full max-w-[600px] mx-auto mt-8">
      <AnimatePresence mode="wait">
        {phase === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Paste any Suno or Udio link to start →"
              onPaste={handlePaste}
              onChange={handleChange}
              className="w-full px-6 py-4 rounded-xl bg-es-bg-secondary/80 border border-es-cyan/30 text-es-text-primary font-mono text-base placeholder:text-es-cyan/40 focus:outline-none focus:border-es-cyan/60 transition-all duration-300"
              style={{
                boxShadow: "0 0 30px rgba(0, 212, 255, 0.15), 0 0 60px rgba(0, 212, 255, 0.05)",
              }}
            />
            <p className="text-center text-es-text-tertiary text-sm mt-3 font-inter">
              No account required to preview. Free to start.
            </p>
          </motion.div>
        )}

        {phase === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <div className="w-full h-[56px] rounded-xl bg-es-bg-secondary/80 border border-es-cyan/30 overflow-hidden relative">
              {/* Progress fill */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-xl"
                style={{
                  width: `${progress * 100}%`,
                  background: "linear-gradient(90deg, rgba(0,212,255,0.2), rgba(0,212,255,0.4))",
                }}
              />
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)`,
                  animation: "shimmer 1.5s ease-in-out infinite",
                }}
              />
              {/* Processing text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-es-cyan font-mono text-sm tracking-wider">
                  {progress < 1 ? "Separating stems..." : "Analyzing waveforms..."}
                </span>
              </div>
            </div>
            <style jsx>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-es-text-primary text-xl font-inter mb-2">
              Your stems are ready.
            </p>
            <p className="text-es-text-secondary text-base font-inter mb-8">
              Create a free account to see your full chart.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => useAppStore.getState().openWaitlistModal()}
                className="px-8 py-3 rounded-xl bg-es-cyan text-es-bg-primary font-inter font-semibold text-base hover:brightness-110 transition-all duration-200"
                style={{
                  boxShadow: "0 0 30px rgba(0, 212, 255, 0.3)",
                }}
              >
                Get Started Free
              </button>
              <button
                onClick={() => useAppStore.getState().openWaitlistModal()}
                className="px-6 py-3 rounded-xl border border-es-text-tertiary/30 text-es-text-secondary font-inter text-sm hover:border-es-cyan/40 hover:text-es-text-primary transition-all duration-200"
              >
                Apply for Founding Artist Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
