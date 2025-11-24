export interface TrackInfo {
  name: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  position: number; // in seconds
  state: "playing" | "paused" | "stopped";
  app: "Spotify" | "Music";
  artwork_url?: string;
}
