"use client";

import { type ReactElement, useState, useRef } from "react";

interface StemUrls {
  vocals: string;
  drums: string;
  bass: string;
  other: string;
}

interface StemPlayerProps {
  stems: StemUrls;
  trackId: string;
  processingTime: number;
}

interface StemConfig {
  key: keyof StemUrls;
  label: string;
  color: string;
  icon: string;
}

const STEM_CONFIG: StemConfig[] = [
  { key: "vocals", label: "Vocals", color: "es-cyan", icon: "🎤" },
  { key: "drums", label: "Drums", color: "es-purple", icon: "🥁" },
  { key: "bass", label: "Bass", color: "es-green", icon: "🎸" },
  { key: "other", label: "Other", color: "es-gold", icon: "🎹" },
];

/**
 * Audio player for separated stems with individual controls.
 */
export function StemPlayer({ stems, trackId, processingTime }: StemPlayerProps): ReactElement {
  const [playing, setPlaying] = useState<keyof StemUrls | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const handlePlay = (stem: keyof StemUrls): void => {
    // Pause any currently playing audio
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (audio && key !== stem) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    const audio = audioRefs.current[stem];
    if (audio) {
      if (playing === stem) {
        audio.pause();
        setPlaying(null);
      } else {
        audio.play();
        setPlaying(stem);
      }
    }
  };

  const handleEnded = (): void => {
    setPlaying(null);
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Success Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-es-green/10 px-4 py-2 mb-3">
          <span className="text-es-green">✓</span>
          <span className="font-inter text-sm text-es-green">Separation Complete</span>
        </div>
        <p className="font-inter text-sm text-es-text-secondary">
          Processed in {processingTime.toFixed(1)} seconds
        </p>
      </div>

      {/* Stem Grid */}
      <div className="grid grid-cols-2 gap-4">
        {STEM_CONFIG.map(({ key, label, color, icon }) => (
          <div
            key={key}
            className={`rounded-xl border border-es-border bg-es-bg-secondary p-4 transition-all hover:border-${color}/50`}
          >
            {/* Hidden Audio Element */}
            <audio
              ref={(el) => {
                audioRefs.current[key] = el;
              }}
              src={stems[key]}
              onEnded={handleEnded}
              preload="none"
            />

            {/* Stem Info */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{icon}</span>
              <span className="font-clash font-semibold text-es-text-primary">{label}</span>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => handlePlay(key)}
                className={`flex-1 rounded-lg py-2 font-inter text-sm font-medium transition-all ${
                  playing === key
                    ? "bg-es-cyan text-es-bg-primary"
                    : "bg-es-bg-tertiary text-es-text-primary hover:bg-es-bg-tertiary/80"
                }`}
              >
                {playing === key ? "⏸ Pause" : "▶ Play"}
              </button>
              <a
                href={stems[key]}
                download={`${trackId}-${key}.mp3`}
                className="rounded-lg bg-es-bg-tertiary px-4 py-2 font-inter text-sm text-es-text-primary hover:bg-es-bg-tertiary/80 transition-all"
              >
                ↓
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Download All */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-3">
          {STEM_CONFIG.map(({ key, label }) => (
            <a
              key={key}
              href={stems[key]}
              download={`${trackId}-${key}.mp3`}
              className="rounded-lg border border-es-border px-4 py-2 font-inter text-sm text-es-text-secondary hover:border-es-cyan hover:text-es-cyan transition-all"
            >
              Download {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
