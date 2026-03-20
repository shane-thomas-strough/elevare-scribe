"use client";

import { motion } from "framer-motion";

const cards = [
  {
    accent: "cyan",
    accentColor: "#00D4FF",
    headline: "From audio to playable",
    body: "Turn Suno, Udio, or uploaded songs into editable charts, chord sheets, tabs, and lyric-aligned notation.",
  },
  {
    accent: "gold",
    accentColor: "#C7973A",
    headline: "From generated to human",
    body: "Transpose songs to your range, simplify dense AI arrangements, and create versions that real musicians can actually perform.",
  },
  {
    accent: "purple",
    accentColor: "#7B2FBE",
    headline: "From file to frontman",
    body: "Practice with synced playback, export backing tracks, and build a real performance workflow around your songs.",
  },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function ValuePropsSection() {
  return (
    <section className="relative w-full bg-es-bg-primary py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section headline */}
        <motion.h2
          className="mx-auto mb-16 max-w-3xl text-center font-clash text-3xl font-medium leading-tight text-es-text-primary md:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          The missing operating system for AI-assisted musicians
        </motion.h2>

        {/* Cards grid */}
        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {cards.map((card) => (
            <motion.div
              key={card.accent}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-es-bg-secondary p-6 transition-all duration-150 hover:-translate-y-2 hover:border-white/[0.3]"
            >
              {/* Accent bar */}
              <div
                className="mb-5 h-1 w-12 rounded-full"
                style={{ backgroundColor: card.accentColor }}
              />

              {/* Headline */}
              <h3
                className="mb-3 font-clash text-xl font-medium"
                style={{ color: card.accentColor }}
              >
                {card.headline}
              </h3>

              {/* Body */}
              <p className="font-inter text-base leading-relaxed text-es-text-secondary">
                {card.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
