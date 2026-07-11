import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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

const LIKED_IDS_KEY = "music_liked_ids";
const LIKED_DATA_KEY = "music_liked_data";

function readLocalLikes(): { ids: string[]; data: Song[] } {
  try {
    const ids = JSON.parse(localStorage.getItem(LIKED_IDS_KEY) || "[]");
    const data = JSON.parse(localStorage.getItem(LIKED_DATA_KEY) || "[]");
    return { ids: Array.isArray(ids) ? ids : [], data: Array.isArray(data) ? data : [] };
  } catch {
    return { ids: [], data: [] };
  }
}

function writeLocalLikes(ids: string[], data: Song[]) {
  try {
    localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(ids));
    localStorage.setItem(LIKED_DATA_KEY, JSON.stringify(data.slice(-200)));
  } catch {
    // storage full or unavailable - fail silently, likes just won't persist
  }
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [likedSongs, setLikedSongs] = useState<string[]>(() => readLocalLikes().ids);
  const [likedSongsData, setLikedSongsData] = useState<Song[]>(() => readLocalLikes().data);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  // Tracks whether the current liked-songs state came from Firestore,
  // so we know whether to merge local data into it once auth resolves.
  const hasMergedRemote = useRef(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const savedHistory = localStorage.getItem("music_history");
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch { /* ignore corrupt data */ }
    }

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      // Not logged in (or logged out): fall back to local likes so the
      // heart button always works, with no account required.
      hasMergedRemote.current = false;
      const local = readLocalLikes();
      setLikedSongs(local.ids);
      setLikedSongsData(local.data);
      setPlaylists([]);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let remoteIds: string[] = data.likedSongIds || [];
        let remoteData: Song[] = data.likedSongsMetadata || [];

        // First time we see remote data after login: merge in anything the
        // person liked locally before signing in, so nothing gets lost.
        if (!hasMergedRemote.current) {
          hasMergedRemote.current = true;
          const local = readLocalLikes();
          const missingIds = local.ids.filter((id) => !remoteIds.includes(id));
          if (missingIds.length > 0) {
            const missingData = local.data.filter((s) => missingIds.includes(s.videoId));
            const mergedIds = [...remoteIds, ...missingIds];
            const mergedData = [...remoteData, ...missingData].slice(-200);
            setDoc(doc(db, "users", user.uid), {
              likedSongIds: mergedIds,
              likedSongsMetadata: mergedData,
            }, { merge: true }).catch(() => {});
            remoteIds = mergedIds;
            remoteData = mergedData;
          }
        }

        setLikedSongs(remoteIds);
        setLikedSongsData(remoteData);
      } else {
        // Init profile, carrying over any local likes made before login.
        const local = readLocalLikes();
        hasMergedRemote.current = true;
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          likedSongIds: local.ids,
          likedSongsMetadata: local.data,
          recentSongIds: []
        }, { merge: true });
        setLikedSongs(local.ids);
        setLikedSongsData(local.data);
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
    const isCurrentlyLiked = likedSongs.includes(song.videoId);
    const nextIds = isCurrentlyLiked
      ? likedSongs.filter((id) => id !== song.videoId)
      : [...likedSongs, song.videoId];
    const nextData = isCurrentlyLiked
      ? likedSongsData.filter((s) => s.videoId !== song.videoId)
      : [...likedSongsData, song].slice(-200);

    // Update UI immediately regardless of login state.
    setLikedSongs(nextIds);
    setLikedSongsData(nextData);

    if (!user) {
      // Guest mode: persist likes locally so the button always works,
      // even without signing in.
      writeLocalLikes(nextIds, nextData);
      return;
    }

    // Logged in: persist to Firestore. Also keep local storage as a
    // backup/cache in case the person logs out later.
    writeLocalLikes(nextIds, nextData);
    const userRef = doc(db, "users", user.uid);
    try {
      if (isCurrentlyLiked) {
        await setDoc(userRef, {
          likedSongIds: arrayRemove(song.videoId),
          likedSongsMetadata: nextData
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          likedSongIds: arrayUnion(song.videoId),
          likedSongsMetadata: nextData
        }, { merge: true });
      }
    } catch (err) {
      console.error("Failed to sync like to Firestore:", err);
      // Local state already updated above, so the like still "sticks"
      // for this session even if the sync fails.
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
