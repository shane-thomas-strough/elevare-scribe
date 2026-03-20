"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

const STEMS = [
  { key: "vocal" as const, label: "Vocals", color: "#00D4FF" },
  { key: "guitar" as const, label: "Guitar", color: "#C7973A" },
  { key: "bass" as const, label: "Bass", color: "#7B2FBE" },
  { key: "drums" as const, label: "Drums", color: "#00FF88" },
];

const AUDIO_SRC = "/audio/double-overhead-demo.mp3";

type ExportPhase = "idle" | "exporting" | "done";

export default function Step6Preview() {
  const currentStemVolumes = useAppStore((s) => s.currentStemVolumes);
  const setStemVolume = useAppStore((s) => s.setStemVolume);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);
  const [exportPhase, setExportPhase] = useState<ExportPhase>("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  const togglePreview = useCallback(async () => {
    if (isPlaying) {
      playerRef.current?.stop();
      setIsPlaying(false);
      return;
    }
    if (!playerRef.current) {
      const Tone = await import("tone");
      await Tone.start();
      setAudioContextStarted(true);
      const player = new Tone.Player({
        url: AUDIO_SRC,
        loop: true,
      }).toDestination();
      playerRef.current = player;
      await new Promise<void>((resolve) => {
        if (player.loaded) resolve();
        else player.buffer.onload = () => resolve();
      });
    }
    playerRef.current.start();
    setIsPlaying(true);
  }, [isPlaying, setAudioContextStarted]);

  // Adjust volume when faders move (simulated — real stem separation would have 4 players)
  useEffect(() => {
    if (playerRef.current) {
      const avg = (currentStemVolumes.vocal + currentStemVolumes.guitar +
                   currentStemVolumes.bass + currentStemVolumes.drums) / 4;
      playerRef.current.volume.value = avg > 0 ? (avg - 1) * 20 : -Infinity;
    }
  }, [currentStemVolumes]);

  // Cleanup
  useEffect(() => {
    return () => {
      playerRef.current?.stop();
      playerRef.current?.dispose();
      playerRef.current = null;
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
          Double Overhead
        </span>
        <button
          onClick={togglePreview}
          className={`px-3 py-1 rounded-md text-xs font-mono border transition-colors ${
            isPlaying
              ? "border-es-cyan/40 text-es-cyan bg-es-cyan/10"
              : "border-es-border text-es-text-tertiary hover:text-es-text-secondary"
          }`}
        >
          {isPlaying ? "Stop" : "Preview"}
        </button>
      </div>

      {/* Faders */}
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
