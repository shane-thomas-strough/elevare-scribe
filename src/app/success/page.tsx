"use client";

import { motion } from "framer-motion";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-es-bg-primary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg text-center"
      >
        <p className="font-clash font-bold text-es-cyan text-lg mb-4">Elevare Scribe</p>

        <h1
          className="font-clash font-bold text-es-text-primary mb-4"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          Welcome, Founding Artist.
        </h1>

        <p className="font-inter text-es-text-secondary text-lg mb-8">
          Your lifetime access is confirmed.
        </p>

        <a
          href="/"
          className="inline-block px-8 py-4 rounded-xl bg-es-cyan text-es-bg-primary font-inter font-semibold text-base hover:brightness-110 transition-all"
          style={{ boxShadow: "0 0 30px rgba(0, 212, 255, 0.3)" }}
        >
          Paste your first Suno link to get started →
        </a>

        <p className="font-cormorant italic text-es-text-secondary text-[22px] mt-12">
          You made the song. Now live it.
        </p>
      </motion.div>
    </main>
  );
}
