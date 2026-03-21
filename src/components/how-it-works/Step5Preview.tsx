"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

/**
 * Step5Preview — Practice Mode with true multi-track stem playback.
 *
 * Architecture per stem:
 *   Tone.Player(stemUrl) → Tone.Volume(dB) → Tone.getDestination()
 *
 * Stem toggle buttons mute/unmute by setting the corresponding
 * Tone.Volume node to -Infinity dB or 0 dB. No averaging, no
 * shared gain. All four players start simultaneously for sync.
 *
 * The AnalyserNode for the waveform visualizer is connected to
 * Tone.getDestination() so it reflects the mixed output.
 */

const STEM_URLS = {
  vocal: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Vocals%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  guitar: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Instrumental%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  bass: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Bass%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  drums: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Drums%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
} as const;

type StemKey = "vocal" | "guitar" | "bass" | "drums";

const STEM_TOGGLES: { key: StemKey; label: string; color: string }[] = [
  { key: "vocal", label: "Vocals", color: "#00D4FF" },
  { key: "guitar", label: "Guitar", color: "#C7973A" },
  { key: "bass", label: "Bass", color: "#7B2FBE" },
  { key: "drums", label: "Drums", color: "#00FF88" },
];

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface StemNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  player: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  volume: any;
}

export default function Step5Preview() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(100);
  const [looping, setLooping] = useState(true);
  const [cursorPos, setCursorPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mutedStems, setMutedStems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const rigsRef = useRef<Record<string, StemNode>>({});
  const analyserRef = useRef<AnalyserNode | null>(null);
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

      // Progress from elapsed time × playback rate
      const firstRig = Object.values(rigsRef.current)[0];
      if (firstRig?.player && duration > 0) {
        const rate = firstRig.player.playbackRate;
        const elapsed = ((performance.now() - playStartRef.current) / 1000) * rate;

        if (elapsed >= duration) {
          if (looping) {
            playStartRef.current = performance.now();
            setCursorPos(0);
          } else {
            Object.values(rigsRef.current).forEach((r) => r.player.stop());
            setIsPlaying(false);
            setCursorPos(0);
            return;
          }
        } else {
          setCursorPos(elapsed / duration);
        }
      }

      // Draw waveform from AnalyserNode (reflects mixed output)
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
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

  // ── Toggle playback — builds multi-track rig on first play ──────
  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      Object.values(rigsRef.current).forEach((r) => r.player.stop());
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      const Tone = await import("tone");
      await Tone.start();
      setAudioContextStarted(true);

      // Build per-stem rigs if not yet created
      if (Object.keys(rigsRef.current).length === 0) {
        for (const stem of STEM_TOGGLES) {
          const url = STEM_URLS[stem.key];
          if (!url) continue;

          const vol = new Tone.Volume(0).toDestination();
          const player = new Tone.Player({ url, loop: looping }).connect(vol);

          rigsRef.current[stem.key] = { player, volume: vol };
        }

        // AnalyserNode on the mixed output for waveform drawing
        const rawCtx = Tone.getContext().rawContext;
        if (rawCtx instanceof AudioContext) {
          const analyser = rawCtx.createAnalyser();
          analyser.fftSize = 2048;
          Tone.getDestination().connect(analyser);
          analyserRef.current = analyser;
        }

        await Tone.loaded();

        // Read duration from the first loaded stem
        const firstPlayer = Object.values(rigsRef.current)[0]?.player;
        if (firstPlayer?.buffer?.duration) {
          setDuration(firstPlayer.buffer.duration);
        }
      }

      // Apply current mute states before starting
      for (const stem of STEM_TOGGLES) {
        const rig = rigsRef.current[stem.key];
        if (rig) {
          rig.volume.volume.value = mutedStems.has(stem.key) ? -Infinity : 0;
        }
      }

      // Apply tempo to all players
      Object.values(rigsRef.current).forEach((r) => {
        r.player.playbackRate = tempo / 100;
        r.player.loop = looping;
      });

      // Synchronized start
      const startTime = Tone.now();
      Object.values(rigsRef.current).forEach((r) => r.player.start(startTime));
      playStartRef.current = performance.now();
      setIsPlaying(true);
    } catch (err) {
      console.error("Step5Preview: multi-track init failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, tempo, looping, setAudioContextStarted, mutedStems]);

  // ── Apply mute/unmute to Tone.Volume nodes in real time ─────────
  useEffect(() => {
    for (const stem of STEM_TOGGLES) {
      const rig = rigsRef.current[stem.key];
      if (rig) {
        rig.volume.volume.value = mutedStems.has(stem.key) ? -Infinity : 0;
      }
    }
  }, [mutedStems]);

  // ── Sync playback rate on tempo change ──────────────────────────
  useEffect(() => {
    Object.values(rigsRef.current).forEach((r) => {
      r.player.playbackRate = tempo / 100;
    });
  }, [tempo]);

  // ── Sync loop setting ───────────────────────────────────────────
  useEffect(() => {
    Object.values(rigsRef.current).forEach((r) => {
      r.player.loop = looping;
    });
  }, [looping]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      Object.values(rigsRef.current).forEach((r) => {
        r.player.stop();
        r.player.dispose();
        r.volume.dispose();
      });
      rigsRef.current = {};
      analyserRef.current = null;
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
      {/* Track label */}
      <div className="px-4 pt-3 pb-2 border-b border-es-border flex items-center justify-between">
        <span className="text-es-text-secondary text-xs font-inter">
          No Hay Quizás — Practice Mode
        </span>
        {isLoading && (
          <span className="text-es-cyan text-[10px] font-mono animate-pulse">Loading stems...</span>
        )}
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

      {/* Stem mute toggles — wired to Tone.Volume nodes */}
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

      {/* Live waveform visualizer */}
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
          disabled={isLoading}
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
