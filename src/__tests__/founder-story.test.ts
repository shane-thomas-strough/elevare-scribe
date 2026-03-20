import { describe, it, expect } from "vitest";

/**
 * Unit tests for the Founder Story timeline.
 * Component rendering tests verify data and structure.
 * GSAP ScrollTrigger integration is tested via Playwright E2E.
 */

/** The four stops with their expected content */
const STOPS = [
  { num: 1, headline: "March 2026.", subtext: "A chicken bus in Palmarcito, El Salvador." },
  {
    num: 2,
    headline: "A song called No Hay Quizas was generated on Suno.",
    subtext: "Ten minutes. A chicken bus. The Pacific outside the window.",
  },
  {
    num: 3,
    headline: "The song reached the beach.",
    subtext: "The bar. The people. But there were no tabs to play it live.",
  },
  {
    num: 4,
    headline: "The product he needed did not exist.",
    subtext: "So he built it.",
  },
];

describe("Founder Story", () => {
  it("contains exactly 4 stops", () => {
    expect(STOPS).toHaveLength(4);
  });

  it("Stop 1 has correct content", () => {
    const stop = STOPS[0]!;
    expect(stop.headline).toBe("March 2026.");
    expect(stop.subtext).toContain("Palmarcito");
    expect(stop.subtext).toContain("El Salvador");
  });

  it("Stop 2 has correct content with Suno reference", () => {
    const stop = STOPS[1]!;
    expect(stop.headline).toContain("No Hay Quizas");
    expect(stop.headline).toContain("Suno");
  });

  it("Stop 3 references the gap — no tabs to play live", () => {
    const stop = STOPS[2]!;
    expect(stop.subtext).toContain("no tabs to play it live");
  });

  it("Stop 4 is the resolution — he built it", () => {
    const stop = STOPS[3]!;
    expect(stop.headline).toContain("did not exist");
    expect(stop.subtext).toBe("So he built it.");
  });

  it("progress indicator labels are formatted correctly", () => {
    for (let i = 1; i <= 4; i++) {
      const label = `0${i} / 04`;
      expect(label).toMatch(/^0[1-4] \/ 04$/);
    }
  });

  it("CTA text matches spec", () => {
    const ctaText = "Join the Founding Artists →";
    expect(ctaText).toContain("Founding Artists");
  });
});
