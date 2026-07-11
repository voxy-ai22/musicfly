import { motion } from "motion/react";
import { Heart, ArrowDownToLine, Clock, CloudUpload, Plus, Play, MoreVertical, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useMusic } from "../context/MusicContext";
import { cn } from "../lib/utils";
import { Song } from "../types";

interface LibraryPageProps {
  onPlaySong: (song: Song) => void;
}

export default function LibraryPage({ onPlaySong }: LibraryPageProps) {
  const [activeSubTab, setActiveSubTab] = useState("Daftar putar");
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const { history, likedSongs, likedSongsData, toggleLike } = useMusic();

  const tabs = ["Daftar putar", "Lagu", "Album", "Artis", "Podcasts"];

  const libraryItems = [
    { icon: Heart, label: "Disukai", sub: `${likedSongs.length} lagu`, active: true, onClick: () => setActiveSubTab("Lagu") },
    { icon: ArrowDownToLine, label: "Diunduh", sub: "0 lagu", onClick: () => setActiveSubTab("Album") },
    { icon: TrendingUp, label: "Teratas Saya 50", sub: `${Math.min(likedSongs.length, 50)} lagu`, onClick: () => setActiveSubTab("Lagu") },
    { icon: Clock, label: "Riwayat / Tersimpan di Cache", sub: `${history.length} lagu`, onClick: () => setActiveSubTab("Riwayat") },
    { icon: CloudUpload, label: "Diunggah", sub: "0 lagu", onClick: () => setActiveSubTab("Album") },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-black text-white"
    >
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4 px-4 sticky top-0 bg-black z-10">
        {tabs.map((tab) => (
          <button 
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeSubTab === tab ? "bg-white/10 text-white" : "text-white/40"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-40">
        <div className="flex items-center justify-between py-2 mb-4">
          <div className="flex items-center gap-1 text-white/60 text-[10px] font-bold">
            <span>Tanggal ditambahkan</span>
            <motion.span animate={{ rotate: 180 }}>↓</motion.span>
          </div>
        </div>

        {activeSubTab === "Daftar putar" && (
           <div className="space-y-6">
              {libraryItems.map((item, i) => (
                <div
                  key={i}
                  onClick={item.onClick}
                  className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 active:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <div className="size-12 rounded bg-[#2a2a2a] flex items-center justify-center text-white/40 group-hover:bg-white/10">
                    <item.icon className={cn("size-6", item.active && "text-white")} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-base font-medium leading-tight">{item.label}</span>
                    {item.sub && <span className="text-xs text-white/40">{item.sub}</span>}
                  </div>
                </div>
              ))}
              <div
                onClick={() => setActiveSubTab("Lagu")}
                className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 active:bg-white/10 p-2 rounded-lg transition-colors"
              >
                 <div className="size-12 rounded bg-[#2a2a2a] flex items-center justify-center text-white/40 group-hover:bg-white/10">
                   <Plus className="size-6" />
                 </div>
                 <span className="text-base font-medium">Buat playlist baru</span>
              </div>
           </div>
        )}

        {activeSubTab === "Lagu" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Lagu Disukai</h1>
              <button 
                type="button"
                onClick={() => likedSongsData.length > 0 && onPlaySong(likedSongsData[0])}
                disabled={likedSongsData.length === 0}
                className="size-14 rounded-full bg-green-500 flex items-center justify-center text-black shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none"
              >
                <Play className="size-6 fill-current ml-1" />
              </button>
            </div>
            
            {likedSongsData.length > 0 ? (
              <div className="space-y-4">
                {likedSongsData.map((song) => (
                  <div 
                    key={song.videoId} 
                    className="flex items-center gap-4 group transition-colors hover:bg-white/5 p-2 rounded-lg relative"
                  >
                    <div onClick={() => onPlaySong(song)} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                      <img src={song.thumbnails[0]?.url} className="size-12 rounded shadow-md" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium truncate">{song.name}</div>
                        <div className="text-xs text-white/40 truncate">{song.artist.name}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === song.videoId ? null : song.videoId); }}
                      className="text-white/40 group-hover:text-white p-1 -m-1"
                    >
                       <MoreVertical className="size-5" />
                    </button>
                    {openMenuFor === song.videoId && (
                      <div className="absolute right-2 top-12 z-20 bg-[#282828] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleLike(song); setOpenMenuFor(null); }}
                          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                        >
                          <Heart className="size-4 fill-current" /> Hapus dari Disukai
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="size-16 text-white/10 mb-4" />
                <span className="text-xl font-bold mb-2">Lagu Disukai</span>
                <span className="text-sm text-white/40">
                  Lagu yang Anda sukai akan muncul di sini.
                </span>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "Riwayat" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1 className="text-3xl font-bold mb-8">Riwayat</h1>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((song) => (
                  <div 
                    key={song.videoId} 
                    onClick={() => onPlaySong(song)}
                    className="flex items-center gap-4 group transition-colors cursor-pointer hover:bg-white/5 p-2 rounded-lg"
                  >
                    <img src={song.thumbnails[0]?.url} className="size-12 rounded shadow-md" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium truncate">{song.name}</div>
                      <div className="text-xs text-white/40 truncate">{song.artist.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock className="size-16 text-white/10 mb-4" />
                <span className="text-xl font-bold mb-2">Belum Ada Riwayat</span>
                <span className="text-sm text-white/40">
                  Lagu yang Anda putar akan muncul di sini.
                </span>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "Album" && (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-300">
            <span className="text-2xl font-bold mb-2">Album Disimpan</span>
            <span className="text-sm text-white/40">
              Album yang Anda tambahkan akan muncul di sini.
            </span>
          </div>
        )}

        {activeSubTab === "Artis" && (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-300">
            <span className="text-2xl font-bold mb-2">Artis yang Disubscribe</span>
            <span className="text-sm text-white/40">
              Artis yang Anda ikuti akan muncul di sini.
            </span>
          </div>
        )}

        {activeSubTab === "Podcasts" && (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-300">
            <span className="text-2xl font-bold mb-2">Mulai Mendengarkan Podcast</span>
            <span className="text-sm text-white/40">
              Podcast adalah cara yang bagus untuk mendengarkan cerita dan berita.
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
