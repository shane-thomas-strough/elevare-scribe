"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

const TRACKS = [
  { id: "no-hay-quizas", label: "No Hay Quizas", url: "/audio/no-hay-quizas-demo.mp3" },
  { id: "hammocks", label: "Hammocks and Hardhats", url: "/audio/hammocks-and-hardhats-demo.mp3" },
];

export default function Step5Preview() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(100);
  const [looping, setLooping] = useState(true);
  const [cursorPos, setCursorPos] = useState(0);
  const [activeTrack, setActiveTrack] = useState(0);
  const osmdContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const osmdRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toneRef = useRef<{ player: any; module: any } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);

  // Load OSMD
  useEffect(() => {
    if (!osmdContainerRef.current) return;
    let cancelled = false;

    fetch("/musicxml/no-hay-quizas-demo.xml")
      .then((r) => r.text())
      .then((xml) => {
        if (cancelled || !osmdContainerRef.current) return;
        import("opensheetmusicdisplay").then(({ OpenSheetMusicDisplay }) => {
          if (cancelled || !osmdContainerRef.current) return;
          const osmd = new OpenSheetMusicDisplay(osmdContainerRef.current!, {
            backend: "svg",
            drawTitle: false,
            drawComposer: false,
            drawCredits: false,
            autoResize: true,
          });
          osmdRef.current = osmd;
          osmd.load(xml).then(() => {
            if (!cancelled) osmd.render();
          });
        });
      });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, []);

  // Cursor animation
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
      if (!looping && (now - startTime) > duration) {
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

  // Switch track
  const switchTrack = useCallback(async (idx: number) => {
    if (idx === activeTrack) return;

    // Stop current playback
    if (toneRef.current?.player) {
      toneRef.current.player.stop();
      toneRef.current.player.dispose();
      toneRef.current = null;
    }
    setIsPlaying(false);
    setCursorPos(0);
    setActiveTrack(idx);
  }, [activeTrack]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      toneRef.current?.player?.stop();
      setIsPlaying(false);
      return;
    }

    // Initialize Tone.js player with the current track
    if (!toneRef.current) {
      const Tone = await import("tone");
      await Tone.start();
      setAudioContextStarted(true);
      const player = new Tone.Player({
        url: TRACKS[activeTrack].url,
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

  // Update playback rate on tempo change
  useEffect(() => {
    if (toneRef.current?.player) {
      toneRef.current.player.playbackRate = tempo / 100;
    }
  }, [tempo]);

  // Cleanup
  useEffect(() => {
    return () => {
      toneRef.current?.player?.stop();
      toneRef.current?.player?.dispose();
      toneRef.current = null;
    };
  }, []);

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

      {/* Sheet music with cursor */}
      <div className="relative flex-1 overflow-hidden px-4 py-4">
        <div
          ref={osmdContainerRef}
          className="w-full min-h-[140px] [&_svg]:w-full"
          style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.85)" }}
        />
        {/* Playback cursor */}
        <motion.div
          className="absolute top-4 bottom-4 w-[2px] bg-es-cyan z-10"
          style={{
            left: `${4 + cursorPos * 92}%`,
            boxShadow: "0 0 8px rgba(0, 212, 255, 0.6)",
          }}
          animate={{ opacity: isPlaying ? 1 : 0.4 }}
        />
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-es-border flex items-center gap-4">
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
