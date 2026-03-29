"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalStorage } from "@/shared/hooks";

interface UseTimerOptions {
  playBell: () => void;
  startBellRepeat: () => Promise<void>;
  stopBellRepeat: () => void;
}

export function useTimer({ playBell, startBellRepeat, stopBellRepeat }: UseTimerOptions) {
  const [speechDuration, setSpeechDuration] = useLocalStorage("speechDuration", 40);
  const [challengeTime, setChallengeTime] = useLocalStorage("challengeTime", 30);
  const [extraTime, setExtraTime] = useLocalStorage("extraTime", 10);

  const [countdown, setCountdown] = useState(speechDuration);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChallenging, setIsChallenging] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopAll = useCallback(() => {
    setIsSpeaking(false);
    setIsChallenging(false);
    stopBellRepeat();
  }, [stopBellRepeat]);

  useEffect(() => {
    if ((isSpeaking || isChallenging)) {
      const initialTime = isSpeaking ? speechDuration : challengeTime;
      setCountdown(initialTime);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= -extraTime) return prev;
          const next = prev - 1;

          if (isSpeaking && next === extraTime) {
            playBell();
          } else if (next === 0) {
            playBell();
          } else if (next === -extraTime) {
            void startBellRepeat();
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      stopBellRepeat();
      setCountdown(speechDuration);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopBellRepeat();
    };
  }, [isSpeaking, isChallenging, speechDuration, challengeTime, extraTime, playBell, stopBellRepeat, startBellRepeat]);

  const toggleSpeaking = useCallback(() => {
    const next = !isSpeaking;
    if (next) setIsChallenging(false);
    setIsSpeaking(next);
    if (!next) stopBellRepeat();
  }, [isSpeaking, stopBellRepeat]);

  const toggleChallenging = useCallback(() => {
    const next = !isChallenging;
    if (next) setIsSpeaking(false);
    setIsChallenging(next);
    if (!next) stopBellRepeat();
  }, [isChallenging, stopBellRepeat]);

  return {
    countdown,
    isSpeaking,
    isChallenging,
    speechDuration,
    setSpeechDuration,
    challengeTime,
    setChallengeTime,
    extraTime,
    setExtraTime,
    toggleSpeaking,
    toggleChallenging,
    stopAll,
  };
}
