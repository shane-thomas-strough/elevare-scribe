"use client";

import { motion } from "framer-motion";

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="#00D4FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const trustSignals = [
  "No credit card required",
  "Cancel anytime",
  "500 founding spots remaining",
] as const;

export default function FinalCTASection() {
  return (
    <section
      className="relative w-full py-24 px-4"
      style={{
        background: "linear-gradient(to bottom, #0A0A0F, #0A0818)",
      }}
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* Headline */}
        <div className="mb-6">
          <motion.h2
            className="font-clash text-3xl font-bold text-white md:text-5xl"
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Your song already exists.
          </motion.h2>
          <motion.h2
            className="font-clash text-3xl font-bold text-es-cyan md:text-5xl"
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Now make it playable.
          </motion.h2>
        </div>

        {/* Subheadline */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl font-inter text-lg text-es-text-secondary"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          Join the platform that turns AI-generated songs into editable,
          transposable, performance-ready music.
        </motion.p>

        {/* Primary CTA */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <button
            type="button"
            className="inline-block rounded-xl bg-es-cyan px-8 py-4 text-lg font-semibold text-es-bg-primary transition-opacity hover:opacity-90"
          >
            Apply for Founding Artist Access
          </button>
        </motion.div>

        {/* Micro-copy */}
        <motion.p
          className="mx-auto mt-4 max-w-lg text-sm text-es-text-tertiary"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
        >
          Beta limited to 500 working musicians. Lock in lifetime early pricing
          and shape the features we build next.
        </motion.p>

        {/* Secondary CTA */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          viewport={{ once: true }}
        >
          <button
            type="button"
            className="text-es-text-secondary underline transition-colors hover:text-es-text-primary"
          >
            Start Free — No credit card required
          </button>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-6"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
        >
          {trustSignals.map((signal) => (
            <div
              key={signal}
              className="flex items-center gap-2 text-sm text-es-text-tertiary"
            >
              <CheckIcon />
              <span>{signal}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
