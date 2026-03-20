"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * GigModeAudio — plays ambient stage room noise at 15% volume and applies
 * a low-pass filter to any active Tone.js audio, simulating the muffled,
 * heavy-bass sound of standing on a physical stage.
 *
 * Audio chain: source → lowPassFilter → gain → destination
 *
 * Zustand reads: audioContextStarted
 * Zustand writes: setAudioContextStarted
 */
export default function GigModeAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { setAudioContextStarted } = useAppStore.getState();

      const ctx = new AudioContext();
      ctxRef.current = ctx;
      setAudioContextStarted(true);

      // Low-pass filter simulating on-stage muffled sound (800Hz cutoff)
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
      filter.connect(ctx.destination);
      filterRef.current = filter;

      // Gain node for volume control with 3-second fade-in
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);
      gain.connect(filter);
      gainRef.current = gain;

      try {
        const response = await fetch("/audio/stage-ambient.wav");
        if (cancelled) return;
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

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
      if (gainRef.current && ctxRef.current) {
        const now = ctxRef.current.currentTime;
        gainRef.current.gain.linearRampToValueAtTime(0, now + 0.5);
        setTimeout(() => {
          sourceRef.current?.stop();
          filterRef.current?.disconnect();
          ctxRef.current?.close();
          ctxRef.current = null;
          sourceRef.current = null;
          gainRef.current = null;
          filterRef.current = null;
        }, 600);
      } else {
        sourceRef.current?.stop();
        filterRef.current?.disconnect();
        ctxRef.current?.close();
        ctxRef.current = null;
        sourceRef.current = null;
        gainRef.current = null;
        filterRef.current = null;
      }
    };
  }, []);

  return null;
}
