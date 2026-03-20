"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import HeroOverlay from "./HeroOverlay";
import { useAppStore } from "@/store/useAppStore";

// Dynamic import to avoid SSR issues with Three.js
const HeroCanvas = dynamic(() => import("./HeroCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 w-full h-full bg-es-bg-primary" />
  ),
});

export default function HeroSection() {
  const setMouseCoordinates = useAppStore((s) => s.setMouseCoordinates);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    // Throttle updates to animation frames
    const updateStore = () => {
      setMouseCoordinates(mouseRef.current);
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
    <section className="relative w-full h-screen overflow-hidden">
      <HeroCanvas />
      <HeroOverlay />
    </section>
  );
}
