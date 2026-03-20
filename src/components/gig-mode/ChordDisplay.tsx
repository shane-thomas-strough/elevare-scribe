"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Chord + lyric pairs for No Hay Quizás. Each entry represents one
 * "beat" the musician advances through using Spacebar or arrow keys.
 */
const CHART = [
  { chord: "Am", lyric: "No hay quizás en esta noche" },
  { chord: "F", lyric: "Solo tú y el mar abierto" },
  { chord: "C", lyric: "Las olas cantan lo que siento" },
  { chord: "G", lyric: "Y el viento sabe mi secreto" },
  { chord: "Em", lyric: "Camino solo por la arena" },
  { chord: "Am", lyric: "Tu voz me sigue como estrella" },
  { chord: "Dm", lyric: "No hay quizás, no hay tal vez" },
  { chord: "E", lyric: "Solo existe este momento" },
];

/**
 * ChordDisplay — stage teleprompter component. Shows the active chord at
 * full scale with a pulsing metronome animation, the next chord at 40%
 * opacity, and the previous chord at 10% opacity. Lyrics are paired below
 * each chord. Spacebar / Right arrow advances, Left arrow rewinds.
 *
 * @param activeIndex - Currently active chord index (0-7)
 * @param onAdvance - Callback to advance to next chord
 * @param onRewind - Callback to go to previous chord
 */
interface ChordDisplayProps {
  activeIndex: number;
}

export default function ChordDisplay({ activeIndex }: ChordDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Smooth-scroll the active chord into center view */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-chord-idx="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [activeIndex]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ zIndex: 9990 }}
      role="region"
      aria-label={`Teleprompter: ${CHART[activeIndex]?.chord ?? ""} — ${CHART[activeIndex]?.lyric ?? ""}`}
      aria-live="polite"
    >
      <div
        ref={scrollRef}
        className="flex flex-col items-center gap-4 w-full max-w-3xl px-8 overflow-y-auto max-h-[80vh] py-24 scrollbar-hide"
      >
        {CHART.map((item, i) => {
          const isActive = i === activeIndex;
          const isNext = i === activeIndex + 1;
          const isPrev = i === activeIndex - 1;
          const opacity = isActive ? 1 : isNext ? 0.4 : isPrev ? 0.1 : 0.05;

          return (
            <div
              key={i}
              data-chord-idx={i}
              className="text-center transition-all duration-500 ease-out w-full"
              style={{ opacity }}
            >
              <AnimatePresence mode="sync">
                <motion.span
                  key={`chord-${i}-${isActive}`}
                  className="font-clash font-bold block select-none"
                  style={{
                    fontSize: isActive ? "clamp(120px, 20vw, 200px)" : "clamp(48px, 8vw, 80px)",
                    color: "#F0F0F8",
                    textShadow: isActive
                      ? "0 0 40px rgba(0, 212, 255, 0.4), 0 0 80px rgba(0, 212, 255, 0.15)"
                      : "none",
                    lineHeight: 1.1,
                    animation: isActive ? "chordPulse 500ms ease-in-out infinite" : "none",
                    transition: "font-size 0.5s ease, text-shadow 0.5s ease",
                  }}
                >
                  {item.chord}
                </motion.span>
              </AnimatePresence>

              {/* Lyric line — only visible on active chord */}
              <div
                className="overflow-hidden transition-all duration-500"
                style={{
                  maxHeight: isActive ? "60px" : "0px",
                  opacity: isActive ? 0.7 : 0,
                }}
              >
                <p className="font-cormorant italic text-es-text-secondary text-xl mt-2">
                  {item.lyric}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metronome pulse keyframe */}
      <style jsx global>{`
        @keyframes chordPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
