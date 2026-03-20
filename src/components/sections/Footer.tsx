"use client";

import { motion } from "framer-motion";

const productLinks = [
  "Features",
  "How It Works",
  "Pricing",
  "For Artists",
  "Roadmap",
] as const;

const companyLinks = ["About", "Blog", "Press", "Contact"] as const;

const legalLinks = [
  "Privacy Policy",
  "Terms of Service",
  "Cookie Policy",
] as const;

const socialLinks = [
  { name: "Twitter/X", href: "/" },
  { name: "Instagram", href: "/" },
  { name: "YouTube", href: "/" },
  { name: "Discord", href: "/" },
] as const;

function LinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: readonly string[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-medium uppercase tracking-wider text-es-text-tertiary">
        {heading}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link}>
            <a
              href="/"
              className="text-sm text-es-text-secondary transition-colors hover:text-es-cyan"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full border-t border-white/[0.05] px-4 pb-8 pt-16"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        {/* Column 1: Wordmark & tagline */}
        <div>
          <span className="font-clash text-xl font-bold text-es-text-primary">
            Elevare Scribe
          </span>
          <p className="mt-2 text-sm text-es-text-secondary">
            From Suno to Stage. In One App.
          </p>
        </div>

        {/* Column 2: Product */}
        <LinkColumn heading="Product" links={productLinks} />

        {/* Column 3: Company */}
        <LinkColumn heading="Company" links={companyLinks} />

        {/* Column 4: Legal */}
        <LinkColumn heading="Legal" links={legalLinks} />
      </div>

      {/* Social icons row */}
      <div className="mx-auto mt-12 mb-8 flex max-w-6xl items-center justify-center gap-6">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.href}
            className="text-sm text-es-text-secondary transition-colors hover:text-es-cyan"
          >
            {social.name}
          </a>
        ))}
      </div>

      {/* Soul line */}
      <motion.p
        className="mt-8 text-center font-cormorant text-[22px] italic text-es-text-secondary"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        You made the song. Now live it.
      </motion.p>

      {/* Copyright */}
      <p className="mt-4 text-center text-xs text-es-text-tertiary">
        &copy; 2026 Elevare Edge LLC. All rights reserved.
      </p>
    </footer>
  );
}
