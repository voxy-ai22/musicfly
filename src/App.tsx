/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, Loader2, Play, Users, Clock, Plus, Heart, Sparkles } from "lucide-react";
import { cn } from "./lib/utils";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import MusicCard from "./components/MusicCard";
import Player from "./components/Player";
import LyricsOverlay from "./components/LyricsOverlay";
import LibraryPage from "./components/LibraryPage";
import { Song } from "./types";
import { getHomeFeed, searchSongs } from "./services/musicService";
import DeveloperPage from "./components/DeveloperPage";
import { MusicProvider, useMusic } from "./context/MusicContext";

function AppContent() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const { history, addToHistory, setQueue } = useMusic();

  const fallbackSongs: Song[] = [
    {
      videoId: "dQw4w9WgXcQ",
      name: "Never Gonna Give You Up",
      artist: { name: "Rick Astley", browseId: "" },
      thumbnails: [{ url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", width: 480, height: 360 }],
      duration: 212
    },
    {
      videoId: "9bZkp7q19f0",
      name: "Gangnam Style",
      artist: { name: "PSY", browseId: "" },
      thumbnails: [{ url: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg", width: 480, height: 360 }],
      duration: 252
    }
  ];

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    setLoading(true);
    try {
      const results = await getHomeFeed();
      if (results && results.length > 0) {
        setSongs(results);
      } else {
        setSongs(fallbackSongs);
      }
    } catch (err) {
      console.error(err);
      setSongs(fallbackSongs);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await searchSongs(searchQuery);
      setSongs(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song: Song, context?: Song[]) => {
    setCurrentSong(song);
    setIsPlaying(true);
    addToHistory(song);
    
    // Manage Queue
    const activeList = context || songs;
    const idx = activeList.findIndex(s => s.videoId === song.videoId);
    if (idx !== -1) {
      setQueue(activeList.slice(idx + 1));
    }
  };

  const { queue, setQueue: contextSetQueue } = useMusic();

  const skipNext = () => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      setCurrentSong(nextSong);
      setIsPlaying(true);
      contextSetQueue(queue.slice(1));
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden p-0 md:p-4 bg-black relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 md:ml-4 w-full z-10 overflow-hidden relative">
        {/* Mobile Header / Top Nav */}
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 shrink-0 bg-black/80 backdrop-blur-md md:glass-surface md:rounded-2xl z-20">
          <div className="flex items-center gap-3">
             <img src="https://c.termai.cc/i165/w1eLXm.jpg" alt="Musicply" className="size-8 rounded-full object-cover border border-white/20" />
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                {["Semua", "Musik", "Podcast"].map((tab, i) => (
                  <button 
                    key={tab}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      i === 0 ? "bg-white text-black" : "bg-white/10 text-white"
                    )}
                  >
                    {tab}
                  </button>
                ))}
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setActiveTab("Search")}>
               <Search className="size-5 text-white" />
            </button>
            <button className="hidden md:flex relative size-10 rounded-xl glass-hover glass-panel items-center justify-center">
              <Bell className="size-4 text-white/60" />
              <span className="absolute top-2 right-2 size-2 bg-white rounded-full" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-0 md:pr-2 scroll-smooth">
           {activeTab === "Library" ? (
             <LibraryPage onPlaySong={handlePlaySong} />
           ) : activeTab === "Gemini" ? (
             <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black/40 rounded-3xl animate-in fade-in zoom-in duration-500">
               <div className="size-24 rounded-full bg-gradient-to-tr from-white/20 to-white/5 flex items-center justify-center mb-6 shadow-2xl shadow-black/50">
                 <Sparkles className="size-12 text-white" />
               </div>
               <h1 className="text-3xl font-bold mb-4">Gemini AI Assistant</h1>
               <p className="text-white/60 max-w-md mb-8">
                 Tanya sesuatu tentang musik, artis favoritmu, atau minta rekomendasi playlist pribadi dari AI pintar NexMusic.
               </p>
               <div className="w-full max-w-lg relative">
                 <input 
                   type="text" 
                   placeholder="Minta rekomendasi lagu jazz santai..."
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                 />
                 <button className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-white flex items-center justify-center text-black shadow-lg">
                   <Sparkles className="size-5" />
                 </button>
               </div>
             </div>
           ) : (
             <>
                {/* Search Bar only on Desktop or if Search is active */}
                {(activeTab === "Search" || searchQuery) && (
                  <div className="my-4 px-2">
                    <form onSubmit={handleSearch} className="relative flex-1 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-white transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Cari lagu atau artis..."
                        value={searchQuery}
                        autoFocus={activeTab === "Search"}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/10 transition-all font-medium"
                      />
                    </form>
                  </div>
                )}

               {loading ? (
                 <div className="flex items-center justify-center py-24">
                   <Loader2 className="size-10 text-white/50 animate-spin opacity-50" />
                 </div>
               ) : (
                 <div className="space-y-10 pt-4">
                    {/* Welcome Grid */}
                    <section className="px-2">
                       <h1 className="text-2xl font-bold mb-4">Dibuat Untuk Kamu</h1>
                       <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                         {(songs || []).slice(0, 6).map((song) => (
                           <div 
                             key={`shelf-${song.videoId}`}
                             onClick={() => handlePlaySong(song)}
                             className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded overflow-hidden cursor-pointer h-14 md:h-16 group"
                           >
                             <img src={song.thumbnails[0]?.url} className="size-14 md:size-16 object-cover shadow-2xl" alt="" />
                             <span className="text-[11px] font-bold truncate pr-3 flex-1">{song.name}</span>
                             <div className="size-10 rounded-full bg-white items-center justify-center mr-2 shadow-lg hidden group-hover:flex transform translate-y-1 group-hover:translate-y-0 transition-all">
                                <Play className="size-4 fill-black text-black ml-1" />
                             </div>
                           </div>
                         ))}
                       </div>
                    </section>

                    {/* From the Community Section */}
                    <section>
                      <div className="flex items-center gap-2 mb-4 px-2">
                        <Users className="size-5 text-white/60" />
                        <h2 className="text-xl font-bold text-white/70">From the community</h2>
                      </div>
                      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-4 px-2">
                        {[
                          { title: "2026 🎵 Best Relaxing", count: "60 lagu", songs: (songs || []).slice(0, 3) },
                          { title: "Trending Indonesia", count: "45 lagu", songs: (songs || []).slice(4, 7) },
                          { title: "Soft Study Beats", count: "120 lagu", songs: (songs || []).slice(8, 11) }
                        ].map((playlist, idx) => (
                          <div key={idx} className="min-w-[280px] bg-[#1a1c1a] rounded-3xl p-5 group flex flex-col h-[420px] shadow-2xl">
                             <div className="grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden mb-5 aspect-square border-2 border-white/5">
                               {(playlist.songs || []).concat((songs || []).slice(12, 13)).slice(0, 4).map((s, i) => (
                                 <img key={i} src={s.thumbnails[0]?.url} className="size-full object-cover" alt="" />
                               ))}
                             </div>
                             <h3 className="text-xl font-bold mb-1 leading-tight">{playlist.title}</h3>
                             <p className="text-white/40 text-sm mb-6">{playlist.count}</p>
                             <div className="space-y-4 mb-8">
                               {playlist.songs.map((s, i) => (
                                 <div key={i} className="flex items-center gap-4">
                                   <img src={s.thumbnails[0]?.url} className="size-10 rounded-lg shadow-lg" alt="" />
                                   <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-bold truncate leading-none mb-1">{s.name}</span>
                                      <span className="text-[11px] text-white/40 truncate leading-none">{s.artist.name}</span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                             <div className="flex items-center gap-4 mt-auto">
                                <button 
                                  onClick={() => handlePlaySong(playlist.songs[0], playlist.songs)}
                                  className="size-12 rounded-full bg-white flex items-center justify-center text-black shadow-lg shadow-black/30 active:scale-95 transition-all hover:bg-white/90"
                                >
                                   <Play className="size-6 fill-current ml-0.5" />
                                </button>
                                <button className="size-12 rounded-full border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
                                   <Sparkles className="size-6" />
                                </button>
                                <button className="size-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors ml-auto border border-white/5">
                                   <Plus className="size-6" />
                                </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Tetap Mendengarkan Section */}
                    <section>
                       <h2 className="text-xl font-bold mb-6 px-2">Tetap mendengarkan</h2>
                       <div className="flex items-center gap-8 overflow-x-auto no-scrollbar pb-4 px-2">
                         {(songs || []).slice(0, 8).map((song) => (
                           <div key={`artist-${song.videoId}`} className="flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer" onClick={() => handlePlaySong(song)}>
                              <div className="relative size-24 md:size-28">
                                <img src={song.thumbnails[0]?.url} className="size-full rounded-full object-cover shadow-2xl transition-transform group-hover:scale-105" alt="" />
                                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Play className="size-8 fill-white text-white ml-2" />
                                </div>
                              </div>
                              <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{song.artist.name}</span>
                           </div>
                         ))}
                       </div>
                    </section>

                    {/* Direkomendasikan */}
                    <section>
                      <h2 className="text-xl font-bold mb-4 px-2">{searchQuery ? `Hasil pencarian "${searchQuery}"` : "Direkomendasikan untuk hari ini"}</h2>
                      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 px-2">
                        {songs.slice(0, 12).map((song) => (
                          <MusicCard key={song.videoId} song={song} onClick={(s) => handlePlaySong(s, songs)} />
                        ))}
                      </div>
                    </section>

                    <div className="h-44 md:h-24 w-full shrink-0" />
                 </div>
               )}
             </>
           )}
        </main>
      </div>

      <Player 
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={setIsPlaying}
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onSkipNext={skipNext}
      />

      <LyricsOverlay 
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        song={currentSong}
      />

      <AnimatePresence>
        {activeTab === "Developer" && (
          <DeveloperPage onBack={() => setActiveTab("Home")} />
        )}
      </AnimatePresence>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}


