import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, collection, query, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Song } from "../types";

interface MusicContextType {
  user: User | null;
  likedSongs: string[];
  likedSongsData: Song[];
  playlists: any[];
  toggleLike: (song: Song) => Promise<void>;
  isLiked: (songId: string) => boolean;
  history: Song[];
  queue: Song[];
  setQueue: (songs: Song[]) => void;
  addToHistory: (song: Song) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [likedSongsData, setLikedSongsData] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const savedHistory = localStorage.getItem("music_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setLikedSongs([]);
      setPlaylists([]);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLikedSongs(data.likedSongIds || []);
        setLikedSongsData(data.likedSongsMetadata || []);
      } else {
        // Init profile
        setDoc(doc(db, "users", user.uid), { 
          uid: user.uid, 
          displayName: user.displayName, 
          photoURL: user.photoURL,
          likedSongIds: [],
          likedSongsMetadata: [],
          recentSongIds: []
        }, { merge: true });
      }
    });

    const q = query(collection(db, "playlists"), where("ownerId", "==", user.uid));
    const unsubPlaylists = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPlaylists(p);
    });

    return () => {
      unsubUser();
      unsubPlaylists();
    };
  }, [user]);

  const toggleLike = async (song: Song) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const isCurrentlyLiked = likedSongs.includes(song.videoId);
    
    if (isCurrentlyLiked) {
      await setDoc(userRef, {
        likedSongIds: arrayRemove(song.videoId),
        likedSongsMetadata: likedSongsData.filter(s => s.videoId !== song.videoId)
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        likedSongIds: arrayUnion(song.videoId),
        likedSongsMetadata: [...likedSongsData, song].slice(-100) // Keep last 100 for metadata
      }, { merge: true });
    }
  };

  const isLiked = (songId: string) => likedSongs.includes(songId);

  const addToHistory = (song: Song) => {
    setHistory(prev => {
      const filtered = prev.filter(s => s.videoId !== song.videoId);
      const newHistory = [song, ...filtered].slice(0, 50);
      localStorage.setItem("music_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return (
    <MusicContext.Provider value={{ 
      user, 
      likedSongs, 
      likedSongsData,
      playlists, 
      toggleLike, 
      isLiked, 
      history, 
      queue,
      setQueue,
      addToHistory 
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) throw new Error("useMusic must be used within MusicProvider");
  return context;
}
