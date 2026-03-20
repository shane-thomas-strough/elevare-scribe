"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uStemSplit;    // 0.0 = unified, 1.0 = fully split
  uniform float uStemProgress; // per-stem stagger progress

  // Stem colors
  const vec3 CYAN   = vec3(0.0, 0.831, 1.0);    // #00D4FF vocal
  const vec3 GOLD   = vec3(0.78, 0.592, 0.227);  // #C7973A guitar
  const vec3 PURPLE = vec3(0.482, 0.184, 0.745);  // #7B2FBE bass
  const vec3 GREEN  = vec3(0.0, 1.0, 0.533);      // #00FF88 drums
  const vec3 BG     = vec3(0.039, 0.039, 0.059);  // #0A0A0F

  // Smooth noise
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u);
  }

  // Generate a waveform line
  float waveform(vec2 uv, float yCenter, float time, float freq, float amp, vec2 mouse) {
    // Distance from mouse influences amplitude
    float mouseDist = length(vec2(uv.x - mouse.x, (uv.y - yCenter) * 2.0));
    float mouseInfluence = smoothstep(0.6, 0.0, mouseDist) * 0.4;

    float totalAmp = amp + mouseInfluence;

    // Multiple octaves for organic feel
    float wave = 0.0;
    wave += sin(uv.x * freq * 3.0 + time * 0.8) * 0.5;
    wave += sin(uv.x * freq * 5.0 - time * 1.2) * 0.3;
    wave += sin(uv.x * freq * 8.0 + time * 0.5) * 0.15;
    wave += noise(uv.x * freq * 2.0 + time * 0.3) * 0.4 - 0.2;
    wave *= totalAmp;

    float y = uv.y - yCenter - wave;

    // Sharp glow line
    float core = smoothstep(0.008, 0.0, abs(y));
    float glow = smoothstep(0.06, 0.0, abs(y)) * 0.4;
    float outerGlow = smoothstep(0.15, 0.0, abs(y)) * 0.1;

    return core + glow + outerGlow;
  }

  void main() {
    vec2 uv = vUv;
    // Correct for aspect ratio (assume ~16:9)
    uv.x *= 1.7778;
    vec2 mouse = uMouse;
    mouse.x *= 1.7778;

    float t = uTime;
    vec3 color = BG;

    // Unified waveform (visible when uStemSplit < 1)
    float unified = waveform(uv, 0.5, t, 2.0, 0.05, mouse);
    vec3 unifiedColor = CYAN * unified;

    // Split waveforms — each at different y positions with distinct frequencies
    // Stagger: vocal first, then guitar, bass, drums
    float s1 = smoothstep(0.0, 0.3, uStemProgress); // vocal
    float s2 = smoothstep(0.1, 0.4, uStemProgress); // guitar
    float s3 = smoothstep(0.2, 0.5, uStemProgress); // bass
    float s4 = smoothstep(0.3, 0.6, uStemProgress); // drums

    float vocalW  = waveform(uv, 0.65, t * 1.1, 3.0, 0.04, mouse);
    float guitarW = waveform(uv, 0.55, t * 0.9, 2.5, 0.035, mouse);
    float bassW   = waveform(uv, 0.45, t * 0.7, 1.8, 0.05, mouse);
    float drumsW  = waveform(uv, 0.35, t * 1.3, 4.0, 0.03, mouse);

    vec3 splitColor = CYAN * vocalW * s1
                    + GOLD * guitarW * s2
                    + PURPLE * bassW * s3
                    + GREEN * drumsW * s4;

    // Blend between unified and split
    color += mix(unifiedColor, splitColor, uStemSplit);

    // Subtle background gradient — slightly lighter at center
    float vignette = 1.0 - smoothstep(0.3, 1.2, length(vUv - 0.5));
    color += BG * vignette * 0.15;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function WaveformMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseCoordinates = useAppStore((s) => s.mouseCoordinates);
  const demoLinkPasted = useAppStore((s) => s.demoLinkPasted);
  const splitStartTime = useRef<number | null>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uStemSplit: { value: 0 },
      uStemProgress: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    // Normalize mouse to 0-1 range
    const mx = mouseCoordinates.x / (typeof window !== "undefined" ? window.innerWidth : 1);
    const my = 1.0 - mouseCoordinates.y / (typeof window !== "undefined" ? window.innerHeight : 1);
    uniforms.uMouse.value.set(mx, my);

    // Stem separation animation
    if (demoLinkPasted) {
      if (splitStartTime.current === null) {
        splitStartTime.current = elapsed;
      }
      const splitElapsed = elapsed - splitStartTime.current;
      // Delay split by 3s (progress bar duration), then animate over 1.2s
      const delay = 3.0;
      const duration = 1.2;
      const progress = Math.min(Math.max((splitElapsed - delay) / duration, 0), 1);
      uniforms.uStemSplit.value = progress;
      uniforms.uStemProgress.value = progress;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 1] }}
        style={{ background: "#0A0A0F" }}
        dpr={[1, 2]}
      >
        <WaveformMesh />
      </Canvas>
    </div>
  );
}
