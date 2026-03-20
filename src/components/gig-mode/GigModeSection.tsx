"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import GigModeOverlay from "./GigModeOverlay";

/**
 * GigModeSection — the entry section visible before the Gig Mode takeover.
 * Displays the "GIG MODE" headline with a GSAP typewriter animation,
 * three feature callouts, and the "Enter Gig Mode" activation button.
 * Also renders the GigModeOverlay (which is hidden until isGigModeActive).
 *
 * @remarks Uses GSAP for the typewriter effect (scroll-driven domain).
 * Framer Motion is NOT used here — GSAP handles the entrance animation.
 *
 * Zustand writes: setGigModeActive (via button click)
 */

const FEATURES = [
  {
    title: "Stage-Ready Display",
    desc: "High-contrast dark mode and massive font scaling for 10-foot readability under stage lights.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="4" y="6" width="24" height="16" rx="2" stroke="#00D4FF" strokeWidth="1.5" />
        <path d="M12 26H20" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 22V26" stroke="#00D4FF" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Hands-Free Control",
    desc: "Connects instantly to standard Bluetooth page-turner foot pedals.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="10" stroke="#00D4FF" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="4" fill="#00D4FF" fillOpacity="0.3" />
        <path d="M16 6V10" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 22V26" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Real-Time Band Sync",
    desc: "When a bassist joins the set, they open a link. When you advance to the chorus, every connected device advances simultaneously.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="10" cy="16" r="4" stroke="#00D4FF" strokeWidth="1.5" />
        <circle cx="22" cy="10" r="3" stroke="#00D4FF" strokeWidth="1.5" />
        <circle cx="22" cy="22" r="3" stroke="#00D4FF" strokeWidth="1.5" />
        <path d="M14 15L19 11" stroke="#00D4FF" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 17L19 21" stroke="#00D4FF" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function GigModeSection() {
  const setGigModeActive = useAppStore((s) => s.setGigModeActive);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  /** GSAP typewriter animation on scroll entry */
  useEffect(() => {
    if (!headlineRef.current || !sectionRef.current) return;

    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    const init = async () => {
      const gsapModule = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.default ?? gsapModule;
      gsap.registerPlugin(ScrollTrigger);

      if (!headlineRef.current || !sectionRef.current) return;

      // Wrap each letter in a span for the typewriter effect
      const text = "GIG MODE";
      headlineRef.current.innerHTML = text
        .split("")
        .map((ch) => `<span class="inline-block opacity-0">${ch === " " ? "&nbsp;" : ch}</span>`)
        .join("");

      const letters = headlineRef.current.querySelectorAll("span");

      ctx = gsap.context(() => {
        gsap.to(letters, {
          opacity: 1,
          duration: 0.05,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none",
          },
        });
      }, sectionRef);
    };

    init();

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative bg-es-bg-primary py-24 px-4 sm:px-8 lg:px-16"
        aria-label="Gig Mode section"
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Section label */}
          <p className="text-es-cyan text-sm font-inter tracking-widest uppercase mb-6">
            The Stage Interface
          </p>

          {/* Headline — typewriter animated by GSAP */}
          <h2
            ref={headlineRef}
            className="font-clash font-bold text-es-text-primary mb-6"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
          >
            GIG MODE
          </h2>

          {/* Subheadline */}
          <p className="font-inter text-es-text-secondary text-lg max-w-2xl mx-auto mb-16">
            When you are playing live, the editing interface is just noise. Gig Mode strips
            everything away.
          </p>

          {/* Feature callouts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-es-bg-secondary/50 rounded-xl border border-es-border p-6 text-center"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="font-clash font-medium text-es-text-primary text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="font-inter text-es-text-secondary text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Enter Gig Mode button */}
          <button
            onClick={() => setGigModeActive(true)}
            className="px-10 py-4 rounded-xl bg-es-bg-secondary border border-es-cyan/40 text-es-cyan font-clash font-medium text-xl hover:bg-es-cyan/10 hover:border-es-cyan/60 transition-all duration-300"
            style={{
              boxShadow: "0 0 40px rgba(0, 212, 255, 0.1)",
            }}
          >
            Enter Gig Mode →
          </button>
        </div>
      </section>

      {/* Overlay — renders when isGigModeActive is true */}
      <GigModeOverlay />
    </>
  );
}
