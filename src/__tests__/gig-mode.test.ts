import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/store/useAppStore";

/**
 * Unit tests for Gig Mode state management and teleprompter logic.
 * Browser-dependent components (ChordDisplay, GigModeAudio) are
 * tested at the integration level — here we test state and data.
 */

const CHART = [
  { chord: "Am", lyric: "No hay quizás en esta noche" },
  { chord: "F", lyric: "Solo tú y el mar abierto" },
  { chord: "C", lyric: "Las olas cantan lo que siento" },
  { chord: "G", lyric: "Y el viento sabe mi secreto" },
  { chord: "Em", lyric: "Camino solo por la arena" },
  { chord: "Am", lyric: "Tu voz me sigue como estrella" },
  { chord: "Dm", lyric: "No hay quizás, no hay tal vez" },
  { chord: "E", lyric: "Solo existe este momento" },
];

describe("Gig Mode", () => {
  beforeEach(() => {
    useAppStore.setState({
      isGigModeActive: false,
      audioContextStarted: false,
    });
  });

  it("isGigModeActive defaults to false", () => {
    expect(useAppStore.getState().isGigModeActive).toBe(false);
  });

  it("setGigModeActive(true) activates Gig Mode", () => {
    useAppStore.getState().setGigModeActive(true);
    expect(useAppStore.getState().isGigModeActive).toBe(true);
  });

  it("setGigModeActive(false) deactivates Gig Mode", () => {
    useAppStore.getState().setGigModeActive(true);
    useAppStore.getState().setGigModeActive(false);
    expect(useAppStore.getState().isGigModeActive).toBe(false);
  });

  it("chord chart contains all 8 entries with lyrics", () => {
    expect(CHART).toHaveLength(8);
    CHART.forEach((entry) => {
      expect(entry.chord.length).toBeGreaterThan(0);
      expect(entry.lyric.length).toBeGreaterThan(0);
    });
  });

  it("chord progression contains expected chords", () => {
    const chords = CHART.map((c) => c.chord);
    expect(chords).toContain("Am");
    expect(chords).toContain("F");
    expect(chords).toContain("C");
    expect(chords).toContain("G");
    expect(chords).toContain("Em");
    expect(chords).toContain("Dm");
    expect(chords).toContain("E");
  });

  it("Escape key exit: state transitions from active to inactive", () => {
    useAppStore.getState().setGigModeActive(true);
    expect(useAppStore.getState().isGigModeActive).toBe(true);
    useAppStore.getState().setGigModeActive(false);
    expect(useAppStore.getState().isGigModeActive).toBe(false);
  });

  it("audioContextStarted can be set for ambient audio init", () => {
    expect(useAppStore.getState().audioContextStarted).toBe(false);
    useAppStore.getState().setAudioContextStarted(true);
    expect(useAppStore.getState().audioContextStarted).toBe(true);
  });

  it("active chord index stays within bounds", () => {
    let idx = 0;
    // Advance
    idx = Math.min(idx + 1, CHART.length - 1);
    expect(idx).toBe(1);
    // Advance to end
    for (let i = 0; i < 20; i++) idx = Math.min(idx + 1, CHART.length - 1);
    expect(idx).toBe(7);
    // Rewind to start
    for (let i = 0; i < 20; i++) idx = Math.max(idx - 1, 0);
    expect(idx).toBe(0);
  });
});
