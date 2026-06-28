"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { NIGHT_SONGS } from "@/shared/lib";

export function useAudio() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const nightAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellRepeatAudioRef = useRef<HTMLAudioElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  const playedSongsRef = useRef<Set<string>>(new Set());
  const bellRepeatDesiredRef = useRef(false);
  const allAudiosRef = useRef<Set<HTMLAudioElement>>(new Set());
  const isUnlockingRef = useRef(false);
  const isAudioUnlockedRef = useRef(false);
  const isNightActiveRef = useRef(false);

  const playSound = useCallback(async (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    if (audio.src) allAudiosRef.current.add(audio);
    try {
      audio.muted = false;
      await audio.play();
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      console.warn("Audio play failed:", e);
    }
  }, []);

  const startBellRepeat = useCallback(async () => {
    bellRepeatDesiredRef.current = true;
    const a = bellRepeatAudioRef.current;
    if (a) {
      a.currentTime = 0;
      await playSound(a);
    }
  }, [playSound]);

  const stopBellRepeat = useCallback(() => {
    bellRepeatDesiredRef.current = false;
    allAudiosRef.current.forEach((a) => {
      if (a.src.includes("bell-repeat.mp3")) {
        try { a.pause(); a.currentTime = 0; } catch { /* noop */ }
      }
    });
    const a = bellRepeatAudioRef.current;
    if (a) {
      try { a.pause(); } catch { /* noop */ }
      a.currentTime = 0;
    }
  }, []);

  const playRandomNightSong = useCallback(() => {
    if (!nightAudioRef.current) return;

    let availableSongs = NIGHT_SONGS.filter((s) => !playedSongsRef.current.has(s));
    if (availableSongs.length === 0) {
      const currentSrc = nightAudioRef.current.src;
      playedSongsRef.current.clear();
      availableSongs = NIGHT_SONGS.filter((s) => !currentSrc.endsWith(s));
      if (availableSongs.length === 0) availableSongs = [...NIGHT_SONGS];
    }

    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const randomSong = availableSongs[randomIndex];
    playedSongsRef.current.add(randomSong);

    nightAudioRef.current.src = randomSong;
    void playSound(nightAudioRef.current);
  }, [playSound]);

  const playBell = useCallback(() => {
    if (bellAudioRef.current) bellAudioRef.current.currentTime = 0;
    void playSound(bellAudioRef.current);
  }, [playSound]);

  const handleAudioUnlock = useCallback(
    async (isNight: boolean) => {
      if (isUnlockingRef.current) return;
      isUnlockingRef.current = true;

      try {
        const isIOS =
          (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
          !(window as Window & { MSStream?: unknown }).MSStream;
        if (isAudioUnlockedRef.current && !isIOS) return;

        if (isIOS) {
          allAudiosRef.current.forEach((a) => {
            if (a.src.includes("bell-repeat.mp3")) {
              try { a.pause(); } catch { /* noop */ }
            }
          });

          const br = new Audio("/bell-repeat.mp3");
          br.loop = true;
          br.preload = "auto";
          allAudiosRef.current.add(br);
          const recoverBR = () => {
            if (!bellRepeatDesiredRef.current) return;
            void br.load();
            void br.play().catch(() => {});
          };
          br.addEventListener("stalled", recoverBR);
          br.addEventListener("error", recoverBR);
          bellRepeatAudioRef.current = br;

          const b = new Audio("/bell.mp3");
          b.preload = "auto";
          allAudiosRef.current.add(b);
          bellAudioRef.current = b;

          if (!isNight && !isNightActiveRef.current) {
            const n = new Audio();
            n.preload = "auto";
            n.onended = () => {
              if (isNightActiveRef.current) playRandomNightSong();
            };
            allAudiosRef.current.add(n);
            nightAudioRef.current = n;
          }
        }

        allAudiosRef.current.forEach((a) => {
          if (
            a !== nightAudioRef.current &&
            a !== bellAudioRef.current &&
            a !== bellRepeatAudioRef.current &&
            a !== silentAudioRef.current &&
            a.paused
          ) {
            allAudiosRef.current.delete(a);
          }
        });

        const audios = [
          nightAudioRef.current,
          bellAudioRef.current,
          bellRepeatAudioRef.current,
          silentAudioRef.current,
        ];

        for (const audio of audios) {
          if (!audio) continue;
          allAudiosRef.current.add(audio);

          if (!audio.paused && !audio.muted && audio !== silentAudioRef.current) continue;
          if (audio === silentAudioRef.current && !audio.paused) continue;
          if (audio === bellRepeatAudioRef.current && bellRepeatDesiredRef.current) {
            void playSound(audio);
            continue;
          }
          if (audio === nightAudioRef.current && isNightActiveRef.current) continue;

          const wasMuted = audio.muted;
          try {
            audio.muted = true;
            await audio.play();

            const isBellRepeat = audio === bellRepeatAudioRef.current;
            const shouldBePlaying = isBellRepeat
              ? bellRepeatDesiredRef.current
              : audio === nightAudioRef.current
                ? isNightActiveRef.current
                : false;

            if (!shouldBePlaying && audio !== silentAudioRef.current) {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = wasMuted;
            } else if (audio === silentAudioRef.current) {
              audio.muted = false;
              audio.volume = 0.001;
            } else {
              audio.muted = false;
            }
          } catch {
            audio.muted = wasMuted;
          }
        }
        isAudioUnlockedRef.current = true;
      } finally {
        isUnlockingRef.current = false;
      }
    },
    [playSound, playRandomNightSong]
  );

  // Initialize audio elements on mount
  useEffect(() => {
    if (!nightAudioRef.current) {
      nightAudioRef.current = new Audio(NIGHT_SONGS[0]);
      nightAudioRef.current.loop = false;
      nightAudioRef.current.preload = "auto";
    }
    if (!bellAudioRef.current) {
      bellAudioRef.current = new Audio("/bell.mp3");
      bellAudioRef.current.preload = "auto";
    }
    if (!bellRepeatAudioRef.current) {
      bellRepeatAudioRef.current = new Audio("/bell-repeat.mp3");
      bellRepeatAudioRef.current.loop = true;
      bellRepeatAudioRef.current.preload = "auto";
    }
    if (!silentAudioRef.current) {
      silentAudioRef.current = new Audio(
        "data:audio/mpeg;base64,SUQzBAAAAAABAFRYWFhYAAAAHAAAAERlYnVnZ2luZyBpbmZvcm1hdGlvbgAAMi40LjADAQAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUE9XWUVSTUVTU0FHRREAAAABvH0UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUE9XWUVSTUVTU0FHRREAAAABvH0UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
      );
      silentAudioRef.current.loop = true;
      silentAudioRef.current.volume = 0.001;
      silentAudioRef.current.preload = "auto";
    }

    nightAudioRef.current?.load();
    bellAudioRef.current?.load();
    bellRepeatAudioRef.current?.load();
    silentAudioRef.current?.load();

    setIsAudioInitialized(true);

    const handleInteraction = () => {
      if (!isAudioUnlockedRef.current) {
        void handleAudioUnlock(false);
      }
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("click", handleInteraction);
    };

    document.addEventListener("touchstart", handleInteraction);
    document.addEventListener("click", handleInteraction);

    return () => {
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("click", handleInteraction);
    };
  }, [handleAudioUnlock]);

  const startNight = useCallback(async () => {
    isNightActiveRef.current = true;
    await handleAudioUnlock(true);
    playRandomNightSong();
  }, [handleAudioUnlock, playRandomNightSong]);

  const stopNight = useCallback(() => {
    isNightActiveRef.current = false;
    nightAudioRef.current?.pause();
  }, []);

  // Chain night songs when one ends
  useEffect(() => {
    const audio = nightAudioRef.current;
    if (!audio) return;
    const handler = () => playRandomNightSong();
    audio.onended = handler;
  }, [playRandomNightSong, isAudioInitialized]);

  const clearPlayedSongs = useCallback(() => {
    playedSongsRef.current.clear();
  }, []);

  return {
    playBell,
    startBellRepeat,
    stopBellRepeat,
    startNight,
    stopNight,
    handleAudioUnlock,
    clearPlayedSongs,
  };
}
