"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * SpotlightCursor — replaces the default cursor during Gig Mode with a radial
 * stage-spotlight effect. A fixed-position div with a CSS radial gradient follows
 * mouseCoordinates from the Zustand store at 60fps via requestAnimationFrame.
 *
 * @remarks Browser-only — relies on DOM positioning. Only renders when
 * isGigModeActive is true (parent controls mount).
 *
 * Zustand reads: mouseCoordinates
 */
export default function SpotlightCursor() {
  const spotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;

    /** Animate spotlight position at 60fps by reading Zustand directly */
    const animate = () => {
      const { mouseCoordinates } = useAppStore.getState();
      el.style.transform = `translate(${mouseCoordinates.x - 150}px, ${mouseCoordinates.y - 150}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={spotRef}
      aria-hidden="true"
      className="fixed top-0 left-0 pointer-events-none"
      style={{
        width: 300,
        height: 300,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.08) 60%, transparent 100%)",
        zIndex: 9999,
        mixBlendMode: "screen",
      }}
    />
  );
}
