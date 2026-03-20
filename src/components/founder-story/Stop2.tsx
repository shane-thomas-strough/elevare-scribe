"use client";

import { useState, useEffect } from "react";
import TimelineStop from "./TimelineStop";
import Waveform from "./Waveform";

/**
 * Stop 2 — The moment of creation. A song is born on Suno.
 * An animated cyan waveform pulses as if the song is playing silently.
 * The waveform fades in when the stop becomes active.
 *
 * @param active - Whether this stop is currently in the center viewport
 */
interface Stop2Props {
  active: boolean;
}

export default function Stop2({ active }: Stop2Props) {
  const [waveformVisible, setWaveformVisible] = useState(false);

  /** Fade waveform in when stop becomes active */
  useEffect(() => {
    if (active && !waveformVisible) {
      const t = setTimeout(() => setWaveformVisible(true), 300);
      return () => clearTimeout(t);
    }
  }, [active, waveformVisible]);

  return (
    <TimelineStop
      headline="A song called No Hay Quizas was generated on Suno."
      subtext="Ten minutes. A chicken bus. The Pacific outside the window."
    >
      <div
        className="transition-opacity duration-1000 mt-4"
        style={{ opacity: waveformVisible ? 1 : 0 }}
      >
        <Waveform amplitude={waveformVisible ? 1 : 0} />
      </div>
    </TimelineStop>
  );
}
