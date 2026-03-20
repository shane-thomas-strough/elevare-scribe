"use client";

import { motion } from "framer-motion";

export default function Step4Preview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      {/* Simulated sheet music measure with an error */}
      <div className="w-full max-w-sm bg-es-bg-secondary rounded-xl border border-es-border p-5">
        {/* Staff lines */}
        <div className="relative h-24 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute w-full h-[1px] bg-es-text-tertiary/30"
              style={{ top: `${20 + i * 14}px` }}
            />
          ))}
          {/* Notes */}
          {[
            { x: 15, y: 34, color: "#F0F0F8" },
            { x: 30, y: 48, color: "#F0F0F8" },
            { x: 45, y: 27, color: "#FF4444" }, // Wrong note - red
            { x: 60, y: 41, color: "#F0F0F8" },
            { x: 75, y: 55, color: "#F0F0F8" },
          ].map((note, i) => (
            <div key={i} className="absolute" style={{ left: `${note.x}%`, top: `${note.y}px` }}>
              <div
                className="w-4 h-3 rounded-full"
                style={{
                  backgroundColor: note.color,
                  transform: "rotate(-20deg)",
                  boxShadow: note.color === "#FF4444" ? "0 0 8px rgba(255,68,68,0.5)" : "none",
                }}
              />
              <div
                className="absolute -right-[1px] -top-[22px] w-[2px] h-6"
                style={{ backgroundColor: note.color }}
              />
            </div>
          ))}

          {/* Error tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute right-4 -top-2 px-2 py-1 rounded bg-[#FF4444]/10 border border-[#FF4444]/30"
          >
            <span className="text-[#FF4444] text-[10px] font-mono">Wrong note detected</span>
          </motion.div>
        </div>

        {/* Correction panel */}
        <div className="flex items-center gap-3 bg-es-bg-tertiary rounded-lg p-3">
          <div className="flex flex-col items-center gap-1">
            <button className="w-7 h-7 rounded bg-es-bg-secondary border border-es-border flex items-center justify-center text-es-text-secondary hover:text-es-cyan hover:border-es-cyan/30 transition-colors">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1L9 6H1L5 1Z"/></svg>
            </button>
            <span className="text-es-text-tertiary text-[9px] font-mono">+1</span>
            <button className="w-7 h-7 rounded bg-es-bg-secondary border border-es-border flex items-center justify-center text-es-text-secondary hover:text-es-cyan hover:border-es-cyan/30 transition-colors">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 9L1 4H9L5 9Z"/></svg>
            </button>
            <span className="text-es-text-tertiary text-[9px] font-mono">-1</span>
          </div>
          <div className="flex-1">
            <label className="text-es-text-tertiary text-[10px] font-inter block mb-1">Lyrics</label>
            <input
              type="text"
              defaultValue="qui-zas"
              className="w-full px-2 py-1 rounded bg-es-bg-secondary border border-es-border text-es-text-primary text-xs font-mono focus:outline-none focus:border-es-cyan/40"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 px-3 py-1.5 rounded-md bg-es-bg-secondary border border-es-border">
        <span className="text-es-text-secondary text-xs font-inter">
          Click any note to correct it.
        </span>
      </div>
    </motion.div>
  );
}
