"use client";

const steps = [
  {
    num: 1,
    label: "Import",
    desc: "Paste a Suno or Udio link, or upload your audio file. That is the entire setup.",
  },
  {
    num: 2,
    label: "Process",
    desc: "We separate the vocals, guitar, bass, and drums into isolated tracks before we transcribe a single note. That is the difference between a messy guess and a clean, usable chart.",
  },
  {
    num: 3,
    label: "Arrange",
    desc: "Drag the slider. Hear the song shift. Watch the sheet music update. This is your song, in your key, ready to play.",
  },
  {
    num: 4,
    label: "Edit",
    desc: "Fix notes, lyrics, and phrasing directly inside the app. No bouncing to another editor.",
  },
  {
    num: 5,
    label: "Practice",
    desc: "Rehearse with synced playback, stem control, loop sections, and tempo adjustment.",
  },
  {
    num: 6,
    label: "Perform",
    desc: "Export charts, tabs, and backing tracks built for real use on stage.",
  },
];

interface StepListProps {
  activeStep: number;
}

export default function StepList({ activeStep }: StepListProps) {
  return (
    <div className="space-y-0">
      {steps.map((step) => {
        const isActive = activeStep === step.num;
        return (
          <div
            key={step.num}
            id={`hiw-step-${step.num}`}
            className="py-10 transition-all duration-500"
          >
            <div className="flex items-start gap-5">
              <span
                className="font-clash font-bold leading-none transition-all duration-700 select-none"
                style={{
                  fontSize: "96px",
                  color: isActive ? "#00D4FF" : "#8888AA",
                  opacity: isActive ? 1 : 0.1,
                  textShadow: isActive ? "0 0 40px rgba(0, 212, 255, 0.3)" : "none",
                  animation: isActive ? "stepPulse 2s ease-in-out infinite" : "none",
                }}
              >
                {step.num}
              </span>
              <div className="pt-6">
                <h3
                  className="font-clash font-medium text-2xl mb-2 transition-colors duration-500"
                  style={{ color: isActive ? "#F0F0F8" : "#8888AA" }}
                >
                  {step.label}
                </h3>
                <p
                  className="font-inter text-sm leading-relaxed transition-colors duration-500 max-w-xs"
                  style={{ color: isActive ? "#8888AA" : "#555575" }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes stepPulse {
          0%, 100% { text-shadow: 0 0 40px rgba(0, 212, 255, 0.3); }
          50% { text-shadow: 0 0 60px rgba(0, 212, 255, 0.5); }
        }
      `}</style>
    </div>
  );
}
