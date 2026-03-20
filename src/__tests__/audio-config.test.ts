import { describe, it, expect } from "vitest";
import { AUDIO } from "@/config/audio";

describe("Audio config", () => {
  it("exports all three track URLs", () => {
    expect(AUDIO.NO_HAY_QUIZAS).toBeDefined();
    expect(AUDIO.HAMMOCKS).toBeDefined();
    expect(AUDIO.DOUBLE_OVERHEAD).toBeDefined();
  });

  it("all URLs point to R2", () => {
    const r2Domain = "pub-b645bb3d6f0e4603b252db4c142a9f8f.r2.dev";
    expect(AUDIO.NO_HAY_QUIZAS).toContain(r2Domain);
    expect(AUDIO.HAMMOCKS).toContain(r2Domain);
    expect(AUDIO.DOUBLE_OVERHEAD).toContain(r2Domain);
  });

  it("all URLs are .wav files", () => {
    expect(AUDIO.NO_HAY_QUIZAS).toMatch(/\.wav$/);
    expect(AUDIO.HAMMOCKS).toMatch(/\.wav$/);
    expect(AUDIO.DOUBLE_OVERHEAD).toMatch(/\.wav$/);
  });
});
