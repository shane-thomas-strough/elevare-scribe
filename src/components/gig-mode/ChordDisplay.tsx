"use client";

import { useEffect, useRef } from "react";

/** No Hay Quizas chord progression used in the Gig Mode reveal */
const CHORDS = ["Am", "F", "C", "G", "Em", "Am", "Dm", "E"];

/**
 * ChordDisplay — renders the No Hay Quizas chord progression as massive text
 * across the viewport. Chords are white text on a black background, invisible
 * by default. They become visible only where the SpotlightCursor illuminates
 * them via mix-blend-mode: screen. A subtle left-to-right drift animation
 * ensures chords slowly reveal even without mouse movement.
 *
 * @remarks Uses GSAP for the drift animation. Browser-only.
 */
export default function ChordDisplay() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    /** Animate a slow left-to-right drift so chords self-reveal over time */
    import("gsap").then((gsapModule) => {
      if (cancelled || !containerRef.current) return;
      const gsap = gsapModule.default ?? gsapModule;
      gsap.fromTo(
        containerRef.current,
        { x: 0 },
        { x: -120, duration: 20, ease: "none", repeat: -1, yoyo: true }
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
      style={{ zIndex: 9990 }}
      aria-label="Chord progression display: Am, F, C, G, Em, Am, Dm, E"
      role="img"
    >
      <div ref={containerRef} className="flex gap-8 md:gap-16 flex-wrap justify-center px-8">
        {CHORDS.map((chord, i) => (
          <span
            key={`${chord}-${i}`}
            className="font-clash font-bold select-none"
            style={{
              fontSize: "clamp(80px, 15vw, 180px)",
              color: "#FFFFFF",
              lineHeight: 1.1,
              mixBlendMode: "screen",
            }}
          >
            {chord}
          </span>
        ))}
      </div>
    </div>
  );
}
