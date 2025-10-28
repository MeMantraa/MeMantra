import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mantra } from '../services/mantra.service';

type LikesMap = Record<number, Mantra>;

type LikesContextType = {
  liked: LikesMap;
  isLiked: (id: number) => boolean;
  likeMantra: (mantra: Mantra) => void;
  unlikeMantra: (id: number) => void;
  toggleLike: (mantra: Mantra) => void;
};

const LikesContext = createContext<LikesContextType | undefined>(undefined);

const STORAGE_KEY = '@liked_mantras_v1';

export const LikesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liked, setLiked] = useState<LikesMap>({});

  // load on boot
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLiked(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load liked mantras from storage', e);
      }
    })();
  }, []);

  // persist on change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liked)).catch((e) => {
      console.warn('Failed to persist liked mantras to storage', e);
    });
  }, [liked]);

  const isLiked = useCallback((id: number) => !!liked[id], [liked]);

  const likeMantra = useCallback((mantra: Mantra) => {
    setLiked((prev) => ({ ...prev, [mantra.mantra_id]: { ...mantra, isLiked: true } }));
  }, []);

  const unlikeMantra = useCallback((id: number) => {
    setLiked((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const toggleLike = useCallback(
    (mantra: Mantra) =>
      isLiked(mantra.mantra_id) ? unlikeMantra(mantra.mantra_id) : likeMantra(mantra),
    [isLiked, likeMantra, unlikeMantra],
  );

  const value = useMemo(
    () => ({ liked, isLiked, likeMantra, unlikeMantra, toggleLike }),
    [liked, isLiked, likeMantra, unlikeMantra, toggleLike],
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
};

export const useLikes = () => {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error('useLikes must be used within a LikesProvider');
  return ctx;
};

LikesProvider.displayName = 'LikesProvider';
