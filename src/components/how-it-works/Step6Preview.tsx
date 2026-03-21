"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

/**
 * Step6Preview — true multi-track stem mixer using Tone.Volume nodes.
 *
 * Architecture per stem:
 *   Tone.Player(url) → Tone.Volume(dB) → Tone.getDestination()
 *
 * Each slider maps directly to its Tone.Volume node. No averaging,
 * no shared gain, no cross-contamination between stems.
 */

const STEM_URLS = {
  vocal: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Vocals%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  guitar: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Instrumental%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  bass: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Bass%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  drums: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Drums%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
} as const;

type StemKey = "vocal" | "guitar" | "bass" | "drums";

const STEMS: { key: StemKey; label: string; color: string }[] = [
  { key: "vocal", label: "Vocals", color: "#00D4FF" },
  { key: "guitar", label: "Guitar", color: "#C7973A" },
  { key: "bass", label: "Bass", color: "#7B2FBE" },
  { key: "drums", label: "Drums", color: "#00FF88" },
];

const STEMS_AVAILABLE = Object.values(STEM_URLS).some((url) => url.length > 0);

type ExportPhase = "idle" | "exporting" | "done";

/** Convert 0-1 linear to dB. 0 → -Infinity, 1 → 0 dB */
function linearToDb(v: number): number {
  if (v <= 0) return -Infinity;
  return 20 * Math.log10(v);
}

/**
 * Per-stem audio rig: a Tone.Player connected to a Tone.Volume node.
 * The Volume node connects to Tone.getDestination().
 */
interface StemNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  player: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  volume: any;
}

export default function Step6Preview() {
  const currentStemVolumes = useAppStore((s) => s.currentStemVolumes);
  const setStemVolume = useAppStore((s) => s.setStemVolume);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);
  const [exportPhase, setExportPhase] = useState<ExportPhase>("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const rigsRef = useRef<Record<string, StemNode>>({});

  /** Initialize or toggle playback of all four stems */
  const togglePreview = useCallback(async () => {
    if (isPlaying) {
      Object.values(rigsRef.current).forEach((rig) => rig.player.stop());
      setIsPlaying(false);
      return;
    }

    if (!STEMS_AVAILABLE) return;

    try {
      setIsLoading(true);
      const Tone = await import("tone");
      await Tone.start();
      setAudioContextStarted(true);

      // Build rigs if not yet created
      if (Object.keys(rigsRef.current).length === 0) {
        for (const stem of STEMS) {
          const url = STEM_URLS[stem.key];
          if (!url) continue;

          // Tone.Volume → Destination (explicit, simple, reliable)
          const vol = new Tone.Volume(0).toDestination();

          // Player → Volume node (NOT directly to destination)
          const player = new Tone.Player({ url, loop: true }).connect(vol);

          rigsRef.current[stem.key] = { player, volume: vol };
        }

        // Wait for ALL buffers to finish loading
        await Tone.loaded();
      }

      // Apply current slider positions before starting
      for (const stem of STEMS) {
        const rig = rigsRef.current[stem.key];
        if (rig) {
          rig.volume.volume.value = linearToDb(currentStemVolumes[stem.key]);
        }
      }

      // Synchronized start: capture a single timestamp, start all players at it
      const startTime = Tone.now();
      Object.values(rigsRef.current).forEach((rig) => rig.player.start(startTime));
      setIsPlaying(true);
    } catch (err) {
      console.error("Step6Preview: multi-track init failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, setAudioContextStarted, currentStemVolumes]);

  /**
   * Sync each slider to its own Tone.Volume node in real time.
   * Reads rigsRef imperatively — no stale closure issues.
   */
  useEffect(() => {
    for (const stem of STEMS) {
      const rig = rigsRef.current[stem.key];
      if (rig) {
        rig.volume.volume.value = linearToDb(currentStemVolumes[stem.key]);
      }
    }
  }, [currentStemVolumes]);

  /** Dispose all audio nodes on unmount */
  useEffect(() => {
    return () => {
      Object.values(rigsRef.current).forEach((rig) => {
        rig.player.stop();
        rig.player.dispose();
        rig.volume.dispose();
      });
      rigsRef.current = {};
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
      if (p < 1) requestAnimationFrame(animate);
      else setExportPhase("done");
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
          No Hay Quizás — Stem Mixer
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

      {!STEMS_AVAILABLE && (
        <p className="text-es-text-tertiary text-[10px] font-mono text-center -mt-2">
          Stems pending — run Demucs to separate tracks
        </p>
      )}

      {/* Per-stem faders */}
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
