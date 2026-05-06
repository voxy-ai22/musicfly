import { motion } from "motion/react";
import { Play } from "lucide-react";
import { Song } from "../types";

interface MusicCardProps {
  song: Song;
  onClick: (song: Song) => void;
  variant?: "card" | "circle" | "radio";
}

export default function MusicCard({ song, onClick, variant = "card" }: MusicCardProps) {
  const thumbnail = song.thumbnails[song.thumbnails.length - 1]?.url;

  if (variant === "circle") {
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(song)}
        className="flex flex-col items-center gap-2 cursor-pointer group min-w-[100px]"
      >
        <div className="size-24 sm:size-32 rounded-full overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-300">
          <img 
            src={thumbnail} 
            alt={song.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[10px] font-bold text-white text-center w-full truncate px-2">{song.artist.name}</span>
      </motion.div>
    );
  }

  if (variant === "radio") {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(song)}
        className="relative aspect-square rounded-md overflow-hidden cursor-pointer group min-w-[140px] md:min-w-[180px]"
        style={{ backgroundColor: "#1e1e1e" }}
      >
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
           <div className="size-4 rounded-full bg-green-500 flex items-center justify-center">
              <div className="size-2 bg-black rounded-full" />
           </div>
           <span className="text-[8px] font-black tracking-tighter text-black bg-white/80 px-1 rounded uppercase">Radio</span>
        </div>
        <div className="w-full h-full p-4 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-transparent">
           <div className="relative">
              <img src={thumbnail} className="size-24 rounded-full shadow-2xl border-4 border-black/20" alt="" />
              <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-black flex items-center justify-center border-2 border-white/5">
                <div className="size-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1" />
              </div>
           </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-black text-lg truncate uppercase tracking-tighter leading-none">{song.name}</h3>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(song)}
      className="bg-[#181818] hover:bg-[#282828] p-3 rounded-lg cursor-pointer transition-colors group"
    >
      <div className="relative aspect-square mb-3 overflow-hidden rounded-md shadow-lg">
        <img 
          src={thumbnail} 
          alt={song.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="bg-white text-black p-4 rounded-full shadow-2xl"
          >
            <Play className="size-6 fill-current" />
          </motion.div>
        </div>
      </div>
      <h3 className="font-bold text-white truncate mb-1 pr-8">{song.name}</h3>
      <p className="text-xs font-medium text-white/40 truncate uppercase tracking-widest">
        {song.artist.name}
      </p>
    </motion.div>
  );
}
