"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const proPrice = billing === "monthly" ? 12 : 10;

  return (
    <section
      id="pricing"
      className="relative w-full bg-es-bg-primary py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Headline */}
        <motion.h2
          className="text-center font-clash text-3xl font-medium leading-tight text-es-text-primary md:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Simple pricing. No surprises.
        </motion.h2>

        {/* Billing toggle */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <span
            className={`font-inter text-sm transition-colors ${
              billing === "monthly"
                ? "text-es-text-primary"
                : "text-es-text-tertiary"
            }`}
          >
            Monthly
          </span>

          <button
            type="button"
            onClick={() =>
              setBilling((b) => (b === "monthly" ? "annual" : "monthly"))
            }
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-es-border transition-colors duration-200 ${
              billing === "annual" ? "bg-es-cyan/20" : "bg-es-bg-secondary"
            }`}
            aria-label="Toggle billing period"
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-es-cyan shadow-sm transition-transform duration-200 ${
                billing === "annual" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>

          <span
            className={`font-inter text-sm transition-colors ${
              billing === "annual"
                ? "text-es-text-primary"
                : "text-es-text-tertiary"
            }`}
          >
            Annual
          </span>
        </motion.div>

        {/* Pricing cards */}
        <div className="mt-14 grid items-center gap-6 md:grid-cols-3">
          {/* Free */}
          <motion.div
            className="rounded-xl border border-es-border bg-es-bg-secondary p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <p className="font-inter text-sm font-medium uppercase tracking-wider text-es-text-secondary">
              Free
            </p>

            <p className="mt-4 font-clash text-4xl font-medium text-es-text-primary">
              $0
              <span className="ml-1 font-inter text-base font-normal text-es-text-tertiary">
                /month
              </span>
            </p>

            <p className="mt-4 font-inter text-sm leading-relaxed text-es-text-secondary">
              3 transcriptions/month, basic charts, watermarked exports
            </p>

            <button
              type="button"
              className="mt-8 w-full rounded-lg border border-es-border bg-es-bg-tertiary px-6 py-3 font-inter text-sm font-medium text-es-text-primary transition-colors hover:bg-white/[0.06]"
            >
              Get Started Free
            </button>
          </motion.div>

          {/* Pro — center, elevated */}
          <motion.div
            className="relative scale-105 rounded-xl border border-es-cyan/40 bg-es-bg-secondary p-8 shadow-[0_0_30px_rgba(0,212,255,0.15)]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Badge */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-es-cyan px-4 py-1 font-inter text-xs font-semibold text-es-bg-primary">
              Most Popular
            </span>

            <p className="font-inter text-sm font-medium uppercase tracking-wider text-es-cyan">
              Pro
            </p>

            <p className="mt-4 font-clash text-4xl font-medium text-es-text-primary">
              ${proPrice}
              <span className="ml-1 font-inter text-base font-normal text-es-text-tertiary">
                /month
              </span>
            </p>

            {billing === "annual" && (
              <p className="mt-1 font-inter text-xs text-es-text-tertiary">
                Billed annually
              </p>
            )}

            <ul className="mt-6 space-y-3">
              {[
                "Unlimited transcriptions",
                "Practice Mode",
                "Gig Mode",
                "Backing Tracks",
                "Copyright tools",
                "Marketplace access",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 font-inter text-sm text-es-text-secondary"
                >
                  <span className="mt-0.5 text-es-cyan">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-8 w-full rounded-lg bg-es-cyan px-6 py-3 font-inter text-sm font-semibold text-es-bg-primary transition-opacity hover:opacity-90"
            >
              Start Pro Trial
            </button>
          </motion.div>

          {/* Founding Artist */}
          <motion.div
            className="relative rounded-xl border border-es-gold/40 bg-es-bg-secondary p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {/* Badge */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-es-gold px-4 py-1 font-inter text-xs font-semibold text-es-bg-primary">
              Limited — 500 spots
            </span>

            <p className="font-inter text-sm font-medium uppercase tracking-wider text-es-gold">
              Founding Artist
            </p>

            <p className="mt-4 font-clash text-4xl font-medium text-es-text-primary">
              $149
              <span className="ml-1 font-inter text-base font-normal text-es-text-tertiary">
                one-time
              </span>
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "Lifetime Pro access",
                "Founding member badge",
                "Direct feature input",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 font-inter text-sm text-es-text-secondary"
                >
                  <span className="mt-0.5 text-es-gold">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-8 w-full rounded-lg bg-es-gold px-6 py-3 font-inter text-sm font-semibold text-es-bg-primary transition-opacity hover:opacity-90"
            >
              Claim Founding Artist Access
            </button>

            <p className="mt-3 text-center font-inter text-xs text-es-text-tertiary">
              These spots will not come back. When they are gone they are gone.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
