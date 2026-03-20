"use client";

import { useState, useEffect, useRef } from "react";
import TimelineStop from "./TimelineStop";
import Waveform from "./Waveform";

/**
 * Stop 3 — The silence. The song reached people but there were no tabs.
 * The waveform from Stop 2 carries over but flattens to a silent flat line
 * over 2 seconds as this stop enters focus. The flat line lingers — this
 * is the gap the product fills.
 *
 * @param active - Whether this stop is currently in the center viewport
 */
interface Stop3Props {
  active: boolean;
}

export default function Stop3({ active }: Stop3Props) {
  const [amplitude, setAmplitude] = useState(1);
  const animRef = useRef<number | null>(null);

  /** Animate waveform amplitude to zero over 2 seconds when active */
  useEffect(() => {
    if (!active) return;

    const start = performance.now();
    const duration = 2000;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setAmplitude(1 - progress);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    /** Small delay before the flatten begins */
    const timeout = setTimeout(() => {
      animRef.current = requestAnimationFrame(animate);
    }, 400);

    return () => {
      clearTimeout(timeout);
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  return (
    <TimelineStop
      headline="The song reached the beach."
      subtext="The bar. The people. But there were no tabs to play it live."
    >
      <div className="mt-4">
        <Waveform amplitude={amplitude} />
      </div>
    </TimelineStop>
  );
}
