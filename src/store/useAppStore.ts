import { create } from "zustand";

interface StemVolumes {
  vocal: number;
  guitar: number;
  bass: number;
  drums: number;
}

interface MouseCoordinates {
  x: number;
  y: number;
}

interface AppState {
  audioContextStarted: boolean;
  currentStemVolumes: StemVolumes;
  isGigModeActive: boolean;
  mouseCoordinates: MouseCoordinates;
  currentPitchShift: number;
  demoLinkPasted: boolean;
  activeStemVisualization: string[];
  isWaitlistModalOpen: boolean;

  setAudioContextStarted: (started: boolean) => void;
  setStemVolume: (stem: keyof StemVolumes, volume: number) => void;
  setGigModeActive: (active: boolean) => void;
  setMouseCoordinates: (coords: MouseCoordinates) => void;
  setCurrentPitchShift: (shift: number) => void;
  setDemoLinkPasted: (pasted: boolean) => void;
  setActiveStemVisualization: (stems: string[]) => void;
  openWaitlistModal: () => void;
  closeWaitlistModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  audioContextStarted: false,
  currentStemVolumes: { vocal: 1, guitar: 1, bass: 1, drums: 1 },
  isGigModeActive: false,
  mouseCoordinates: { x: 0, y: 0 },
  currentPitchShift: 0,
  demoLinkPasted: false,
  activeStemVisualization: [],
  isWaitlistModalOpen: false,

  setAudioContextStarted: (started) => set({ audioContextStarted: started }),
  setStemVolume: (stem, volume) =>
    set((state) => ({
      currentStemVolumes: { ...state.currentStemVolumes, [stem]: volume },
    })),
  setGigModeActive: (active) => set({ isGigModeActive: active }),
  setMouseCoordinates: (coords) => set({ mouseCoordinates: coords }),
  setCurrentPitchShift: (shift) => set({ currentPitchShift: shift }),
  setDemoLinkPasted: (pasted) => set({ demoLinkPasted: pasted }),
  setActiveStemVisualization: (stems) =>
    set({ activeStemVisualization: stems }),
  openWaitlistModal: () => set({ isWaitlistModalOpen: true }),
  closeWaitlistModal: () => set({ isWaitlistModalOpen: false }),
}));
