import { getITunesArtwork } from "./providers/itunes";
import { getDeezerArtwork } from "./providers/deezer";

export async function getArtwork(term: string): Promise<string | null> {
  // Try iTunes first
  const iTunesArtwork = await getITunesArtwork(term);
  if (iTunesArtwork) return iTunesArtwork;

  // Fallback to Deezer
  const deezerArtwork = await getDeezerArtwork(term);
  if (deezerArtwork) return deezerArtwork;

  return null;
}
