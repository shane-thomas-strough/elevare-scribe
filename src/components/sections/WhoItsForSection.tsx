"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const personas = [
  {
    title: "The Performer",
    desc: "Needs charts, keys, and stage-ready outputs.",
    hoverReveal: "You generate the song. We make it playable.",
    accent: "es-cyan",
    accentHex: "#00D4FF",
  },
  {
    title: "The Songwriter",
    desc: "Needs editable musical structure to refine ideas and build a real catalog.",
    hoverReveal: "Your catalog, professionally scored.",
    accent: "es-gold",
    accentHex: "#C7973A",
  },
  {
    title: "The Catalog Builder",
    desc: "Needs a repeatable, professional workflow across dozens of songs.",
    hoverReveal: "Scale your catalog without scaling your workload.",
    accent: "es-purple",
    accentHex: "#7B2FBE",
  },
  {
    title: "The Cover Artist",
    desc: "Takes songs they love, transposes them to their range, performs them with a custom backing track.",
    hoverReveal: "Any song, your key, your stage.",
    accent: "es-green",
    accentHex: "#00FF88",
  },
];

const accentClasses: Record<string, { dot: string; border: string }> = {
  "es-cyan": {
    dot: "bg-es-cyan",
    border: "border-es-cyan/30",
  },
  "es-gold": {
    dot: "bg-es-gold",
    border: "border-es-gold/30",
  },
  "es-purple": {
    dot: "bg-es-purple",
    border: "border-es-purple/30",
  },
  "es-green": {
    dot: "bg-es-green",
    border: "border-es-green/30",
  },
};

export default function WhoItsForSection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section className="relative w-full bg-es-bg-primary py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          className="mb-16 text-center font-clash text-3xl font-medium leading-tight text-es-text-primary md:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Made for artists who create with AI — and still want the work to be
          human.
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {personas.map((persona, index) => {
            const classes = accentClasses[persona.accent]!;
            const isHovered = hoveredCard === index;

            return (
              <motion.div
                key={persona.title}
                className={`group cursor-default rounded-xl border bg-es-bg-secondary p-6 transition-colors duration-200 ${
                  isHovered ? classes.border : "border-es-border"
                }`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Accent dot */}
                <div
                  className={`mb-4 h-2 w-2 rounded-full ${classes.dot}`}
                />

                <h3 className="font-clash text-xl font-medium text-es-text-primary">
                  {persona.title}
                </h3>

                <p className="mt-2 font-inter text-sm leading-relaxed text-es-text-secondary">
                  {persona.desc}
                </p>

                {/* Hover reveal */}
                <div
                  className={`mt-4 overflow-hidden transition-all duration-300 ${
                    isHovered
                      ? "max-h-20 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p
                    className="font-inter text-sm italic"
                    style={{ color: persona.accentHex }}
                  >
                    {persona.hoverReveal}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
