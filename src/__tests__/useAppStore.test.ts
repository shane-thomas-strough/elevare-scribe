import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/store/useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      audioContextStarted: false,
      currentStemVolumes: { vocal: 1, guitar: 1, bass: 1, drums: 1 },
      isGigModeActive: false,
      mouseCoordinates: { x: 0, y: 0 },
      currentPitchShift: 0,
      demoLinkPasted: false,
      activeStemVisualization: [],
    });
  });

  it("initializes with correct defaults", () => {
    const state = useAppStore.getState();
    expect(state.audioContextStarted).toBe(false);
    expect(state.isGigModeActive).toBe(false);
    expect(state.currentPitchShift).toBe(0);
    expect(state.demoLinkPasted).toBe(false);
    expect(state.currentStemVolumes).toEqual({ vocal: 1, guitar: 1, bass: 1, drums: 1 });
    expect(state.mouseCoordinates).toEqual({ x: 0, y: 0 });
    expect(state.activeStemVisualization).toEqual([]);
  });

  it("setAudioContextStarted updates state", () => {
    useAppStore.getState().setAudioContextStarted(true);
    expect(useAppStore.getState().audioContextStarted).toBe(true);
  });

  it("setStemVolume updates individual stem", () => {
    useAppStore.getState().setStemVolume("vocal", 0.5);
    const vols = useAppStore.getState().currentStemVolumes;
    expect(vols.vocal).toBe(0.5);
    expect(vols.guitar).toBe(1);
  });

  it("setGigModeActive updates state", () => {
    useAppStore.getState().setGigModeActive(true);
    expect(useAppStore.getState().isGigModeActive).toBe(true);
  });

  it("setMouseCoordinates updates state", () => {
    useAppStore.getState().setMouseCoordinates({ x: 100, y: 200 });
    expect(useAppStore.getState().mouseCoordinates).toEqual({ x: 100, y: 200 });
  });

  it("setCurrentPitchShift updates state", () => {
    useAppStore.getState().setCurrentPitchShift(3);
    expect(useAppStore.getState().currentPitchShift).toBe(3);
  });

  it("setDemoLinkPasted updates state", () => {
    useAppStore.getState().setDemoLinkPasted(true);
    expect(useAppStore.getState().demoLinkPasted).toBe(true);
  });

  it("setActiveStemVisualization updates state", () => {
    useAppStore.getState().setActiveStemVisualization(["vocal", "drums"]);
    expect(useAppStore.getState().activeStemVisualization).toEqual(["vocal", "drums"]);
  });
});
