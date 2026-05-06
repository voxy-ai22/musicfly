import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic2, Repeat, Shuffle, ListMusic, Heart, ChevronDown, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Song } from "../types";
import { cn, formatTime } from "../lib/utils";
import { useMusic } from "../context/MusicContext";
import { getLyrics } from "../services/musicService";

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  onOpenLyrics: () => void;
  onSkipNext?: () => void;
}

export default function Player({ currentSong, isPlaying, onPlayPause, onOpenLyrics, onSkipNext }: PlayerProps) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'up-next' | 'artist'>('lyrics');
  const [lyrics, setLyrics] = useState<string>("");
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [playerReady, setPlayerReady] = useState(false);
  const { isLiked, toggleLike, queue } = useMusic();
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Fetch lyrics whenever song changes
  useEffect(() => {
    if (!currentSong) return;
    setLyricsLoading(true);
    setLyrics("");
    getLyrics(currentSong.artist.name, currentSong.name)
      .then(l => { setLyrics(l); setLyricsLoading(false); })
      .catch(() => { setLyrics("Lirik tidak tersedia."); setLyricsLoading(false); });
  }, [currentSong?.videoId]);

  const controlPlayer = useCallback((play: boolean) => {
    if (!playerRef.current || !playerReady) return;
    try { play ? playerRef.current.playVideo() : playerRef.current.pauseVideo(); } catch(e) {}
  }, [playerReady]);

  useEffect(() => { controlPlayer(isPlaying); }, [isPlaying, controlPlayer]);

  // Progress tracker
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (isPlaying && playerReady) {
      progressIntervalRef.current = setInterval(() => {
        try {
          const t = playerRef.current?.getCurrentTime?.() ?? 0;
          const d = playerRef.current?.getDuration?.() ?? 0;
          if (!isNaN(t)) setProgress(t);
          if (!isNaN(d) && d > 0) setDuration(d);
        } catch(e) {}
      }, 500);
    }
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, [isPlaying, playerReady]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    try { event.target.setVolume(volume * 100); } catch(e) {}
    if (currentSong && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.name,
        artist: currentSong.artist.name,
        album: "Musicply",
        artwork: currentSong.thumbnails.map(t => ({ src: t.url, sizes: `${t.width}x${t.height}`, type: "image/jpeg" }))
      });
      navigator.mediaSession.setActionHandler("play", () => onPlayPause(true));
      navigator.mediaSession.setActionHandler("pause", () => onPlayPause(false));
      navigator.mediaSession.setActionHandler("nexttrack", () => onSkipNext?.());
    }
    if (isPlayingRef.current) setTimeout(() => { try { event.target.playVideo(); } catch(e) {} }, 300);
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) onPlayPause(true);
    if (event.data === 2) onPlayPause(false);
    if (event.data === 0) {
      if (repeatMode === 'one') { try { playerRef.current?.seekTo(0); playerRef.current?.playVideo(); } catch(e) {} }
      else onSkipNext?.();
    }
  };

  const onPlayerError = (event: any) => {
    console.error("YT Error:", event.data);
    onPlayPause(false);
    if ([100, 101, 150].includes(event.data)) setTimeout(() => onSkipNext?.(), 1500);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    try { playerRef.current?.seekTo(t, true); } catch(e) {}
    setProgress(t);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    try { playerRef.current?.setVolume(v * 100); } catch(e) {}
  };

  if (!currentSong) return null;
  const thumbnail = currentSong?.thumbnails?.[currentSong.thumbnails.length - 1]?.url || currentSong?.thumbnails?.[0]?.url;
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      {/* Hidden YouTube Player */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <YouTube
          key={currentSong.videoId}
          videoId={currentSong.videoId}
          opts={{ height: '1', width: '1', playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1, enablejsapi: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' } }}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          onError={onPlayerError}
        />
      </div>

      {/* Mobile Mini Player */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="md:hidden fixed bottom-16 left-2 right-2 z-50 rounded-xl overflow-hidden">
        <div
          className="h-[62px] flex items-center px-3 gap-3 cursor-pointer relative border border-white/10"
          style={{ background: 'rgba(22,22,22,0.98)', backdropFilter: 'blur(20px)' }}
          onClick={() => setIsExpanded(true)}
        >
          <img src={thumbnail} className="size-11 rounded-lg object-cover" alt="" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-bold truncate">{currentSong.name}</div>
            <div className="text-white/40 text-[11px] truncate">{currentSong.artist.name}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className={cn("transition-colors", isLiked(currentSong.videoId) ? "text-white" : "text-white/30")}>
              <Heart className={cn("size-5", isLiked(currentSong.videoId) && "fill-current")} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPlayPause(!isPlaying); }} className="size-9 rounded-full bg-white flex items-center justify-center">
              {isPlaying ? <Pause className="size-4 fill-black text-black" /> : <Play className="size-4 fill-black text-black ml-0.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onSkipNext?.(); }} className="text-white/40">
              <SkipForward className="size-5 fill-current" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
            <div className="h-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Full Screen Mobile Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="md:hidden fixed inset-0 z-[60] flex flex-col"
            style={{ background: '#080808' }}
          >
            {/* Blurred BG */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(90px) saturate(0.2) brightness(0.25)', transform: 'scale(1.2)' }} />
            <div className="absolute inset-0 bg-black/70 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
              <button onClick={() => setIsExpanded(false)} className="p-1 text-white/50"><ChevronDown className="size-7" /></button>
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Now Playing</p>
              <button className="p-1 text-white/50"><MoreVertical className="size-5" /></button>
            </div>

            {/* Tabs */}
            <div className="relative z-10 mx-5 mb-4 flex bg-white/8 rounded-full p-1 border border-white/10">
              {(['lyrics', 'up-next', 'artist'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("flex-1 text-[11px] font-bold py-1.5 rounded-full transition-all",
                    activeTab === tab ? "bg-white text-black" : "text-white/40"
                  )}>
                  {tab === 'up-next' ? 'Up Next' : tab === 'lyrics' ? 'Lyrics' : 'Artist'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
              {activeTab === 'lyrics' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 px-5 mb-4">
                    <img src={thumbnail} className="size-16 rounded-xl object-cover shadow-2xl border border-white/10" alt="" />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-bold text-base truncate">{currentSong.name}</h2>
                      <p className="text-white/50 text-sm truncate">{currentSong.artist.name}</p>
                    </div>
                    <button onClick={() => toggleLike(currentSong)} className={cn("transition-colors", isLiked(currentSong.videoId) ? "text-white" : "text-white/30")}>
                      <Heart className={cn("size-6", isLiked(currentSong.videoId) && "fill-current")} />
                    </button>
                  </div>

                  {/* Lyrics */}
                  <div className="flex-1 overflow-y-auto px-5 no-scrollbar" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 85%, transparent 100%)' }}>
                    {lyricsLoading ? (
                      <div className="space-y-3 pt-2">
                        {[80,65,90,55,75,60,85,70,60].map((w, i) => (
                          <div key={i} className="h-5 bg-white/10 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    ) : lyrics && lyrics !== "Lirik tidak tersedia." && lyrics !== "Could not fetch lyrics." ? (
                      <div className="text-white/80 text-base leading-loose font-medium whitespace-pre-line pb-6">
                        {lyrics}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <Mic2 className="size-10 text-white/15" />
                        <p className="text-white/30 text-sm">Lirik tidak tersedia</p>
                      </div>
                    )}
                  </div>

                  {/* Progress + Controls */}
                  <div className="px-5 pb-10 pt-3 space-y-5">
                    <div>
                      <div className="relative h-1 bg-white/15 rounded-full">
                        <div className="absolute left-0 top-0 h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
                        <input type="range" min={0} max={duration || 100} value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-white/30 font-mono">{formatTime(progress)}</span>
                        <span className="text-[10px] text-white/30 font-mono">{formatTime(duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setIsShuffled(!isShuffled)} className={cn("transition-colors", isShuffled ? "text-white" : "text-white/30")}>
                        <Shuffle className="size-5" />
                      </button>
                      <button className="text-white/70"><SkipBack className="size-8 fill-current" /></button>
                      <button onClick={() => onPlayPause(!isPlaying)} className="size-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                        {isPlaying ? <Pause className="size-7 fill-black text-black" /> : <Play className="size-7 fill-black text-black ml-1" />}
                      </button>
                      <button onClick={onSkipNext} className="text-white/70"><SkipForward className="size-8 fill-current" /></button>
                      <button onClick={() => setRepeatMode(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')} className={cn("relative transition-colors", repeatMode !== 'off' ? "text-white" : "text-white/30")}>
                        <Repeat className="size-5" />
                        {repeatMode === 'one' && <span className="absolute -top-1 -right-1 size-3 bg-white text-black text-[6px] font-black rounded-full flex items-center justify-center">1</span>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'up-next' && (
                <div className="flex-1 overflow-y-auto px-5 no-scrollbar pb-10">
                  <h3 className="text-white font-bold text-lg mb-5">Up Next</h3>
                  {queue.length > 0 ? (
                    <div className="space-y-4">
                      {queue.slice(0, 15).map((song, i) => (
                        <div key={song.videoId} className="flex items-center gap-4">
                          <span className="text-white/20 text-xs w-5 text-center">{i + 1}</span>
                          <img src={song.thumbnails[0]?.url} className="size-12 rounded-lg object-cover" alt="" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-semibold truncate">{song.name}</div>
                            <div className="text-white/40 text-xs truncate">{song.artist.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      <ListMusic className="size-10 text-white/15" />
                      <p className="text-white/30 text-sm">Antrean kosong</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'artist' && (
                <div className="flex-1 overflow-y-auto px-5 no-scrollbar pb-10">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="size-20 rounded-full overflow-hidden border border-white/10">
                      <img src={thumbnail} className="size-full object-cover" alt="" />
                    </div>
                    <div>
                      <h2 className="text-white text-2xl font-black">{currentSong.artist.name}</h2>
                      <p className="text-white/40 text-sm mt-1">Artis</p>
                    </div>
                  </div>
                  <div className="rounded-2xl p-5 border border-white/10 bg-white/5">
                    <p className="text-white/50 text-sm leading-relaxed">Dengarkan lebih banyak dari {currentSong.artist.name} di Musicply.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Player */}
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="hidden md:flex h-[90px] border-t border-white/5 px-6 items-center justify-between gap-8 z-40 fixed bottom-0 left-0 right-0"
        style={{ background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(30px)' }}
      >
        <div className="flex items-center gap-4 w-1/3">
          <img src={thumbnail} alt={currentSong.name} className="size-14 rounded-lg object-cover border border-white/10" />
          <div className="flex-col min-w-0 hidden lg:flex">
            <span className="font-semibold truncate text-sm">{currentSong.name}</span>
            <span className="text-xs text-white/40 truncate">{currentSong.artist.name}</span>
          </div>
          <button onClick={() => toggleLike(currentSong)} className={cn("ml-2 transition-colors", isLiked(currentSong.videoId) ? "text-white" : "text-white/30 hover:text-white")}>
            <Heart className={cn("size-4", isLiked(currentSong.videoId) && "fill-current")} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-7">
            <button onClick={() => setIsShuffled(!isShuffled)} className={cn("transition-colors", isShuffled ? "text-white" : "text-white/30 hover:text-white")}><Shuffle className="size-4" /></button>
            <button className="text-white/50 hover:text-white transition-colors"><SkipBack className="size-5 fill-current" /></button>
            <button onClick={() => onPlayPause(!isPlaying)} className="size-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
            </button>
            <button onClick={onSkipNext} className="text-white/50 hover:text-white transition-colors"><SkipForward className="size-5 fill-current" /></button>
            <button onClick={() => setRepeatMode(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')} className={cn("relative transition-colors", repeatMode !== 'off' ? "text-white" : "text-white/30 hover:text-white")}>
              <Repeat className="size-4" />
              {repeatMode === 'one' && <span className="absolute -top-1 -right-1 size-3 bg-white text-black text-[6px] font-black rounded-full flex items-center justify-center">1</span>}
            </button>
          </div>
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-white/30 w-9 text-right font-mono">{formatTime(progress)}</span>
            <div className="relative flex-1 flex items-center">
              <div className="h-[3px] w-full bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <input type="range" min={0} max={duration || 100} value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
            </div>
            <span className="text-[10px] text-white/30 w-9 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 w-1/3">
          <button onClick={onOpenLyrics} className="text-white/30 hover:text-white transition-colors"><Mic2 className="size-5" /></button>
          <button className="text-white/30 hover:text-white transition-colors"><ListMusic className="size-5" /></button>
          <div className="flex items-center gap-2 w-28">
            <Volume2 className="size-4 text-white/30" />
            <div className="flex-1 relative flex items-center">
              <div className="h-[3px] w-full bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
              </div>
              <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolumeChange} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
