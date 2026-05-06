import { motion, AnimatePresence } from "motion/react";
import { X, Music2 } from "lucide-react";
import Markdown from "react-markdown";
import { Song } from "../types";
import { useEffect, useState } from "react";
import { getLyrics } from "../services/musicService";

interface LyricsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export default function LyricsOverlay({ isOpen, onClose, song }: LyricsOverlayProps) {
  const [lyrics, setLyrics] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && song) {
      setLoading(true);
      getLyrics(song.artist.name, song.name).then((l) => {
        setLyrics(l);
        setLoading(false);
      });
    }
  }, [isOpen, song]);

  const thumbnail = song?.thumbnails[song.thumbnails.length - 1]?.url;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 glass-dark flex flex-col"
        >
          {/* Background blurred cover */}
          <div 
            className="absolute inset-0 opacity-20 blur-[100px] pointer-events-none"
            style={{ 
              backgroundImage: `url(${thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          <header className="relative z-10 flex items-center justify-between p-8">
            <div className="flex items-center gap-4">
              <Music2 className="text-white/60" />
              <span className="text-sm font-bold tracking-widest uppercase opacity-50">Now Playing Lyrics</span>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="size-6" />
            </button>
          </header>

          <main className="relative z-10 flex-1 grid md:grid-cols-2 gap-12 p-8 md:p-16 max-w-7xl mx-auto w-full overflow-hidden">
            <div className="flex flex-col justify-center gap-8 order-2 md:order-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  {song?.name}
                </h1>
                <p className="text-2xl text-white/60 font-medium">{song?.artist.name}</p>
              </motion.div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-8 mask-lyrics">
                {loading ? (
                  <div className="space-y-4 pt-8">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }} />
                    ))}
                  </div>
                ) : (
                  <div className="text-2xl md:text-3xl font-bold lyric-dim leading-relaxed md:leading-loose pt-8">
                    <Markdown 
                      components={{
                        p: ({ children }) => <p className="mb-4 transition-all duration-300 hover:lyric-active cursor-default">{children}</p>
                      }}
                    >
                      {lyrics}
                    </Markdown>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center order-1 md:order-2">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative aspect-square w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(34,197,94,0.15)]"
              >
                <img src={thumbnail} alt={song?.name} className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
