"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface StatusMessage {
  text: string;
  type: "success" | "error";
}

export function useStatusMessage(duration = 3000) {
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, type: "success" | "error") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage({ text, type });
      timeoutRef.current = setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { message, show, clear };
}
