"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const stems = [
  { name: "Vocals", color: "#00D4FF", key: "vocal" },
  { name: "Guitar", color: "#C7973A", key: "guitar" },
  { name: "Bass", color: "#7B2FBE", key: "bass" },
  { name: "Drums", color: "#00FF88", key: "drums" },
] as const;

function WaveformBar({ color, active, dimmed }: { color: string; active: boolean; dimmed: boolean }) {
  // Generate pseudo-random bar heights
  const bars = Array.from({ length: 48 }, (_, i) => {
    const h = 20 + Math.sin(i * 0.7) * 15 + Math.cos(i * 1.3) * 10 + Math.sin(i * 0.3) * 8;
    return Math.max(8, Math.min(50, h));
  });

  return (
    <div
      className="flex items-center gap-[2px] transition-opacity duration-300"
      style={{ opacity: dimmed ? 0.2 : 1 }}
    >
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: h,
            backgroundColor: color,
            boxShadow: active ? `0 0 6px ${color}40` : "none",
          }}
          animate={active ? { scaleY: [1, 1.15, 0.9, 1] } : { scaleY: 1 }}
          transition={active ? { duration: 1.5, repeat: Infinity, delay: i * 0.02 } : {}}
        />
      ))}
    </div>
  );
}

export default function Step2Preview() {
  const [hoveredStem, setHoveredStem] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col justify-center h-full gap-5 px-4"
    >
      {stems.map((stem) => {
        const isActive = hoveredStem === stem.key;
        const isDimmed = hoveredStem !== null && hoveredStem !== stem.key;
        return (
          <div
            key={stem.key}
            className="relative cursor-pointer py-2"
            onMouseEnter={() => setHoveredStem(stem.key)}
            onMouseLeave={() => setHoveredStem(null)}
          >
            <div className="flex items-center gap-4">
              <WaveformBar color={stem.color} active={isActive} dimmed={isDimmed} />
            </div>
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 -top-6 px-3 py-1 rounded-md text-xs font-inter font-medium"
                  style={{
                    backgroundColor: `${stem.color}20`,
                    color: stem.color,
                    border: `1px solid ${stem.color}40`,
                  }}
                >
                  {stem.name}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <p className="text-es-text-tertiary text-xs font-inter text-center mt-2">
        Hover each waveform to isolate a stem
      </p>
    </motion.div>
  );
}
