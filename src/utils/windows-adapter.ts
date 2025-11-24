import { runPowerShellScript } from "@raycast/utils";
import { TrackInfo } from "./music-types";

const POWERSHELL_SCRIPT = `
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
$sessionManager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
$session = $sessionManager.GetCurrentSession()

if ($session) {
  $info = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
  $timeline = $session.GetTimelineProperties()
  $playbackInfo = $session.GetPlaybackInfo()

  $result = @{
    name = $info.Title
    artist = $info.Artist
    album = $info.AlbumTitle
    duration = $timeline.EndTime.TotalSeconds
    position = $timeline.Position.TotalSeconds
    state = $playbackInfo.PlaybackStatus.ToString().ToLower()
    app = $session.SourceAppUserModelId
    artwork_url = $info.Thumbnail
  }

  $result | ConvertTo-Json
}
`;

export async function getWindowsTrack(): Promise<TrackInfo | null> {
  try {
    const result = await runPowerShellScript(POWERSHELL_SCRIPT);

    if (!result.trim()) return null;

    const data = JSON.parse(result);

    // Map Windows app IDs to friendly names
    let appName: "Spotify" | "Music" = "Spotify"; // Default or fallback
    if (data.app.includes("Spotify")) appName = "Spotify";
    if (data.app.includes("Music") || data.app.includes("iTunes")) appName = "Music";

    return {
      name: data.name,
      artist: data.artist,
      album: data.album,
      duration: data.duration,
      position: data.position,
      state: data.state === "playing" ? "playing" : "paused", // Map 'playing', 'paused', 'stopped', 'closed'
      app: appName,
      artwork_url: undefined, // Thumbnail is a stream reference, hard to get URL directly without more work
    };
  } catch {
    // console.error("Error getting Windows track:", error);
    return null;
  }
}
