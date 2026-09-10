'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useGameMusic(src: string, playing: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.45;
      audio.preload = 'metadata';
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [src]);

  // Call inside Start/Resume's click handler to unlock audio on iPhone.
  const play = useCallback((restart = false) => {
    const audio = getAudio();
    if (restart) audio.currentTime = 0;
    void audio.play().catch(() => { /* A blocked soundtrack never blocks the game. */ });
  }, [getAudio]);

  useEffect(() => {
    const audio = getAudio();
    const sync = () => {
      if (playing && !document.hidden) void audio.play().catch(() => {});
      else audio.pause();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { document.removeEventListener('visibilitychange', sync); audio.pause(); };
  }, [playing, getAudio]);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    audioRef.current = null;
  }, [src]);

  return play;
}
