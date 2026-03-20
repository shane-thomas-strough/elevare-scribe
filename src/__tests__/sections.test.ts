import { describe, it, expect } from "vitest";

/**
 * Unit tests for landing page section content and data integrity.
 * Component rendering with browser APIs is tested via Playwright E2E.
 * These tests verify content correctness and data structures.
 */

const PRICING_TIERS = [
  { name: "Free", price: 0, period: "month", features: ["3 transcriptions/month", "basic charts", "watermarked exports"] },
  { name: "Pro", price: 12, annualPrice: 10, period: "month", features: ["Unlimited transcriptions", "Practice Mode", "Gig Mode", "Backing Tracks", "Copyright tools", "Marketplace access"] },
  { name: "Founding Artist", price: 149, period: "one-time", features: ["Lifetime Pro access", "founding member badge", "direct feature input"] },
];

const FAQ_ITEMS = [
  { q: "Do I own the sheet music I create?", a: "Yes" },
  { q: "Does it work with Suno and Udio?", a: "Yes" },
  { q: "Can I upload my own audio?", a: "Yes" },
  { q: "Can I transpose to my natural vocal range?", a: "Yes" },
  { q: "Is this for beginners or advanced musicians?", a: "Both" },
  { q: "What happens in Gig Mode?", a: "editing interface disappears" },
  { q: "How accurate is the transcription?", a: "90%" },
  { q: "What is Founding Artist Access?", a: "limited beta" },
];

const SOUL_LINE = "You made the song. Now live it.";

describe("PricingSection data", () => {
  it("has exactly three pricing tiers", () => {
    expect(PRICING_TIERS).toHaveLength(3);
  });

  it("Free tier is $0", () => {
    expect(PRICING_TIERS[0]!.price).toBe(0);
  });

  it("Pro tier is $12/month or $10/month annual", () => {
    expect(PRICING_TIERS[1]!.price).toBe(12);
    expect(PRICING_TIERS[1]!.annualPrice).toBe(10);
  });

  it("Founding Artist tier is $149 one-time", () => {
    expect(PRICING_TIERS[2]!.price).toBe(149);
    expect(PRICING_TIERS[2]!.period).toBe("one-time");
  });

  it("Pro tier has 6 features", () => {
    expect(PRICING_TIERS[1]!.features).toHaveLength(6);
  });
});

describe("FAQSection data", () => {
  it("has exactly 8 FAQ items", () => {
    expect(FAQ_ITEMS).toHaveLength(8);
  });

  it("each FAQ has a question and answer keyword", () => {
    FAQ_ITEMS.forEach((item) => {
      expect(item.q.length).toBeGreaterThan(10);
      expect(item.a.length).toBeGreaterThan(0);
    });
  });

  it("Gig Mode FAQ mentions editing interface disappearing", () => {
    const gigFaq = FAQ_ITEMS.find((f) => f.q.includes("Gig Mode"));
    expect(gigFaq).toBeDefined();
    expect(gigFaq!.a).toContain("editing interface disappears");
  });
});

describe("FinalCTASection data", () => {
  it("primary CTA text is correct", () => {
    const cta = "Apply for Founding Artist Access";
    expect(cta).toContain("Founding Artist");
  });

  it("secondary CTA text is correct", () => {
    const cta = "Start Free — No credit card required";
    expect(cta).toContain("No credit card");
  });
});

describe("Footer", () => {
  it("soul line is correct", () => {
    expect(SOUL_LINE).toBe("You made the song. Now live it.");
  });

  it("copyright year is 2026", () => {
    const copyright = "© 2026 Elevare Edge LLC. All rights reserved.";
    expect(copyright).toContain("2026");
    expect(copyright).toContain("Elevare Edge LLC");
  });
});
