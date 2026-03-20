"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PreviewPane — renders the active step's demo panel. Each step preview
 * is dynamically imported with ssr:false to avoid SSR issues with Tone.js
 * and OSMD. AnimatePresence handles transitions between steps.
 */
const Step1Preview = dynamic(() => import("./Step1Preview"), { ssr: false });
const Step2Preview = dynamic(() => import("./Step2Preview"), { ssr: false });
const Step3Preview = dynamic(() => import("./Step3Preview"), { ssr: false });
const Step4Preview = dynamic(() => import("./Step4Preview"), { ssr: false });
const Step5Preview = dynamic(() => import("./Step5Preview"), { ssr: false });
const Step6Preview = dynamic(() => import("./Step6Preview"), { ssr: false });

interface PreviewPaneProps {
  activeStep: number;
}

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1: return <Step1Preview />;
    case 2: return <Step2Preview />;
    case 3: return <Step3Preview />;
    case 4: return <Step4Preview />;
    case 5: return <Step5Preview />;
    case 6: return <Step6Preview />;
    default: return <Step1Preview />;
  }
}

export default function PreviewPane({ activeStep }: PreviewPaneProps) {
  return (
    <div className="w-full h-[500px] rounded-2xl bg-es-bg-secondary/60 border border-es-border overflow-hidden how-it-works">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <StepContent step={activeStep} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
