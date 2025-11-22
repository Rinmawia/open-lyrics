import { runAppleScript } from "@raycast/utils";

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

export async function getSpotifyTrack(): Promise<TrackInfo | null> {
  try {
    const script = `
      if application "Spotify" is running then
        tell application "Spotify"
          set playerState to player state as string
          if playerState is "playing" or playerState is "paused" then
            set trackName to name of current track
            set trackArtist to artist of current track
            set trackAlbum to album of current track
            set trackDuration to duration of current track / 1000
            set trackPosition to player position
            set trackArtwork to artwork url of current track
            return "{" & "\\"name\\": \\"" & trackName & "\\", \\"artist\\": \\"" & trackArtist & "\\", \\"album\\": \\"" & trackAlbum & "\\", \\"duration\\": " & trackDuration & ", \\"position\\": " & trackPosition & ", \\"state\\": \\"" & playerState & "\\", \\"app\\": \\"Spotify\\", \\"artwork_url\\": \\"" & trackArtwork & "\\"}"
          end if
        end tell
      end if
    `;
    const result = await runAppleScript(script);
    if (!result) return null;
    return JSON.parse(result);
  } catch {
    // console.error("Error getting Spotify track:", error);
    return null;
  }
}

export async function getAppleMusicTrack(): Promise<TrackInfo | null> {
  try {
    const script = `
      if application "Music" is running then
        tell application "Music"
          set playerState to player state as string
          if playerState is "playing" or playerState is "paused" then
            set trackName to name of current track
            set trackArtist to artist of current track
            set trackAlbum to album of current track
            set trackDuration to duration of current track
            set trackPosition to player position
            return "{" & "\\"name\\": \\"" & trackName & "\\", \\"artist\\": \\"" & trackArtist & "\\", \\"album\\": \\"" & trackAlbum & "\\", \\"duration\\": " & trackDuration & ", \\"position\\": " & trackPosition & ", \\"state\\": \\"" & playerState & "\\", \\"app\\": \\"Music\\"}"
          end if
        end tell
      end if
    `;
    const result = await runAppleScript(script);
    if (!result) return null;
    return JSON.parse(result);
  } catch {
    // console.error("Error getting Apple Music track:", error);
    return null;
  }
}

export async function getCurrentTrack(): Promise<TrackInfo | null> {
  const spotifyTrack = await getSpotifyTrack();
  if (spotifyTrack && spotifyTrack.state === "playing") {
    return spotifyTrack;
  }

  const appleMusicTrack = await getAppleMusicTrack();
  if (appleMusicTrack && appleMusicTrack.state === "playing") {
    return appleMusicTrack;
  }

  // If neither is playing, return paused one if available (prioritize Spotify)
  if (spotifyTrack) return spotifyTrack;
  if (appleMusicTrack) return appleMusicTrack;

  return null;
}
