"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * GigModeAudio — uses the native Web Audio API (not Tone.js) to play ambient
 * stage room noise at 15% volume when Gig Mode activates. Fades in over 3
 * seconds, fades out and stops on deactivation.
 *
 * @remarks Uses Web Audio API directly for lightweight playback. Checks
 * audioContextStarted in Zustand before initializing — sets it to true if
 * not already started. Cleanup disposes all audio nodes on unmount.
 *
 * Zustand reads: audioContextStarted
 * Zustand writes: setAudioContextStarted
 */
export default function GigModeAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { audioContextStarted, setAudioContextStarted } = useAppStore.getState();

      const ctx = new AudioContext();
      ctxRef.current = ctx;

      if (!audioContextStarted) {
        setAudioContextStarted(true);
      }

      try {
        const response = await fetch("/audio/stage-ambient.wav");
        if (cancelled) return;
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);
        gain.connect(ctx.destination);
        gainRef.current = gain;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(gain);
        source.start();
        sourceRef.current = source;
      } catch (err) {
        console.error("GigModeAudio: failed to load ambient audio", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      /** Fade out over 500ms then stop and close */
      if (gainRef.current && ctxRef.current) {
        const now = ctxRef.current.currentTime;
        gainRef.current.gain.linearRampToValueAtTime(0, now + 0.5);
        setTimeout(() => {
          sourceRef.current?.stop();
          ctxRef.current?.close();
          ctxRef.current = null;
          sourceRef.current = null;
          gainRef.current = null;
        }, 600);
      } else {
        sourceRef.current?.stop();
        ctxRef.current?.close();
        ctxRef.current = null;
        sourceRef.current = null;
        gainRef.current = null;
      }
    };
  }, []);

  return null;
}
