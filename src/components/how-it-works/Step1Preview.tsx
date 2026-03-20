"use client";

import { motion } from "framer-motion";

export default function Step1Preview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-es-bg-secondary border border-es-green/30">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-es-green/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-mono text-sm text-es-text-primary truncate">
            https://suno.com/song/no-hay-quizas-3f8a...
          </span>
        </div>
        <p className="text-center text-es-green text-sm font-inter mt-4">
          Link accepted — processing your audio
        </p>
        <div className="flex justify-center mt-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-es-green"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
