"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Stop 4 — The resolution. The product materializes as the answer.
 * After a 1-second pause: a simplified Elevare Scribe UI mockup fades in
 * behind the text at 30% opacity. Then a CTA button appears with a
 * Framer Motion fade-up entrance.
 *
 * @param active - Whether this stop is currently in the center viewport
 */
interface Stop4Props {
  active: boolean;
}

export default function Stop4({ active }: Stop4Props) {
  const [showUI, setShowUI] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  /** Sequence: 1s pause → UI fades in → 1.5s later CTA appears */
  useEffect(() => {
    if (!active) return;

    const uiTimer = setTimeout(() => setShowUI(true), 1000);
    const ctaTimer = setTimeout(() => setShowCTA(true), 2500);

    return () => {
      clearTimeout(uiTimer);
      clearTimeout(ctaTimer);
    };
  }, [active]);

  /** Scroll to pricing section (or bottom of page as placeholder) */
  const handleCTA = () => {
    const pricing = document.getElementById("pricing");
    if (pricing) {
      pricing.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-screen h-full flex-shrink-0 flex items-center justify-center px-8 sm:px-16">
      {/* Product UI mockup — fades in behind text at 30% opacity */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div className="w-[600px] max-w-[80vw] rounded-2xl border border-es-cyan/10 bg-es-bg-secondary/50 p-6 overflow-hidden">
              {/* Simulated sheet music notation */}
              <div className="mb-4 space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[1px] bg-es-text-tertiary/20 w-full" />
                ))}
                <div className="flex gap-8 mt-2">
                  {["Am", "F", "C", "G"].map((chord) => (
                    <span
                      key={chord}
                      className="font-clash text-sm text-es-cyan/40"
                    >
                      {chord}
                    </span>
                  ))}
                </div>
              </div>
              {/* Simulated transpose slider */}
              <div className="flex items-center gap-3">
                <span className="text-es-text-tertiary text-xs font-mono">Transpose</span>
                <div className="flex-1 h-1.5 rounded-full bg-es-bg-tertiary relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-es-cyan/50"
                    style={{ left: "50%" }}
                  />
                </div>
                <span className="text-es-cyan/40 text-xs font-mono">A</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Foreground text */}
      <div className="relative z-10 max-w-2xl text-center">
        <h3
          className="font-cormorant italic text-es-text-primary mb-4 leading-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          The product he needed did not exist.
        </h3>
        <p className="font-cormorant italic text-es-cyan mb-8 leading-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          So he built it.
        </p>

        {/* CTA — Framer Motion fade-up entrance */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <button
                onClick={handleCTA}
                className="px-8 py-3 rounded-xl bg-es-gold/10 border border-es-gold/40 text-es-gold font-inter font-medium text-base hover:bg-es-gold/20 hover:border-es-gold/60 transition-all duration-300"
                style={{ boxShadow: "0 0 30px rgba(199, 151, 58, 0.1)" }}
              >
                Join the Founding Artists →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
