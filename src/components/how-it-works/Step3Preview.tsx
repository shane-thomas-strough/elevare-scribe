"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { AUDIO } from "@/config/audio";

const KEY_NAMES = ["Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B", "C", "C#", "D", "Eb"];
// Slider range: -6 to +6, index 0..12 maps to KEY_NAMES

// Note step/octave pairs for transposition
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function stepToChromatic(step: string, alter: number): number {
  const base = CHROMATIC.indexOf(step);
  return base >= 0 ? (base + alter + 12) % 12 : 0;
}

function chromaticToStep(idx: number): { step: string; alter: number } {
  const map: { step: string; alter: number }[] = [
    { step: "C", alter: 0 }, { step: "C", alter: 1 }, { step: "D", alter: 0 },
    { step: "D", alter: 1 }, { step: "E", alter: 0 }, { step: "F", alter: 0 },
    { step: "F", alter: 1 }, { step: "G", alter: 0 }, { step: "G", alter: 1 },
    { step: "A", alter: 0 }, { step: "A", alter: 1 }, { step: "B", alter: 0 },
  ];
  return map[idx % 12] ?? { step: "C", alter: 0 };
}

function transposeMusicXML(xml: string, semitones: number): string {
  if (semitones === 0) return xml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  // Transpose key signature
  const keyElems = doc.querySelectorAll("fifths");
  keyElems.forEach((el) => {
    const orig = parseInt(el.textContent || "0");
    // Shift fifths by semitones (approximate: each semitone ~= 7/12 fifths)
    const newFifths = ((orig + semitones * 7) % 12 + 18) % 12 - 6;
    el.textContent = String(newFifths);
  });

  // Transpose all notes
  const notes = doc.querySelectorAll("note");
  notes.forEach((note) => {
    const pitchEl = note.querySelector("pitch");
    if (!pitchEl) return;
    const stepEl = pitchEl.querySelector("step");
    const octaveEl = pitchEl.querySelector("octave");
    const alterEl = pitchEl.querySelector("alter");
    if (!stepEl || !octaveEl) return;

    const step = stepEl.textContent || "C";
    const octave = parseInt(octaveEl.textContent || "4");
    const alter = alterEl ? parseInt(alterEl.textContent || "0") : 0;

    const chromIdx = stepToChromatic(step, alter);
    const newChrom = (chromIdx + semitones + 120) % 12;
    const newOctave = octave + Math.floor((chromIdx + semitones) / 12);
    const { step: newStep, alter: newAlter } = chromaticToStep(newChrom);

    stepEl.textContent = newStep;
    octaveEl.textContent = String(newOctave);

    if (newAlter !== 0) {
      if (alterEl) {
        alterEl.textContent = String(newAlter);
      } else {
        const newAlterEl = doc.createElement("alter");
        newAlterEl.textContent = String(newAlter);
        pitchEl.insertBefore(newAlterEl, octaveEl);
      }
    } else if (alterEl) {
      alterEl.remove();
    }
  });

  // Transpose harmony root
  const roots = doc.querySelectorAll("root root-step");
  roots.forEach((el) => {
    const step = el.textContent || "C";
    const chromIdx = CHROMATIC.indexOf(step);
    if (chromIdx >= 0) {
      const newChrom = (chromIdx + semitones + 120) % 12;
      el.textContent = CHROMATIC[newChrom] ?? "C";
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

export default function Step3Preview() {
  const [sliderValue, setSliderValue] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [originalXml, setOriginalXml] = useState<string | null>(null);
  const setCurrentPitchShift = useAppStore((s) => s.setCurrentPitchShift);
  const setAudioContextStarted = useAppStore((s) => s.setAudioContextStarted);

  const osmdContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const osmdRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tonePlayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pitchShiftRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Load MusicXML
  useEffect(() => {
    fetch("/musicxml/no-hay-quizas-demo.xml")
      .then((r) => r.text())
      .then((xml) => {
        if (mountedRef.current) setOriginalXml(xml);
      });
    return () => { mountedRef.current = false; };
  }, []);

  // Initialize OSMD
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!originalXml || !osmdContainerRef.current) return;

    let cancelled = false;
    import("opensheetmusicdisplay").then(({ OpenSheetMusicDisplay }) => {
      if (cancelled || !osmdContainerRef.current) return;
      const osmd = new OpenSheetMusicDisplay(osmdContainerRef.current, {
        backend: "svg",
        drawTitle: false,
        drawComposer: false,
        drawCredits: false,
        autoResize: true,
      });
      osmdRef.current = osmd;
      osmd.load(originalXml).then(() => {
        if (!cancelled) osmd.render();
      });
    });

    return () => { cancelled = true; };
  }, [originalXml]);

  // Re-render OSMD when slider changes
  useEffect(() => {
    if (!originalXml || !osmdRef.current) return;
    const transposed = transposeMusicXML(originalXml, sliderValue);
    osmdRef.current.load(transposed).then(() => {
      osmdRef.current.render();
    });
  }, [sliderValue, originalXml]);

  // Initialize Tone.js audio
  const initAudio = useCallback(async () => {
    if (tonePlayerRef.current) return;
    const Tone = await import("tone");
    await Tone.start();
    setAudioContextStarted(true);

    const pitchShift = new Tone.PitchShift({ pitch: 0 }).toDestination();
    const player = new Tone.Player({
      url: AUDIO.NO_HAY_QUIZAS,
      loop: true,
    }).connect(pitchShift);

    pitchShiftRef.current = pitchShift;
    tonePlayerRef.current = player;
  }, [setAudioContextStarted]);

  // Update pitch shift
  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = sliderValue;
    }
    setCurrentPitchShift(sliderValue);
  }, [sliderValue, setCurrentPitchShift]);

  // Cleanup
  useEffect(() => {
    return () => {
      tonePlayerRef.current?.stop();
      tonePlayerRef.current?.dispose();
      pitchShiftRef.current?.dispose();
      tonePlayerRef.current = null;
      pitchShiftRef.current = null;
    };
  }, []);

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSliderValue(val);

    // Start audio on first interaction
    if (!tonePlayerRef.current) {
      await initAudio();
    }
    if (tonePlayerRef.current && tonePlayerRef.current.loaded && !isPlaying) {
      tonePlayerRef.current.start();
      setIsPlaying(true);
    }
  };

  const currentKeyName = KEY_NAMES[sliderValue + 6] || "A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full"
    >
      {/* Slider */}
      <div className="px-4 py-4 border-b border-es-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-es-text-secondary text-xs font-inter">Transpose</span>
          <span className="text-es-cyan font-clash font-bold text-lg">
            Key of {currentKeyName}
          </span>
        </div>
        <input
          type="range"
          min={-6}
          max={6}
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #7B2FBE, #00D4FF ${((sliderValue + 6) / 12) * 100}%, #1A1A28 ${((sliderValue + 6) / 12) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-es-text-tertiary text-[10px] font-mono">-6</span>
          <span className="text-es-text-tertiary text-[10px] font-mono">0</span>
          <span className="text-es-text-tertiary text-[10px] font-mono">+6</span>
        </div>
        {isPlaying && (
          <p className="text-es-cyan text-xs font-inter mt-2 text-center animate-pulse">
            Drag the slider — hear the song shift in real time
          </p>
        )}
        {!isPlaying && (
          <p className="text-es-text-tertiary text-xs font-inter mt-2 text-center">
            Drag to transpose — audio plays automatically
          </p>
        )}
      </div>

      {/* OSMD Sheet Music */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div
          ref={osmdContainerRef}
          className="w-full min-h-[160px] [&_svg]:w-full"
          style={{
            filter: "invert(1) hue-rotate(180deg) brightness(0.85)",
          }}
        />
      </div>

      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00D4FF;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00D4FF;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </motion.div>
  );
}
