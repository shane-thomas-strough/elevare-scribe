"use client";

import { motion } from "framer-motion";

export default function DifferentiationSection() {
  return (
    <section
      className="relative w-full py-24 md:py-32"
      style={{
        background: "linear-gradient(180deg, #0A0A0F 0%, #0A0818 100%)",
      }}
    >
      <motion.div
        className="mx-auto max-w-2xl px-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Headline */}
        <h2 className="font-clash text-3xl font-medium leading-tight text-es-text-primary md:text-5xl">
          Not another generator. Not another transcription toy.
        </h2>

        {/* Line 1 */}
        <p className="mt-8 font-inter text-lg leading-relaxed text-es-text-primary">
          Elevare Scribe does not compete by making more songs.
        </p>

        {/* Line 2 - Cormorant Garamond Italic */}
        <p className="mt-6 font-cormorant text-[28px] italic leading-snug text-es-text-primary">
          It wins by helping artists do something real with the songs they
          already made.
        </p>

        {/* Closer */}
        <p className="mt-8 font-inter text-lg leading-relaxed text-es-text-secondary">
          This is not transcription. It is translation — from generated audio
          to human performance.
        </p>
      </motion.div>
    </section>
  );
}
