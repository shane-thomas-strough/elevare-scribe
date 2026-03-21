"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "For Artists", href: "#artists" },
] as const;

/**
 * NavBar — sticky navigation with glass morphism, scroll progress bar,
 * smooth-scrolling anchor links, and wired CTAs.
 *
 * - Nav links scroll to section IDs via smooth scrollIntoView
 * - "Sign In" routes to /login
 * - "Apply for Founding Artist Access" opens the waitlist modal via Zustand
 * - Mobile: hamburger → full-screen overlay with same wiring
 */
export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const openWaitlistModal = useAppStore((s) => s.openWaitlistModal);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 80);

      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = docHeight - winHeight;
      const progress = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /** Smooth-scroll to a section ID, accounting for navbar height */
  const scrollToSection = useCallback(
    (href: string) => {
      setMenuOpen(false);
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        const navHeight = 80;
        const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: "smooth" });
      }
    },
    []
  );

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(10,10,15,0.8)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid transparent",
        }}
      >
        {/* Scroll progress bar */}
        <div
          className="absolute left-0 top-0 h-[2px] bg-es-cyan"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          {/* Left: Wordmark */}
          <span className="font-clash text-lg font-bold text-es-text-primary">
            Elevare Scribe
          </span>

          {/* Center: Nav links with smooth scroll (hidden on mobile) */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollToSection(link.href)}
                className="text-sm text-es-text-secondary transition-colors hover:text-es-cyan"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right: Buttons */}
          <div className="flex items-center gap-3">
            {/* Sign In → /login */}
            <a
              href="/login"
              className="hidden rounded-lg border border-es-text-tertiary/30 px-4 py-1.5 text-sm text-es-text-secondary transition-colors hover:border-es-cyan/40 hover:text-es-text-primary md:inline-block"
            >
              Sign In
            </a>

            {/* Primary CTA → waitlist modal */}
            <button
              type="button"
              onClick={openWaitlistModal}
              className="hidden rounded-lg bg-es-cyan px-4 py-1.5 text-sm font-medium text-es-bg-primary transition-opacity hover:opacity-90 sm:inline-block"
            >
              Apply for Founding Artist Access
            </button>

            {/* Mobile hamburger */}
            <button
              className="flex flex-col items-center justify-center gap-1.5 p-2 md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="block h-[2px] w-5 bg-es-text-primary" />
              <span className="block h-[2px] w-5 bg-es-text-primary" />
              <span className="block h-[2px] w-5 bg-es-text-primary" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-es-bg-primary"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex h-16 items-center justify-between px-4 sm:px-8">
              <span className="font-clash text-lg font-bold text-es-text-primary">
                Elevare Scribe
              </span>
              <button
                className="p-2 text-es-text-primary"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="font-clash text-2xl font-medium text-es-text-secondary transition-colors hover:text-es-cyan"
                  onClick={() => scrollToSection(link.href)}
                >
                  {link.label}
                </button>
              ))}

              <div className="mt-8 flex flex-col items-center gap-4">
                <a
                  href="/login"
                  className="rounded-lg border border-es-text-tertiary/30 px-6 py-2 text-sm text-es-text-secondary transition-colors hover:border-es-cyan/40 hover:text-es-text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </a>
                <button
                  type="button"
                  className="rounded-lg bg-es-cyan px-6 py-2 text-sm font-medium text-es-bg-primary transition-opacity hover:opacity-90"
                  onClick={() => {
                    setMenuOpen(false);
                    openWaitlistModal();
                  }}
                >
                  Apply for Founding Artist Access
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
