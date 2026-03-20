"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import StepList from "./StepList";
import PreviewPane from "./PreviewPane";

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    const init = async () => {
      const gsapModule = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.default || gsapModule;
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        // Pin the entire section
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: ".hiw-preview-col",
          pinSpacing: false,
        });

        // Create scroll triggers for each step
        for (let i = 1; i <= 6; i++) {
          const stepEl = document.getElementById(`hiw-step-${i}`);
          if (!stepEl) continue;

          ScrollTrigger.create({
            trigger: stepEl,
            start: "top 33%",
            end: "bottom 33%",
            onEnter: () => setActiveStep(i),
            onEnterBack: () => setActiveStep(i),
          });
        }
      }, sectionRef);
    };

    init();

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-es-bg-primary py-24 px-4 sm:px-8 lg:px-16"
    >
      {/* Section header */}
      <div className="max-w-6xl mx-auto mb-16">
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
        {/* Left column: step list — scrolls */}
        <div className="w-full lg:w-[40%]">
          <StepList activeStep={activeStep} />
        </div>

        {/* Right column: preview pane — sticky */}
        <div className="hidden lg:block w-full lg:w-[60%] hiw-preview-col">
          <div className="sticky top-24">
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
