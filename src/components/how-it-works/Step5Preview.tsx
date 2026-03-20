"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { AUDIO } from "@/config/audio";

/**
 * Step5Preview — Practice Mode demo. Shows a playback UI with progress bar,
 * loop markers, tempo control, and stem mute toggles. Loads real audio from
 * R2 via Tone.js for interactive playback.
 */

const TRACKS = [
  { id: "no-hay-quizas", label: "No Hay Quizas", url: AUDIO.NO_HAY_QUIZAS },
  { id: "hammocks", label: "Hammocks and Hardhats", url: AUDIO.HAMMOCKS },
];

const STEM_TOGGLES = [
  { key: "vocal", label: "Vocals", color: "#00D4FF" },
  { key: "guitar", label: "Guitar", color: "#C7973A" },
  { key: "bass", label: "Bass", color: "#7B2FBE" },
  { key: "drums", label: "Drums", color: "#00FF88" },
] as const;

export default function Step5Preview() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(100);
  const [looping, setLooping] = useState(true);
  const [cursorPos, setCursorPos] = useState(0);
  const [activeTrack, setActiveTrack] = useState(0);
  const [mutedStems, setMutedStems] = useState<Set<string>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toneRef = useRef<{ player: any; module: any } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);

  /** Cursor animation — synced to playback duration */
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const speed = tempo / 100;
    const duration = 10000 / speed;
    const startTime = performance.now();

    const animate = (now: number) => {
      if (!mountedRef.current) return;
      let progress = ((now - startTime) % duration) / duration;
      if (!looping && now - startTime > duration) {
        setIsPlaying(false);
        progress = 0;
      }
      setCursorPos(progress);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, tempo, looping]);

  /** Switch active track — stops current playback */
  const switchTrack = useCallback(
    (idx: number) => {
      if (idx === activeTrack) return;
      toneRef.current?.player?.stop();
      toneRef.current?.player?.dispose();
      toneRef.current = null;
      setIsPlaying(false);
      setCursorPos(0);
      setActiveTrack(idx);
    },
    [activeTrack]
  );

  /** Toggle playback — initializes Tone.js on first play */
  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      toneRef.current?.player?.stop();
      setIsPlaying(false);
      return;
    }
    if (!toneRef.current) {
      const Tone = await import("tone");
      await Tone.start();
      setAudioContextStarted(true);
      const player = new Tone.Player({
        url: TRACKS[activeTrack]?.url ?? TRACKS[0]!.url,
        loop: true,
      }).toDestination();
      toneRef.current = { player, module: Tone };
      await new Promise<void>((resolve) => {
        if (player.loaded) resolve();
        else player.buffer.onload = () => resolve();
      });
    }
    toneRef.current.player.playbackRate = tempo / 100;
    toneRef.current.player.loop = looping;
    toneRef.current.player.start();
    setIsPlaying(true);
  }, [isPlaying, tempo, looping, setAudioContextStarted, activeTrack]);

  /** Update playback rate when tempo changes */
  useEffect(() => {
    if (toneRef.current?.player) {
      toneRef.current.player.playbackRate = tempo / 100;
    }
  }, [tempo]);

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      toneRef.current?.player?.stop();
      toneRef.current?.player?.dispose();
      toneRef.current = null;
    };
  }, []);

  const toggleStemMute = (key: string) => {
    setMutedStems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full"
    >
      {/* Track switcher */}
      <div className="px-4 pt-3 pb-2 border-b border-es-border flex items-center gap-2">
        {TRACKS.map((track, idx) => (
          <button
            key={track.id}
            onClick={() => switchTrack(idx)}
            className={`px-3 py-1.5 rounded-md text-xs font-inter transition-colors ${
              idx === activeTrack
                ? "bg-es-cyan/10 border border-es-cyan/40 text-es-cyan"
                : "border border-es-border text-es-text-tertiary hover:text-es-text-secondary"
            }`}
          >
            {track.label}
          </button>
        ))}
      </div>

      {/* Playback progress bar with loop markers */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative h-8 rounded-lg bg-es-bg-tertiary/50 overflow-hidden">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-es-cyan/15 transition-none"
            style={{ width: `${cursorPos * 100}%` }}
          />
          {/* Playback cursor */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-es-cyan transition-none"
            style={{
              left: `${cursorPos * 100}%`,
              boxShadow: isPlaying ? "0 0 6px rgba(0, 212, 255, 0.6)" : "none",
            }}
          />
          {/* Loop markers */}
          {looping && (
            <>
              <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-es-gold/40" />
              <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-es-gold/40" />
            </>
          )}
          {/* Time indicators */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <span className="text-es-text-tertiary text-[9px] font-mono">
              {Math.floor(cursorPos * 10)}:{String(Math.floor((cursorPos * 100) % 10)).padStart(1, "0")}s
            </span>
            <span className="text-es-text-tertiary text-[9px] font-mono">10.0s</span>
          </div>
        </div>
      </div>

      {/* Stem mute toggles */}
      <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
        {STEM_TOGGLES.map((stem) => {
          const isMuted = mutedStems.has(stem.key);
          return (
            <button
              key={stem.key}
              onClick={() => toggleStemMute(stem.key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono border transition-all ${
                isMuted
                  ? "border-es-border text-es-text-tertiary/50 line-through"
                  : "border-current"
              }`}
              style={{ color: isMuted ? undefined : stem.color, borderColor: isMuted ? undefined : `${stem.color}40` }}
            >
              {stem.label}
            </button>
          );
        })}
        <span className="text-es-text-tertiary text-[9px] font-mono ml-auto">
          {4 - mutedStems.size}/4 active
        </span>
      </div>

      {/* Spacer to push controls to bottom */}
      <div className="flex-1" />

      {/* Controls bar */}
      <div className="px-4 py-3 border-t border-es-border flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={togglePlayback}
          className="w-10 h-10 rounded-full bg-es-cyan/10 border border-es-cyan/30 flex items-center justify-center text-es-cyan hover:bg-es-cyan/20 transition-colors"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="3" height="10" rx="1" />
              <rect x="9" y="2" width="3" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5L12 7L3 12.5V1.5Z" />
            </svg>
          )}
        </button>

        {/* Tempo slider */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-es-text-tertiary text-[10px] font-mono">Tempo</span>
            <span className="text-es-text-secondary text-[10px] font-mono">{tempo}%</span>
          </div>
          <input
            type="range"
            min={60}
            max={120}
            value={tempo}
            onChange={(e) => setTempo(parseInt(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer bg-es-bg-tertiary"
          />
        </div>

        {/* Loop toggle */}
        <button
          onClick={() => setLooping(!looping)}
          className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
            looping
              ? "border-es-cyan/40 text-es-cyan bg-es-cyan/10"
              : "border-es-border text-es-text-tertiary"
          }`}
        >
          Loop
        </button>
      </div>
    </motion.div>
  );
}
