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
 * Parses error messages into user-friendly text
 */
function parseErrorMessage(detail: string): string {
  const lowerDetail = detail.toLowerCase();

  // YouTube-related errors
  if (lowerDetail.includes("video unavailable") || lowerDetail.includes("private video")) {
    return "This video is unavailable or private. Please try a different video.";
  }
  if (lowerDetail.includes("age-restricted") || lowerDetail.includes("sign in to confirm")) {
    return "This video is age-restricted and cannot be processed.";
  }
  if (lowerDetail.includes("copyright") || lowerDetail.includes("blocked")) {
    return "This video is blocked due to copyright restrictions.";
  }
  if (lowerDetail.includes("live stream") || lowerDetail.includes("premiere")) {
    return "Live streams and premieres cannot be separated. Wait until the video is fully uploaded.";
  }
  if (lowerDetail.includes("no video formats") || lowerDetail.includes("unable to extract")) {
    return "Could not extract audio from this video. It may be restricted or unavailable.";
  }

  // Network/server errors
  if (lowerDetail.includes("timeout") || lowerDetail.includes("timed out")) {
    return "Request timed out. The video might be too long. Try a shorter video (under 10 minutes).";
  }
  if (lowerDetail.includes("connection") || lowerDetail.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  // Default: return original message or generic
  return detail || "An unexpected error occurred. Please try again.";
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
    throw new Error(parseErrorMessage(error.detail));
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

/**
 * YouTube video metadata from oEmbed API
 */
export interface YouTubeMetadata {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

/**
 * Fetches YouTube video metadata using noembed (CORS-friendly oEmbed proxy).
 *
 * @param url - YouTube video URL
 * @returns Video metadata or null if not found
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.error) return null;

    return {
      title: data.title,
      author_name: data.author_name,
      thumbnail_url: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}
