"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

/**
 * Step6Preview — true multi-track stem mixer. Four independent Tone.Player
 * instances route through four independent Tone.Channel nodes to destination.
 * Each UI slider controls ONLY its corresponding channel volume — no averaging,
 * no master gain tricks. Players start simultaneously for perfect sync.
 *
 * Architecture: Player(vocal) → Channel(vocal) → Destination
 *               Player(guitar) → Channel(guitar) → Destination
 *               Player(bass) → Channel(bass) → Destination
 *               Player(drums) → Channel(drums) → Destination
 */

/**
 * Per-stem audio file URLs. When Demucs stem separation is run on the
 * master track, the resulting files are uploaded to R2 and their URLs
 * are placed here. Each stem is a separate isolated audio file.
 */
const STEM_URLS = {
  vocal: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Vocals%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  guitar: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Instrumental%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  bass: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Bass%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  drums: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Drums%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
} as const;

const STEMS = [
  { key: "vocal" as const, label: "Vocals", color: "#00D4FF" },
  { key: "guitar" as const, label: "Guitar", color: "#C7973A" },
  { key: "bass" as const, label: "Bass", color: "#7B2FBE" },
  { key: "drums" as const, label: "Drums", color: "#00FF88" },
];

/** True if at least one stem URL is configured */
const STEMS_AVAILABLE = Object.values(STEM_URLS).some((url) => url.length > 0);

type ExportPhase = "idle" | "exporting" | "done";

/** Convert a 0-1 linear volume to decibels. 0 = -Infinity dB, 1 = 0 dB */
function linearToDb(v: number): number {
  if (v <= 0) return -Infinity;
  return 20 * Math.log10(v);
}

interface StemRig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  players: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channels: Record<string, any>;
}

export default function Step6Preview() {
  const currentStemVolumes = useAppStore((s) => s.currentStemVolumes);
  const setStemVolume = useAppStore((s) => s.setStemVolume);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);
  const [exportPhase, setExportPhase] = useState<ExportPhase>("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const rigRef = useRef<StemRig | null>(null);

  /**
   * Toggle playback. On first play: initializes Tone.js, creates four
   * Player → Channel → Destination chains, waits for all buffers to load,
   * then starts all players simultaneously for perfect sync.
   */
  const togglePreview = useCallback(async () => {
    if (isPlaying) {
      if (rigRef.current) {
        Object.values(rigRef.current.players).forEach((p) => p.stop());
      }
      setIsPlaying(false);
      return;
    }

    if (!STEMS_AVAILABLE) {
      // Graceful fallback: no stems uploaded yet — show notice, don't crash
      return;
    }

    try {
      setIsLoading(true);
      const Tone = await import("tone");
      await Tone.start();
      setAudioContextStarted(true);

      if (!rigRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const players: Record<string, any> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channels: Record<string, any> = {};

        for (const stem of STEMS) {
          const url = STEM_URLS[stem.key];
          if (!url) continue;

          const channel = new Tone.Channel({
            volume: linearToDb(currentStemVolumes[stem.key]),
          }).toDestination();

          const player = new Tone.Player({
            url,
            loop: true,
          }).connect(channel);

          players[stem.key] = player;
          channels[stem.key] = channel;
        }

        rigRef.current = { players, channels };
        await Tone.loaded();
      }

      // Sync start: all players trigger at the same Tone.now() timestamp
      const now = rigRef.current.players["vocal"]
        ? await import("tone").then((T) => T.now())
        : 0;
      Object.values(rigRef.current.players).forEach((p) => p.start(now));
      setIsPlaying(true);
    } catch (err) {
      console.error("Step6Preview: failed to initialize multi-track playback", err);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, setAudioContextStarted, currentStemVolumes]);

  /**
   * Apply individual stem volumes directly to their Tone.Channel nodes.
   * No averaging. Each slider controls ONLY its corresponding channel.
   */
  useEffect(() => {
    if (!rigRef.current) return;
    const { channels } = rigRef.current;

    for (const stem of STEMS) {
      const channel = channels[stem.key];
      if (channel) {
        channel.volume.value = linearToDb(currentStemVolumes[stem.key]);
      }
    }
  }, [currentStemVolumes]);

  /** Cleanup: stop and dispose all players and channels on unmount */
  useEffect(() => {
    return () => {
      if (rigRef.current) {
        Object.values(rigRef.current.players).forEach((p) => {
          p.stop();
          p.dispose();
        });
        Object.values(rigRef.current.channels).forEach((c) => c.dispose());
        rigRef.current = null;
      }
    };
  }, []);

  const handleExport = useCallback(() => {
    setExportPhase("exporting");
    setExportProgress(0);
    const start = performance.now();
    const duration = 2500;
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setExportProgress(p);
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        setExportPhase("done");
      }
    };
    requestAnimationFrame(animate);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col justify-center h-full px-6 gap-5"
    >
      {/* Track label + preview */}
      <div className="flex items-center justify-between">
        <span className="text-es-text-secondary text-xs font-inter">
          Double Overhead — Stem Mixer
        </span>
        <button
          onClick={togglePreview}
          disabled={!STEMS_AVAILABLE || isLoading}
          className={`px-3 py-1 rounded-md text-xs font-mono border transition-colors ${
            isPlaying
              ? "border-es-cyan/40 text-es-cyan bg-es-cyan/10"
              : !STEMS_AVAILABLE
                ? "border-es-border text-es-text-tertiary/40 cursor-not-allowed"
                : "border-es-border text-es-text-tertiary hover:text-es-text-secondary"
          }`}
        >
          {isLoading ? "Loading..." : isPlaying ? "Stop" : "Preview"}
        </button>
      </div>

      {/* Stems not available notice */}
      {!STEMS_AVAILABLE && (
        <p className="text-es-text-tertiary text-[10px] font-mono text-center -mt-2">
          Stems pending — run Demucs to separate tracks
        </p>
      )}

      {/* Per-stem faders — each controls ONLY its channel */}
      {STEMS.map((stem) => (
        <div key={stem.key} className="flex items-center gap-3">
          <span
            className="w-16 text-xs font-inter font-medium text-right"
            style={{ color: stem.color }}
          >
            {stem.label}
          </span>
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={100}
              value={currentStemVolumes[stem.key] * 100}
              onChange={(e) =>
                setStemVolume(stem.key, parseInt(e.target.value) / 100)
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${stem.color} ${currentStemVolumes[stem.key] * 100}%, #1A1A28 ${currentStemVolumes[stem.key] * 100}%)`,
              }}
            />
          </div>
          <span className="w-10 text-right text-es-text-tertiary text-xs font-mono">
            {Math.round(currentStemVolumes[stem.key] * 100)}%
          </span>
        </div>
      ))}

      {/* Export */}
      <div className="mt-2">
        {exportPhase === "idle" && (
          <button
            onClick={handleExport}
            className="w-full py-3 rounded-xl bg-es-bg-secondary border border-es-cyan/30 text-es-cyan font-inter font-medium text-sm hover:bg-es-cyan/10 transition-colors"
          >
            Export Backing Track
          </button>
        )}

        {exportPhase === "exporting" && (
          <div className="w-full h-12 rounded-xl bg-es-bg-secondary border border-es-cyan/30 overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 bg-es-cyan/20 rounded-xl transition-all"
              style={{ width: `${exportProgress * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-es-cyan text-xs font-mono">
                Mixing stems... {Math.round(exportProgress * 100)}%
              </span>
            </div>
          </div>
        )}

        {exportPhase === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full py-3 rounded-xl bg-es-green/10 border border-es-green/30 flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#00FF88" strokeWidth="1.5" />
              <path d="M4.5 8L7 10.5L11.5 5.5" stroke="#00FF88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-es-green text-sm font-inter font-medium">
              backing-track.wav ready
            </span>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        .how-it-works input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #F0F0F8;
          cursor: pointer;
          border: 2px solid #1A1A28;
        }
        .how-it-works input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #F0F0F8;
          cursor: pointer;
          border: 2px solid #1A1A28;
        }
      `}</style>
    </motion.div>
  );
}
