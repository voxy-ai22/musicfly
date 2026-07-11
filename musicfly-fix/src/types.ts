export interface Song {
  videoId: string;
  name: string;
  artist: {
    name: string;
    browseId?: string;
  };
  duration?: number;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Song[];
  isLyricsOpen: boolean;
}
