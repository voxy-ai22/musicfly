import { Song } from "../types";

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
