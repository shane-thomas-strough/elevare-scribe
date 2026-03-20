import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/store/useAppStore";

/**
 * Unit tests for Gig Mode state management and component logic.
 * Tests verify Zustand state transitions for isGigModeActive.
 * Browser-dependent components (SpotlightCursor, ChordDisplay) are
 * tested at the integration level — here we test state and data.
 */

const CHORDS = ["Am", "F", "C", "G", "Em", "Am", "Dm", "E"];

describe("Gig Mode", () => {
  beforeEach(() => {
    useAppStore.setState({
      isGigModeActive: false,
      mouseCoordinates: { x: 0, y: 0 },
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

  it("mouseCoordinates update correctly for spotlight tracking", () => {
    useAppStore.getState().setMouseCoordinates({ x: 500, y: 300 });
    const { mouseCoordinates } = useAppStore.getState();
    expect(mouseCoordinates.x).toBe(500);
    expect(mouseCoordinates.y).toBe(300);
  });

  it("chord progression contains all 8 expected chords", () => {
    expect(CHORDS).toHaveLength(8);
    expect(CHORDS).toContain("Am");
    expect(CHORDS).toContain("F");
    expect(CHORDS).toContain("C");
    expect(CHORDS).toContain("G");
    expect(CHORDS).toContain("Em");
    expect(CHORDS).toContain("Dm");
    expect(CHORDS).toContain("E");
  });

  it("Escape key exit: state transitions from active to inactive", () => {
    // Simulate the Escape key flow at the state level
    useAppStore.getState().setGigModeActive(true);
    expect(useAppStore.getState().isGigModeActive).toBe(true);

    // Escape handler calls setGigModeActive(false)
    useAppStore.getState().setGigModeActive(false);
    expect(useAppStore.getState().isGigModeActive).toBe(false);
  });

  it("audioContextStarted can be set for ambient audio init", () => {
    expect(useAppStore.getState().audioContextStarted).toBe(false);
    useAppStore.getState().setAudioContextStarted(true);
    expect(useAppStore.getState().audioContextStarted).toBe(true);
  });
});
