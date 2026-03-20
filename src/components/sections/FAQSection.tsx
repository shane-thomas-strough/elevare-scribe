"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Do I own the sheet music I create?",
    a: "Yes. The charts, tabs, and arrangements you create in Elevare Scribe belong to you. We process your audio — we do not claim any rights to your music or your output.",
  },
  {
    q: "Does it work with Suno and Udio?",
    a: "Yes. Paste the share link directly. No downloading required.",
  },
  {
    q: "Can I upload my own audio?",
    a: "Yes. MP3, WAV, FLAC, and M4A files are all supported.",
  },
  {
    q: "Can I transpose to my natural vocal range?",
    a: "Yes. The Arrangement Engine shifts all notes, chord names, and guitar tabs simultaneously in real time.",
  },
  {
    q: "Is this for beginners or advanced musicians?",
    a: "Both. Simplify complex AI arrangements down to beginner open-position guitar chords, or keep full complexity for advanced play.",
  },
  {
    q: "What happens in Gig Mode?",
    a: "The editing interface disappears. You get massive, high-contrast sheet music for stage lighting. It connects to Bluetooth foot pedals and syncs with your band in real time.",
  },
  {
    q: "How accurate is the transcription?",
    a: "By separating stems before transcription we achieve 90%+ accuracy — significantly better than tools that transcribe mixed audio directly. The Fix-It Studio handles remaining corrections.",
  },
  {
    q: "What is Founding Artist Access?",
    a: "A limited beta for the first 500 musicians who want to shape the product. Lifetime Pro access at a one-time price and direct input on features we build next.",
  },
];

const leftColumn = faqs.filter((_, i) => i % 2 === 0);
const rightColumn = faqs.filter((_, i) => i % 2 === 1);

export default function FAQSection() {
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
          Frequently Asked Questions
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          viewport={{ once: true }}
        >
          {/* Left column */}
          <Accordion defaultValue={[]}>
            {leftColumn.map((faq, index) => (
              <AccordionItem
                key={index}
                value={index}
                className="border-es-border"
              >
                <AccordionTrigger className="py-4 font-inter text-sm font-medium text-es-text-primary hover:no-underline hover:text-es-cyan">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-inter text-sm leading-relaxed text-es-text-secondary">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Right column */}
          <Accordion defaultValue={[]}>
            {rightColumn.map((faq, index) => (
              <AccordionItem
                key={index}
                value={index}
                className="border-es-border"
              >
                <AccordionTrigger className="py-4 font-inter text-sm font-medium text-es-text-primary hover:no-underline hover:text-es-cyan">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-inter text-sm leading-relaxed text-es-text-secondary">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
