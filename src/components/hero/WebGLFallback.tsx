"use client";

export default function WebGLFallback() {
  return (
    <>
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: "#0A0A0F",
          animation: "webgl-fallback-gradient 18s ease infinite",
        }}
      >
        {/* Primary gradient layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0, 212, 255, 0.05) 0%, transparent 70%)",
            animation: "webgl-fallback-shift 18s ease-in-out infinite",
          }}
        />
        {/* Secondary gradient layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 80% at 30% 60%, rgba(123, 47, 190, 0.03) 0%, transparent 70%)",
            animation: "webgl-fallback-shift 18s ease-in-out infinite reverse",
          }}
        />
        {/* Tertiary subtle sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 40% at 70% 40%, rgba(0, 212, 255, 0.03) 0%, transparent 60%)",
            animation: "webgl-fallback-pulse 15s ease-in-out infinite",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes webgl-fallback-shift {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 1;
          }
          25% {
            transform: translate(5%, -3%) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-3%, 5%) scale(0.95);
            opacity: 1;
          }
          75% {
            transform: translate(-5%, -2%) scale(1.05);
            opacity: 0.7;
          }
        }

        @keyframes webgl-fallback-pulse {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes webgl-fallback-gradient {
          0%,
          100% {
            background: #0a0a0f;
          }
          33% {
            background: linear-gradient(
              135deg,
              #0a0a0f 0%,
              #0a0b12 50%,
              #0a0a0f 100%
            );
          }
          66% {
            background: linear-gradient(
              225deg,
              #0a0a0f 0%,
              #0d0a12 50%,
              #0a0a0f 100%
            );
          }
        }
      `}</style>
    </>
  );
}
