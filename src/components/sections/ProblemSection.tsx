"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const painPoints = [
  {
    problem: "How to get sheet music or tabs",
    solution: "The Tri-Engine AI Pipeline transcribes every stem.",
  },
  {
    problem: "How to change the key to fit your voice",
    solution: "The Arrangement Engine does this in one slider drag.",
  },
  {
    problem:
      "How to strip out lead vocal or instrument parts for live performance",
    solution: "Backing Track Export isolates any combination of stems.",
  },
  {
    problem: "How to fix transcription mistakes",
    solution:
      "The Fix-It Studio corrects notes, lyrics, and measures in-app.",
  },
  {
    problem: "How to rehearse efficiently",
    solution:
      "Practice Mode syncs audio, notation, and tempo control.",
  },
  {
    problem:
      "How to turn a generated file into something you can actually take on stage",
    solution:
      "Gig Mode is a full browser takeover built for the stage.",
  },
];

export default function ProblemSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative w-full bg-es-bg-primary py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-[720px] px-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Badge pill */}
        <span className="mb-6 inline-block rounded-full border border-white/[0.08] bg-es-bg-secondary px-4 py-1.5 font-inter text-sm text-es-text-secondary">
          The Problem
        </span>

        {/* Headline */}
        <h2 className="mt-4 font-clash text-3xl font-medium leading-tight text-es-text-primary md:text-5xl">
          AI made it easier to create songs. It did not make them usable.
        </h2>

        {/* Body */}
        <p className="mt-6 font-inter text-lg leading-relaxed text-es-text-secondary">
          AI music tools solved the blank page. You can generate a fully
          produced song in minutes. But turning that song into something you
          can actually perform still requires a mess of disconnected tools.
        </p>

        {/* Pain points list */}
        <ul className="mt-12 space-y-4 text-left">
          {painPoints.map((item, index) => (
            <li
              key={index}
              className="relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`cursor-default rounded-lg border px-5 py-4 font-inter text-base transition-colors duration-200 ${
                  hoveredIndex === index
                    ? "border-es-cyan/30 bg-es-cyan/[0.05] text-es-cyan"
                    : "border-white/[0.08] bg-es-bg-secondary text-es-text-secondary"
                }`}
              >
                <span className="mr-2 text-es-text-tertiary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.problem}
              </div>

              {/* Tooltip */}
              {hoveredIndex === index && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-[calc(100%+12px)] md:block"
                >
                  <div className="w-64 rounded-lg border border-es-cyan/20 bg-es-bg-secondary p-4 font-inter text-sm leading-snug text-es-text-primary shadow-lg shadow-es-cyan/5">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-es-cyan">
                      Elevare Scribe
                    </span>
                    {item.solution}
                  </div>
                </motion.div>
              )}
            </li>
          ))}
        </ul>

        {/* Closer */}
        <p className="mt-12 font-inter text-lg leading-relaxed text-es-text-primary">
          Most tools solve one fragment. None own the full journey.{" "}
          <span className="text-es-cyan">
            Elevare Scribe was built to own the journey.
          </span>
        </p>
      </motion.div>
    </section>
  );
}
