"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";

const Step1Preview = dynamic(() => import("./Step1Preview"), { ssr: false });
const Step2Preview = dynamic(() => import("./Step2Preview"), { ssr: false });
const Step3Preview = dynamic(() => import("./Step3Preview"), { ssr: false });
const Step4Preview = dynamic(() => import("./Step4Preview"), { ssr: false });
const Step5Preview = dynamic(() => import("./Step5Preview"), { ssr: false });
const Step6Preview = dynamic(() => import("./Step6Preview"), { ssr: false });

interface PreviewPaneProps {
  activeStep: number;
}

export default function PreviewPane({ activeStep }: PreviewPaneProps) {
  const previews: Record<number, React.ReactNode> = {
    1: <Step1Preview />,
    2: <Step2Preview />,
    3: <Step3Preview />,
    4: <Step4Preview />,
    5: <Step5Preview />,
    6: <Step6Preview />,
  };

  return (
    <div className="w-full h-[500px] rounded-2xl bg-es-bg-secondary/60 border border-es-border overflow-hidden how-it-works">
      <AnimatePresence mode="wait">
        <div key={activeStep} className="w-full h-full">
          {previews[activeStep] || previews[1]}
        </div>
      </AnimatePresence>
    </div>
  );
}
