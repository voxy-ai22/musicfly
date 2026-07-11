import express from "express";
import YTMusic from "ytmusic-api";
import { GoogleGenAI } from "@google/genai";

const app = express();
const ytmusic = new YTMusic();
let initialized = false;
let initPromise: Promise<void> | null = null;

const init = async () => {
  if (initialized) return;
  if (!initPromise) {
    console.log("Initializing YTMusic...");
    initPromise = ytmusic.initialize().then(() => {
      initialized = true;
      console.log("YTMusic initialized successfully");
    }).catch(err => {
      console.error("YTMusic initialization failed", err);
      initPromise = null; // Allow retry
      throw err;
    });
  }
  await initPromise;
};

// Initialize Gemini
const getAI = () => {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return null;
};

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", initialized, timestamp: new Date().toISOString() });
});

// API routes
app.get("/api/search", async (req, res) => {
  try {
    await init();
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Query required" });
    const results = await ytmusic.searchSongs(q);
    res.json(results || []);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed", details: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/home", async (req, res) => {
  try {
    await init();
    const searchTerms = ["trending music", "pop hits 2024", "indonesia viral", "top charts"];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const results = await ytmusic.searchSongs(term);
    res.json(results || []);
  } catch (error) {
    console.error("Home error:", error);
    res.status(500).json({ error: "Home feed failed", details: error instanceof Error ? error.message : String(error) });
  }
});

interface LyricLine {
  time: number; // seconds
  text: string;
}

function parseSyncedLyricsJson(raw: string): LyricLine[] | null {
  try {
    // Strip markdown code fences if the model added them anyway.
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;
    const lines: LyricLine[] = parsed
      .filter((l: any) => l && typeof l.text === "string")
      .map((l: any) => ({
        time: typeof l.time === "number" && l.time >= 0 ? l.time : 0,
        text: String(l.text)
      }));
    if (lines.length === 0) return null;
    // Ensure strictly non-decreasing timestamps so the UI's active-line
    // lookup (which assumes sorted order) behaves correctly.
    let lastTime = -1;
    for (const l of lines) {
      if (l.time < lastTime) l.time = lastTime;
      lastTime = l.time;
    }
    return lines;
  } catch {
    return null;
  }
}

app.get("/api/lyrics", async (req, res) => {
  try {
    const { artist, title, duration } = req.query;
    if (!artist || !title) return res.status(400).json({ error: "Artist and Title required" });

    const aiInstance = getAI();
    if (!aiInstance) return res.status(500).json({ error: "AI not configured" });

    const durationHint = duration ? Number(duration) : undefined;
    const durationLine = durationHint && !isNaN(durationHint)
      ? `The song's total duration is approximately ${Math.round(durationHint)} seconds; spread timestamps realistically across that span.`
      : `Estimate realistic timestamps based on typical song pacing (most songs are 2:30-4:00 long).`;

    const prompt = `You are a lyrics database that produces Spotify-style synced (time-stamped) lyrics.
Return ONLY the complete lyrics for the song "${title}" by "${artist}" as a JSON array, and nothing else - no markdown fences, no explanation, no preamble.

Each array element must be an object: {"time": <number of seconds from song start, float ok>, "text": "<line text>"}.
Rules:
- One object per lyric line, in chronological order, with "time" strictly non-decreasing.
- ${durationLine}
- Use an empty string "" for short instrumental/pause gaps if useful for pacing, but do not overuse it.
- Do NOT include section headers like [Chorus] or [Verse].
- Do NOT include real timestamps if you don't know the actual song - instead produce your best reasonable estimate so the pacing feels natural; never leave "time" as 0 for every line.
- If the song cannot be found or identified at all, return exactly: [{"time": 0, "text": "Lirik tidak tersedia."}]

Respond with ONLY the raw JSON array.`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    const rawText = response.text || "";
    const synced = parseSyncedLyricsJson(rawText);

    if (synced) {
      const plain = synced.map(l => l.text).filter(Boolean).join("\n");
      res.json({ lyrics: plain || "Lirik tidak tersedia.", synced });
    } else {
      // Fallback: model didn't return valid JSON, treat response as plain text.
      res.json({ lyrics: rawText || "Lirik tidak tersedia.", synced: null });
    }
  } catch (error) {
    console.error("Lyrics error:", error);
    res.status(500).json({ error: "Failed to fetch lyrics" });
  }
});

export default app;
