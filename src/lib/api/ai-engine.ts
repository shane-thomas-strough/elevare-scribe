/**
 * Elevare AI Engine API Client
 *
 * Handles communication with the GPU-accelerated audio stem separation service.
 * The AI Engine uses Demucs to separate audio into vocals, drums, bass, and other stems.
 */

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000";

/**
 * Request payload for audio separation
 */
export interface SeparationRequest {
  /** Full YouTube video URL */
  youtube_url: string;
  /** Unique identifier for this separation job */
  track_id: string;
}

/**
 * Response from a successful separation
 */
export interface SeparationResponse {
  status: "success";
  track_id: string;
  processing_time_seconds: number;
  stem_urls: {
    vocals: string;
    drums: string;
    bass: string;
    other: string;
  };
}

/**
 * Error response from the AI Engine
 */
export interface SeparationError {
  detail: string;
}

/**
 * Separates audio from a YouTube video into individual stems.
 *
 * @param youtubeUrl - Full YouTube video URL
 * @param trackId - Unique identifier for this job (used in output paths)
 * @returns Promise resolving to stem URLs or throwing on error
 *
 * @example
 * ```ts
 * const result = await separateAudio(
 *   "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
 *   "my-track-001"
 * );
 * console.log(result.stem_urls.vocals);
 * ```
 */
export async function separateAudio(
  youtubeUrl: string,
  trackId: string
): Promise<SeparationResponse> {
  const response = await fetch(`${AI_ENGINE_URL}/api/separate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      youtube_url: youtubeUrl,
      track_id: trackId,
    } satisfies SeparationRequest),
  });

  if (!response.ok) {
    const error: SeparationError = await response.json();
    throw new Error(error.detail || "Failed to separate audio");
  }

  return response.json();
}

/**
 * Generates a unique track ID for a separation job.
 * Uses timestamp + random string for uniqueness.
 */
export function generateTrackId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `track-${timestamp}-${random}`;
}

/**
 * Validates a YouTube URL format.
 *
 * @param url - URL to validate
 * @returns true if valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
  ];
  return patterns.some((pattern) => pattern.test(url));
}
