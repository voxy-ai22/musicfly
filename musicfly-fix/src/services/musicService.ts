import { Song } from "../types";

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricsResult {
  lyrics: string;
  synced: LyricLine[] | null;
}

export async function searchSongs(query: string): Promise<Song[]> {
  try {
    const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Search failed");
    }
    return resp.json();
  } catch (error) {
    console.error("musicService.searchSongs error:", error);
    throw error;
  }
}

export async function getHomeFeed(): Promise<Song[]> {
  try {
    const resp = await fetch("/api/home");
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to fetch home feed");
    }
    return resp.json();
  } catch (error) {
    console.error("musicService.getHomeFeed error:", error);
    throw error;
  }
}

export async function getLyrics(artist: string, title: string): Promise<string> {
  try {
    const resp = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
    if (!resp.ok) throw new Error("Lyrics fetch failed");
    const data = await resp.json();
    return data.lyrics || "Lyrics not found.";
  } catch (error) {
    console.error("Lyrics error:", error);
    return "Could not fetch lyrics.";
  }
}

export async function getSyncedLyrics(artist: string, title: string, duration?: number): Promise<LyricsResult> {
  try {
    const durationParam = duration ? `&duration=${encodeURIComponent(duration)}` : "";
    const resp = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}${durationParam}`);
    if (!resp.ok) throw new Error("Lyrics fetch failed");
    const data = await resp.json();
    return {
      lyrics: data.lyrics || "Lirik tidak tersedia.",
      synced: Array.isArray(data.synced) ? data.synced : null
    };
  } catch (error) {
    console.error("Lyrics error:", error);
    return { lyrics: "Tidak dapat memuat lirik.", synced: null };
  }
}
