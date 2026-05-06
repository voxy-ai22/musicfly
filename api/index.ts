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

app.get("/api/lyrics", async (req, res) => {
  try {
    const { artist, title } = req.query;
    if (!artist || !title) return res.status(400).json({ error: "Artist and Title required" });

    const aiInstance = getAI();
    if (!aiInstance) return res.status(500).json({ error: "AI not configured" });

    const prompt = `You are a lyrics database. Return ONLY the complete song lyrics for "${title}" by "${artist}". 
    Format: plain text, each line on its own line, with empty lines between verses/chorus sections.
    Do NOT include timestamps, headers, explanations, or anything else - just the raw lyrics.
    If the song is not found, respond with: Lirik tidak tersedia.`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    
    res.json({ lyrics: response.text || "Lyrics not found." });
  } catch (error) {
    console.error("Lyrics error:", error);
    res.status(500).json({ error: "Failed to fetch lyrics" });
  }
});

export default app;
