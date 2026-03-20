"use client";

export default function AudioFallback() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 px-6 py-8"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      {/* Static waveform SVG illustration */}
      <svg
        width="200"
        height="64"
        viewBox="0 0 200 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Waveform bars — static representation of an audio waveform */}
        {[
          { x: 8, h: 12 },
          { x: 16, h: 20 },
          { x: 24, h: 32 },
          { x: 32, h: 24 },
          { x: 40, h: 44 },
          { x: 48, h: 56 },
          { x: 56, h: 40 },
          { x: 64, h: 28 },
          { x: 72, h: 48 },
          { x: 80, h: 52 },
          { x: 88, h: 36 },
          { x: 96, h: 60 },
          { x: 104, h: 44 },
          { x: 112, h: 32 },
          { x: 120, h: 50 },
          { x: 128, h: 38 },
          { x: 136, h: 56 },
          { x: 144, h: 42 },
          { x: 152, h: 28 },
          { x: 160, h: 20 },
          { x: 168, h: 36 },
          { x: 176, h: 16 },
          { x: 184, h: 24 },
          { x: 192, h: 10 },
        ].map(({ x, h }) => (
          <rect
            key={x}
            x={x}
            y={(64 - h) / 2}
            width="4"
            height={h}
            rx="2"
            fill="rgba(0, 212, 255, 0.25)"
          />
        ))}
        {/* Muted icon overlay */}
        <circle
          cx="100"
          cy="32"
          r="14"
          fill="#0A0A0F"
          stroke="rgba(0, 212, 255, 0.4)"
          strokeWidth="1.5"
        />
        <line
          x1="94"
          y1="28"
          x2="100"
          y2="28"
          stroke="rgba(0, 212, 255, 0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <polygon
          points="100,28 106,24 106,36 100,32"
          fill="rgba(0, 212, 255, 0.6)"
        />
        <line
          x1="109"
          y1="26"
          x2="103"
          y2="38"
          stroke="rgba(0, 212, 255, 0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <p
        className="text-sm font-inter"
        style={{ color: "rgba(240, 240, 248, 0.5)" }}
      >
        Audio preview unavailable
      </p>
    </div>
  );
}
