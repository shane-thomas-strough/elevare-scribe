"use client";

import { useEffect, useRef } from "react";

/**
 * Waveform — animated audio waveform visualization rendered with Canvas.
 * A frequency spectrum slowly pulses in cyan as if the song is playing
 * silently. Used in Stop 2 and Stop 3 of the founder timeline.
 *
 * @param amplitude - 0 to 1, controls the height of waveform bars.
 *   When 0, the waveform renders as a flat line (used in Stop 3 silence).
 * @param color - Hex color of the waveform bars. Default: #00D4FF (cyan).
 */
interface WaveformProps {
  amplitude: number;
  color?: string;
}

export default function Waveform({ amplitude, color = "#00D4FF" }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 400;
    const h = 120;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const barCount = 64;
    const barWidth = (w / barCount) * 0.6;
    const gap = (w / barCount) * 0.4;

    const draw = () => {
      timeRef.current += 0.02;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < barCount; i++) {
        /** Generate organic bar heights from layered sine waves */
        const base =
          Math.sin(i * 0.3 + timeRef.current * 1.2) * 0.4 +
          Math.sin(i * 0.7 + timeRef.current * 0.8) * 0.3 +
          Math.sin(i * 0.15 + timeRef.current * 0.5) * 0.2 +
          0.15;

        const barH = Math.max(2, base * h * 0.7 * amplitude);
        const x = i * (barWidth + gap);
        const y = (h - barH) / 2;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6 + amplitude * 0.4;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 1.5);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [amplitude, color]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto"
      aria-label="Audio waveform visualization"
      role="img"
    />
  );
}
