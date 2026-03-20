"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import DemoInput from "./DemoInput";

export default function HeroOverlay() {
  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10 pointer-events-none px-4">
      <div className="max-w-3xl w-full text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-block mb-8"
        >
          <span className="px-4 py-1.5 rounded-full border border-es-cyan/40 text-es-cyan text-sm font-inter tracking-wide"
            style={{ boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)" }}
          >
            For Suno &amp; Udio Artists
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-clash font-bold text-es-text-primary leading-[1.05] mb-2"
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            textShadow: "0 0 60px rgba(0, 212, 255, 0.15)",
          }}
        >
          From Suno to Stage.
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="font-clash font-bold text-es-cyan leading-[1.05] mb-6"
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            textShadow: "0 0 80px rgba(0, 212, 255, 0.25)",
          }}
        >
          In One App.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.44 }}
          className="text-es-text-secondary font-inter text-lg sm:text-xl max-w-xl mx-auto mb-2"
        >
          Paste a link. We handle the rest. Editable charts, transposed
          arrangements, backing tracks, and stage-ready exports — all in one
          place.
        </motion.p>

        {/* Demo Input — pointer-events-auto so input field is clickable */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pointer-events-auto"
        >
          <DemoInput />
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-es-text-tertiary text-xs font-inter"
        >
          <span>Works with Suno ✓</span>
          <span>Udio ✓</span>
          <span>MP3/WAV ✓</span>
          <span>YouTube ✓</span>
        </motion.div>

        {/* CTA — pointer-events-auto so button is clickable */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-6 pointer-events-auto"
        >
          <button
            type="button"
            onClick={() => useAppStore.getState().openWaitlistModal()}
            className="px-6 py-3 rounded-xl border border-es-cyan/30 text-es-cyan font-inter text-sm font-medium hover:bg-es-cyan/10 transition-colors"
          >
            Apply for Founding Artist Access
          </button>
        </motion.div>
      </div>
    </div>
  );
}
