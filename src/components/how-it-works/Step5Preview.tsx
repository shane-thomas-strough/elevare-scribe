"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

/**
 * Step5Preview — Practice Mode with true multi-track stem playback
 * and OSMD sheet music rendering with a cursor synced to audio.
 *
 * Audio: Player(stemUrl) → Volume(dB) → Destination (×4 stems)
 * Visual: OSMD renders MusicXML, cursor advances proportionally to
 *         playback progress via cursor.next() calls.
 */

const STEM_URLS = {
  vocal: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Vocals%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  guitar: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Instrumental%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  bass: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Bass%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
  drums: "https://pub-e61c949869c44bf9b2e5bcf648b7347f.r2.dev/Drums%20-%20No-Hay-Quiz%C3%A1s-Demo%20-%20140bpm%20-%20Bmaj.mp3",
} as const;

/** Placeholder MusicXML — swap for No Hay Quizás when available */
const MUSICXML_URL =
  "https://opensheetmusicdisplay.github.io/demo/sheets/MuzioClementi_SonatinaOpus36No1_Part1.xml";

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
  const animFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const playStartRef = useRef(0);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);

  // OSMD refs
  const osmdContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const osmdRef = useRef<any>(null);
  const totalNotesRef = useRef(0);
  const lastCursorStepRef = useRef(0);

  // ── Load OSMD and render MusicXML ───────────────────────────────
  useEffect(() => {
    if (!osmdContainerRef.current) return;
    let cancelled = false;

    const initOsmd = async () => {
      try {
        const xmlRes = await fetch(MUSICXML_URL);
        if (cancelled) return;
        const xml = await xmlRes.text();
        if (cancelled || !osmdContainerRef.current) return;

        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
        if (cancelled || !osmdContainerRef.current) return;

        const osmd = new OpenSheetMusicDisplay(osmdContainerRef.current, {
          backend: "svg",
          drawTitle: false,
          drawComposer: false,
          drawCredits: false,
          autoResize: true,
          followCursor: true,
        });

        await osmd.load(xml);
        if (cancelled) return;
        osmd.render();

        // Enable cursor
        osmd.cursor.show();
        osmd.cursor.reset();

        // Count total cursor steps for progress mapping.
        // Walk the cursor forward until it stops advancing.
        // Cast through any to access private OSMD iterator properties.
        let count = 0;
        osmd.cursor.reset();
        const MAX_STEPS = 2000;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const iter = osmd.cursor.iterator as any;
        while (count < MAX_STEPS) {
          const atEnd = iter.endReached ?? iter.EndReached ?? false;
          if (atEnd) break;
          osmd.cursor.next();
          count++;
        }
        osmd.cursor.reset();
        totalNotesRef.current = count;

        osmdRef.current = osmd;
      } catch (err) {
        console.error("Step5Preview: OSMD init failed", err);
      }
    };

    initOsmd();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Animation loop: progress bar + OSMD cursor sync ─────────────
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = () => {
      if (!mountedRef.current) return;

      const firstRig = Object.values(rigsRef.current)[0];
      if (firstRig?.player && duration > 0) {
        const rate = firstRig.player.playbackRate;
        const elapsed = ((performance.now() - playStartRef.current) / 1000) * rate;

        if (elapsed >= duration) {
          if (looping) {
            playStartRef.current = performance.now();
            setCursorPos(0);
            // Reset OSMD cursor for next loop
            if (osmdRef.current?.cursor) {
              osmdRef.current.cursor.reset();
              lastCursorStepRef.current = 0;
            }
          } else {
            Object.values(rigsRef.current).forEach((r) => r.player.stop());
            setIsPlaying(false);
            setCursorPos(0);
            if (osmdRef.current?.cursor) {
              osmdRef.current.cursor.reset();
              lastCursorStepRef.current = 0;
            }
            return;
          }
        } else {
          const progress = elapsed / duration;
          setCursorPos(progress);

          // Advance OSMD cursor proportionally to playback progress
          if (osmdRef.current?.cursor && totalNotesRef.current > 0) {
            const targetStep = Math.floor(progress * totalNotesRef.current);
            while (lastCursorStepRef.current < targetStep) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const atEnd = (osmdRef.current.cursor.iterator as any).endReached;
              if (atEnd) break;
              osmdRef.current.cursor.next();
              lastCursorStepRef.current++;
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, duration, looping]);

  // ── Toggle playback ─────────────────────────────────────────────
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

      if (Object.keys(rigsRef.current).length === 0) {
        for (const stem of STEM_TOGGLES) {
          const url = STEM_URLS[stem.key];
          if (!url) continue;
          const vol = new Tone.Volume(0).toDestination();
          const player = new Tone.Player({ url, loop: looping }).connect(vol);
          rigsRef.current[stem.key] = { player, volume: vol };
        }
        await Tone.loaded();
        const firstPlayer = Object.values(rigsRef.current)[0]?.player;
        if (firstPlayer?.buffer?.duration) setDuration(firstPlayer.buffer.duration);
      }

      // Apply mute states
      for (const stem of STEM_TOGGLES) {
        const rig = rigsRef.current[stem.key];
        if (rig) rig.volume.volume.value = mutedStems.has(stem.key) ? -Infinity : 0;
      }

      // Apply tempo + loop
      Object.values(rigsRef.current).forEach((r) => {
        r.player.playbackRate = tempo / 100;
        r.player.loop = looping;
      });

      // Reset OSMD cursor to start
      if (osmdRef.current?.cursor) {
        osmdRef.current.cursor.reset();
        lastCursorStepRef.current = 0;
      }

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

  // ── Mute/unmute sync ────────────────────────────────────────────
  useEffect(() => {
    for (const stem of STEM_TOGGLES) {
      const rig = rigsRef.current[stem.key];
      if (rig) rig.volume.volume.value = mutedStems.has(stem.key) ? -Infinity : 0;
    }
  }, [mutedStems]);

  // ── Tempo sync ──────────────────────────────────────────────────
  useEffect(() => {
    Object.values(rigsRef.current).forEach((r) => {
      r.player.playbackRate = tempo / 100;
    });
  }, [tempo]);

  // ── Loop sync ───────────────────────────────────────────────────
  useEffect(() => {
    Object.values(rigsRef.current).forEach((r) => {
      r.player.loop = looping;
    });
  }, [looping]);

  // ── Cleanup ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      Object.values(rigsRef.current).forEach((r) => {
        r.player.stop();
        r.player.dispose();
        r.volume.dispose();
      });
      rigsRef.current = {};
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
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-es-border flex items-center justify-between">
        <span className="text-es-text-secondary text-xs font-inter">
          No Hay Quizás — Practice Mode
        </span>
        {isLoading && (
          <span className="text-es-cyan text-[10px] font-mono animate-pulse">Loading stems...</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative h-6 rounded-md bg-es-bg-tertiary/50 overflow-hidden">
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
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <span className="text-es-text-tertiary text-[9px] font-mono">{fmtTime(currentTime)}</span>
            <span className="text-es-text-tertiary text-[9px] font-mono">
              {duration > 0 ? fmtTime(duration) : "--:--"}
            </span>
          </div>
        </div>
      </div>

      {/* OSMD sheet music container */}
      <div className="flex-1 px-4 py-1 min-h-0 overflow-y-auto">
        <div
          ref={osmdContainerRef}
          className="w-full min-h-[160px] [&_svg]:w-full"
          style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.85)" }}
        />
      </div>

      {/* Stem toggles */}
      <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap border-t border-es-border">
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

      {/* Controls bar */}
      <div className="px-4 py-2 border-t border-es-border flex items-center gap-4">
        <button
          onClick={togglePlayback}
          disabled={isLoading}
          className="w-9 h-9 rounded-full bg-es-cyan/10 border border-es-cyan/30 flex items-center justify-center text-es-cyan hover:bg-es-cyan/20 transition-colors"
        >
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="3" height="10" rx="1" />
              <rect x="9" y="2" width="3" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5L12 7L3 12.5V1.5Z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-es-text-tertiary text-[9px] font-mono">Tempo</span>
            <span className="text-es-text-secondary text-[9px] font-mono">{tempo}%</span>
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
          className={`px-2.5 py-1 rounded-md text-[10px] font-mono border transition-colors ${
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
