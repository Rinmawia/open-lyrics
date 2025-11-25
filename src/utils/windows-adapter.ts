import { TrackInfo } from "./music-types";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

const POWERSHELL_SCRIPT = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime

# Helper to await async operations
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
Function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

# Load Windows Media Control
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null

$sessionManagerTask = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
$sessionManager = Await $sessionManagerTask ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$session = $sessionManager.GetCurrentSession()

if ($session) {
  $infoTask = $session.TryGetMediaPropertiesAsync()
  $info = Await $infoTask ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
  
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
  }

  $result | ConvertTo-Json
}
`;

export async function getWindowsTrack(): Promise<TrackInfo | null> {
  try {
    // Encode the script in base64 to avoid escaping issues
    const scriptBase64 = Buffer.from(POWERSHELL_SCRIPT, "utf16le").toString("base64");
    const command = `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${scriptBase64}`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });

    if (stderr) {
      console.error("PowerShell stderr:", stderr);
    }

    if (!stdout.trim()) {
      return null;
    }

    const data = JSON.parse(stdout);

    // Map Windows app IDs to friendly names
    let appName: "Spotify" | "Music" = "Spotify";
    if (data.app?.includes("Spotify")) appName = "Spotify";
    if (data.app?.includes("Music") || data.app?.includes("iTunes")) appName = "Music";

    const trackInfo: TrackInfo = {
      name: data.name,
      artist: data.artist,
      album: data.album,
      duration: data.duration,
      position: data.position,
      state: data.state === "playing" ? "playing" : "paused",
      app: appName,
      artwork_url: undefined,
    };

    return trackInfo;
  } catch (error) {
    console.error("Error getting Windows track:", error);
    return null;
  }
}
