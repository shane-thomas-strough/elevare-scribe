"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { AUDIO } from "@/config/audio";

/**
 * Step5Preview — Practice Mode demo. Plays real audio from R2 via Tone.js.
 * Progress bar syncs to actual buffer duration. Live waveform visualizer
 * draws AnalyserNode frequency data on a Canvas element. Loop restarts
 * from 0 on track end; non-loop stops and resets.
 */

const TRACKS = [
  { id: "no-hay-quizas", label: "No Hay Quizás", url: AUDIO.NO_HAY_QUIZAS },
  { id: "hammocks", label: "Hammocks and Hardhats", url: AUDIO.HAMMOCKS },
];

const STEM_TOGGLES = [
  { key: "vocal", label: "Vocals", color: "#00D4FF" },
  { key: "guitar", label: "Guitar", color: "#C7973A" },
  { key: "bass", label: "Bass", color: "#7B2FBE" },
  { key: "drums", label: "Drums", color: "#00FF88" },
] as const;

/** Format seconds as m:ss */
function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Step5Preview() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(100);
  const [looping, setLooping] = useState(true);
  const [cursorPos, setCursorPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTrack, setActiveTrack] = useState(0);
  const [mutedStems, setMutedStems] = useState<Set<string>>(new Set());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toneRef = useRef<{ player: any; module: any; analyser: AnalyserNode | null } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playStartRef = useRef(0);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);

  // ── Animation loop: progress bar + waveform visualizer ──────────
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = () => {
      if (!mountedRef.current) return;

      // Progress from actual elapsed time
      if (toneRef.current?.player && duration > 0) {
        const rate = toneRef.current.player.playbackRate;
        const elapsed = (performance.now() - playStartRef.current) / 1000 * rate;
        const totalDur = duration;

        if (elapsed >= totalDur) {
          if (looping) {
            // Reset start reference for next loop iteration
            playStartRef.current = performance.now();
            setCursorPos(0);
          } else {
            toneRef.current.player.stop();
            setIsPlaying(false);
            setCursorPos(0);
            return;
          }
        } else {
          setCursorPos(elapsed / totalDur);
        }
      }

      // Draw waveform from AnalyserNode
      const canvas = canvasRef.current;
      const analyser = toneRef.current?.analyser;
      if (canvas && analyser) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
          }
          ctx.clearRect(0, 0, w, h);

          const bufLen = analyser.frequencyBinCount;
          const data = new Uint8Array(bufLen);
          analyser.getByteTimeDomainData(data);

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#00D4FF";
          ctx.shadowColor = "#00D4FF";
          ctx.shadowBlur = 4;
          ctx.beginPath();

          const sliceW = w / bufLen;
          for (let i = 0; i < bufLen; i++) {
            const v = (data[i] ?? 128) / 128.0;
            const y = (v * h) / 2;
            if (i === 0) ctx.moveTo(0, y);
            else ctx.lineTo(i * sliceW, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, duration, looping]);

  // ── Switch track ────────────────────────────────────────────────
  const switchTrack = useCallback(
    (idx: number) => {
      if (idx === activeTrack) return;
      toneRef.current?.player?.stop();
      toneRef.current?.player?.dispose();
      toneRef.current = null;
      setIsPlaying(false);
      setCursorPos(0);
      setDuration(0);
      setActiveTrack(idx);
    },
    [activeTrack]
  );

  // ── Toggle playback ────────────────────────────────────────────
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
        loop: looping,
      }).toDestination();

      // Create AnalyserNode from the raw AudioContext for waveform drawing
      const rawCtx = Tone.getContext().rawContext;
      let analyser: AnalyserNode | null = null;
      if (rawCtx instanceof AudioContext) {
        analyser = rawCtx.createAnalyser();
        analyser.fftSize = 2048;
        Tone.getDestination().connect(analyser);
      }

      toneRef.current = { player, module: Tone, analyser };

      await new Promise<void>((resolve) => {
        if (player.loaded) resolve();
        else player.buffer.onload = () => resolve();
      });

      // Read real buffer duration
      setDuration(player.buffer.duration);
    }

    toneRef.current.player.playbackRate = tempo / 100;
    toneRef.current.player.loop = looping;
    playStartRef.current = performance.now();
    toneRef.current.player.start();
    setIsPlaying(true);
  }, [isPlaying, tempo, looping, setAudioContextStarted, activeTrack]);

  // ── Sync playback rate on tempo change ─────────────────────────
  useEffect(() => {
    if (toneRef.current?.player) {
      toneRef.current.player.playbackRate = tempo / 100;
    }
  }, [tempo]);

  // ── Sync loop setting ──────────────────────────────────────────
  useEffect(() => {
    if (toneRef.current?.player) {
      toneRef.current.player.loop = looping;
    }
  }, [looping]);

  // ── Cleanup on unmount ─────────────────────────────────────────
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

  const currentTime = duration > 0 ? cursorPos * duration : 0;

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

      {/* Progress bar synced to real buffer duration */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative h-8 rounded-lg bg-es-bg-tertiary/50 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-es-cyan/15 transition-none"
            style={{ width: `${cursorPos * 100}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-es-cyan transition-none"
            style={{
              left: `${cursorPos * 100}%`,
              boxShadow: isPlaying ? "0 0 6px rgba(0, 212, 255, 0.6)" : "none",
            }}
          />
          {looping && (
            <>
              <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-es-gold/40" />
              <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-es-gold/40" />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <span className="text-es-text-tertiary text-[9px] font-mono">
              {fmtTime(currentTime)}
            </span>
            <span className="text-es-text-tertiary text-[9px] font-mono">
              {duration > 0 ? fmtTime(duration) : "--:--"}
            </span>
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
              style={{
                color: isMuted ? undefined : stem.color,
                borderColor: isMuted ? undefined : `${stem.color}40`,
              }}
            >
              {stem.label}
            </button>
          );
        })}
        <span className="text-es-text-tertiary text-[9px] font-mono ml-auto">
          {4 - mutedStems.size}/4 active
        </span>
      </div>

      {/* Live waveform visualizer — Canvas AnalyserNode */}
      <div className="flex-1 px-4 py-2 min-h-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          style={{ background: "rgba(26, 26, 40, 0.3)" }}
          aria-label="Live audio waveform visualizer"
          role="img"
        />
      </div>

      {/* Controls bar */}
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
