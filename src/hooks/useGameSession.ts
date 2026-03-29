"use client";

import { useState, useCallback } from "react";

export function useGameSession() {
  const [isNight, setIsNight] = useState(false);
  const [godsNote, setGodsNote] = useState("");
  const [showPlayerRoles, setShowPlayerRoles] = useState(false);

  const togglePlayerRoles = useCallback(() => {
    setShowPlayerRoles((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setIsNight(false);
    setGodsNote("");
    setShowPlayerRoles(false);
  }, []);

  return {
    isNight,
    setIsNight,
    godsNote,
    setGodsNote,
    showPlayerRoles,
    togglePlayerRoles,
    reset,
  };
}
