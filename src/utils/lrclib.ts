import { platform } from "os";

export interface LrcLibTrack {
  id: number;
  name: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}


const BASE_URL = "https://lrclib.net/api";

const osPlatform = platform();

if (osPlatform === "win32") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}


export async function getLyrics(
  trackName: string,
  artistName: string,
  albumName: string,
  duration: number,
): Promise<LrcLibTrack | null> {
  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
      album_name: albumName,
      duration: duration.toString(),
    });

    const url = `${BASE_URL}/get?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`LRCLIB API error: ${response.statusText}`);
    }

    return (await response.json()) as LrcLibTrack;
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return null;
  }
}

export async function searchLyrics(query: string): Promise<LrcLibTrack[]> {
  try {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${BASE_URL}/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`LRCLIB API error: ${response.statusText}`);
    }
    return (await response.json()) as LrcLibTrack[];
  } catch (error) {
    console.error("Error searching lyrics:", error);
    return [];
  }
}

export interface LrcLine {
  time: number;
  text: string;
}

export function parseLrc(lrc: string): LrcLine[] {
  const lines = lrc.split("\n");
  const result: LrcLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, "").trim();
      result.push({ time, text });
    }
  }

  return result;
}

export function formatLyrics(lrc: string): string {
  // Remove timestamps
  const noTimestamps = lrc.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "");

  // Clean up extra whitespace and ensure consistent newlines
  return noTimestamps
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n\n"); // Double newline for better readability in Raycast markdown
}
