import { platform } from "os";
import { getMacOSTrack } from "./macos-adapter";
import { getWindowsTrack } from "./windows-adapter";
import { TrackInfo } from "./music-types";

export type { TrackInfo };

export async function getCurrentTrack(): Promise<TrackInfo | null> {
  const osPlatform = platform();

  if (osPlatform === "darwin") {
    return getMacOSTrack();
  } else if (osPlatform === "win32") {
    return getWindowsTrack();
  }

  return null;
}
