"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import StepList from "./StepList";
import PreviewPane from "./PreviewPane";

/**
 * HowItWorks — the interactive six-step workflow section. Uses GSAP
 * ScrollTrigger to pin the preview pane while the step list scrolls.
 * Includes ResizeObserver + debounced resize listener to fix ScrollTrigger
 * calculations at different browser zoom levels and viewport sizes.
 */
export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(1);
  const scrollTriggerRef = useRef<{ refresh: () => void } | null>(null);

  /** Debounced ScrollTrigger.refresh to handle zoom/resize */
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(() => {
      scrollTriggerRef.current?.refresh();
    }, 250);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    let resizeObserver: ResizeObserver | null = null;

    const init = async () => {
      const gsapModule = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.default || gsapModule;
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      // Store ScrollTrigger reference for resize refresh
      scrollTriggerRef.current = ScrollTrigger;

      ctx = gsap.context(() => {
        // Create scroll triggers for each step — use percentage-based positions
        // to work reliably across zoom levels
        for (let i = 1; i <= 6; i++) {
          const stepEl = document.getElementById(`hiw-step-${i}`);
          if (!stepEl) continue;

          ScrollTrigger.create({
            trigger: stepEl,
            start: "top 60%",
            end: "bottom 40%",
            invalidateOnRefresh: true,
            onEnter: () => setActiveStep(i),
            onEnterBack: () => setActiveStep(i),
          });
        }
      }, sectionRef);

      // ResizeObserver on the section container — recalculates on zoom/resize
      if (sectionRef.current) {
        resizeObserver = new ResizeObserver(() => {
          debouncedRefresh();
        });
        resizeObserver.observe(sectionRef.current);
      }

      // Window resize listener as fallback for zoom changes
      window.addEventListener("resize", debouncedRefresh);
    };

    init();

    return () => {
      ctx?.revert();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", debouncedRefresh);
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    };
  }, [debouncedRefresh]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-es-bg-primary pt-24 pb-[50vh] px-4 sm:px-8 lg:px-16"
      style={{ zIndex: 1 }}
    >
      {/* Section header — offset from top to avoid nav overlap */}
      <div className="max-w-6xl mx-auto mb-16 pt-16" id="how-it-works">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-clash font-medium text-es-text-primary mb-4"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          One workflow. Start to finish.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-inter text-es-text-secondary text-lg max-w-xl"
        >
          Paste a link. Process the song. Make it yours. Take it live.
        </motion.p>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left column: step list — scrolls naturally */}
        <div className="w-full lg:w-[40%]">
          <StepList activeStep={activeStep} />
        </div>

        {/* Right column: preview pane — CSS sticky (not GSAP pin) */}
        <div className="hidden lg:block w-full lg:w-[60%]">
          {/* top-24 = 96px offset for navbar (h-16 + 32px clearance for glass blur) */}
          <div className="sticky top-24" style={{ zIndex: 2 }}>
            <PreviewPane activeStep={activeStep} />
          </div>
        </div>

        {/* Mobile: preview below step list */}
        <div className="lg:hidden w-full">
          <PreviewPane activeStep={activeStep} />
        </div>
      </div>
    </section>
  );
}
