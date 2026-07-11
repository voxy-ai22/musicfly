import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import type { LyricLine } from "../services/musicService";

interface SyncedLyricsProps {
  synced: LyricLine[] | null;
  plainText: string;
  progress: number; // current playback time in seconds
  onSeek?: (time: number) => void; // tap a line to jump there, like Spotify
  className?: string;
  activeLineClassName?: string;
  inactiveLineClassName?: string;
  size?: "sm" | "lg";
}

export default function SyncedLyrics({
  synced,
  plainText,
  progress,
  onSeek,
  className,
  activeLineClassName,
  inactiveLineClassName,
  size = "sm",
}: SyncedLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const lines = useMemo(() => {
    if (synced && synced.length > 0) return synced;
    return null;
  }, [synced]);

  // Determine the active line index from current playback progress.
  useEffect(() => {
    if (!lines) return;
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= progress) idx = i;
      else break;
    }
    setActiveIndex(idx);
  }, [progress, lines]);

  // Auto-scroll the active line into view, centered, like Spotify's lyrics view.
  useEffect(() => {
    const el = lineRefs.current[activeIndex];
    const container = containerRef.current;
    if (el && container) {
      const containerHeight = container.clientHeight;
      const elTop = el.offsetTop;
      const elHeight = el.clientHeight;
      container.scrollTo({
        top: elTop - containerHeight / 2 + elHeight / 2,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  if (!lines) {
    // Fallback: no timing data, just show plain lyrics without karaoke effect.
    return (
      <div className={cn("whitespace-pre-line", className)}>
        {plainText}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("overflow-y-auto no-scrollbar", className)}>
      <div className={size === "lg" ? "py-[35vh]" : "py-20"}>
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          if (!line.text) {
            return <div key={i} className="h-4" />;
          }
          return (
            <div
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              onClick={() => onSeek?.(line.time)}
              className={cn(
                "transition-all duration-300 ease-out origin-left",
                onSeek && "cursor-pointer",
                size === "lg" ? "text-3xl md:text-5xl font-black mb-6 leading-tight" : "text-xl font-bold mb-4 leading-snug",
                isActive
                  ? cn("text-white scale-100 opacity-100", activeLineClassName)
                  : cn(
                      isPast ? "opacity-30" : "opacity-40",
                      "text-white scale-[0.97] hover:opacity-70",
                      inactiveLineClassName
                    )
              )}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
