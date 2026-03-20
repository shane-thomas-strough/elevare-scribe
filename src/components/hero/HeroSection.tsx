"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import HeroOverlay from "./HeroOverlay";
import WebGLFallback from "./WebGLFallback";
import { useAppStore } from "@/store/useAppStore";

// Dynamic import to avoid SSR issues with Three.js
const HeroCanvas = dynamic(
  () => import("./HeroCanvas").catch(() => {
    // Return a component that signals failure via an error prop
    return { default: () => <CanvasLoadError /> };
  }),
  {
    ssr: false,
    loading: () => <WebGLFallback />,
  },
);

// Sentinel component rendered when dynamic import fails
function CanvasLoadError() {
  return <div data-canvas-error="true" style={{ display: "none" }} />;
}

export default function HeroSection() {
  const setMouseCoordinates = useAppStore((s) => s.setMouseCoordinates);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [canvasFailed, setCanvasFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Detect if HeroCanvas failed to load by checking for the sentinel element
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new MutationObserver(() => {
      if (sectionRef.current?.querySelector("[data-canvas-error]")) {
        setCanvasFailed(true);
      }
    });
    observer.observe(sectionRef.current, { childList: true, subtree: true });
    // Also check immediately
    if (sectionRef.current.querySelector("[data-canvas-error]")) {
      setCanvasFailed(true);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    // Throttle updates to animation frames — spread to create a new
    // object reference each frame so Zustand detects the state change
    const updateStore = () => {
      setMouseCoordinates({ x: mouseRef.current.x, y: mouseRef.current.y });
      rafRef.current = requestAnimationFrame(updateStore);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(updateStore);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [setMouseCoordinates]);

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden">
      {canvasFailed ? <WebGLFallback /> : <HeroCanvas />}
      <HeroOverlay />
    </section>
  );
}
