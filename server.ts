import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import YTMusic from "ytmusic-api";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
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

  let ai: GoogleGenAI | null = null;
  const getAI = () => {
    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
  };

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", initialized });
  });

  // Search API
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

  // Trending/Suggestions (Home)
  app.get("/api/home", async (req, res) => {
    try {
      await init();
      const searchTerms = ["trending music", "pop hits 2024", "indonesia viral"];
      const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      const results = await ytmusic.searchSongs(term);
      res.json(results || []);
    } catch (error) {
      console.error("Home error:", error);
      res.status(500).json({ error: "Home feed failed", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Lyrics API
  app.get("/api/lyrics", async (req, res) => {
    try {
      const { artist, title } = req.query;
      if (!artist || !title) return res.status(400).json({ error: "Artist and Title required" });

      const aiInstance = getAI();
      if (!aiInstance) return res.status(500).json({ error: "AI not configured" });

      const prompt = `Fetch the lyrics for the song "${title}" by "${artist}". 
      Format the output as clean markdown lyrics. 
      If you can find timestamps, include them like [00:15.00], otherwise just return the lyrics.
      Only return the lyrics, no extra text.`;

      const response = await aiInstance.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      res.json({ lyrics: response.text || "Lyrics not found." });
    } catch (error) {
      console.error("Lyrics error:", error);
      res.status(500).json({ error: "Failed to fetch lyrics" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
