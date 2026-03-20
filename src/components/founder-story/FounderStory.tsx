"use client";

import { useEffect, useRef, useState } from "react";
import Stop1 from "./Stop1";
import Stop2 from "./Stop2";
import Stop3 from "./Stop3";
import Stop4 from "./Stop4";

/**
 * FounderStory — cinematic horizontal scroll timeline telling the
 * origin story. GSAP ScrollTrigger pins the section vertically while
 * translating the inner container horizontally (xPercent: -75, covering
 * 4 viewport widths) as the user scrolls. The horizontal travel spans
 * exactly 4 scroll lengths for a slow, deliberate journey.
 *
 * Features:
 * - Gold (#C7973A) background wash at 3% opacity — warm, human temperature
 * - Horizontal progress indicator with gold dot and stop counter
 * - Parallax: background overlay shifts at 0.3x rate for depth
 * - Active stop detection drives waveform/UI reveal animations
 *
 * @remarks Uses GSAP ScrollTrigger (scroll-driven domain per CLAUDE.md).
 * Framer Motion is used only in Stop4 for the CTA button entrance.
 * Dynamically imported with ssr: false from page.tsx.
 *
 * Zustand: no direct store interaction (Stop4 handles CTA scroll)
 */
export default function FounderStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeStop, setActiveStop] = useState(1);

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    const init = async () => {
      const gsapModule = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.default ?? gsapModule;
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current || !trackRef.current) return;

      ctx = gsap.context(() => {
        /** Main horizontal scroll animation */
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: () => `+=${window.innerHeight * 4}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self: { progress: number }) => {
              setProgress(self.progress);

              /** Determine active stop from scroll progress */
              if (self.progress < 0.25) setActiveStop(1);
              else if (self.progress < 0.5) setActiveStop(2);
              else if (self.progress < 0.75) setActiveStop(3);
              else setActiveStop(4);
            },
          },
        });

        /** Translate the track container horizontally */
        tl.to(trackRef.current, {
          xPercent: -75,
          ease: "none",
        });

        /** Parallax: gold overlay shifts at a slower rate for depth */
        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            xPercent: -20,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: () => `+=${window.innerHeight * 4}`,
              scrub: 1,
            },
          });
        }
      }, sectionRef);
    };

    init();

    /** Cleanup: kill ScrollTrigger instances to prevent memory leaks */
    return () => {
      ctx?.revert();
    };
  }, []);

  const stopLabel = `0${activeStop} / 04`;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: "#0A0A0F" }}
      aria-label="Founder story timeline"
    >
      {/* Gold background wash — parallax layer */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "rgba(199, 151, 58, 0.03)",
          width: "150%",
          left: "-10%",
        }}
        aria-hidden="true"
      />

      {/* Horizontal scroll track: 4 viewport widths */}
      <div
        ref={trackRef}
        className="flex h-screen"
        style={{ width: "400vw" }}
      >
        <Stop1 />
        <Stop2 active={activeStop === 2} />
        <Stop3 active={activeStop === 3} />
        <Stop4 active={activeStop === 4} />
      </div>

      {/* Progress indicator */}
      <div
        className="absolute bottom-8 left-8 right-8 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <div className="flex items-center gap-4">
          {/* Stop counter */}
          <span
            className="font-mono text-xs tracking-wider"
            style={{ color: "#C7973A" }}
          >
            {stopLabel}
          </span>

          {/* Progress bar */}
          <div className="flex-1 relative h-[2px]" style={{ backgroundColor: "rgba(199, 151, 58, 0.15)" }}>
            {/* Gold dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-none"
              style={{
                backgroundColor: "#C7973A",
                left: `${progress * 100}%`,
                boxShadow: "0 0 8px rgba(199, 151, 58, 0.5)",
              }}
            />
            {/* Filled portion */}
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: "rgba(199, 151, 58, 0.4)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
