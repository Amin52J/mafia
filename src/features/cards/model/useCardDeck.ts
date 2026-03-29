"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { Card, Side } from "@/entities/card";

interface UseCardDeckOptions {
  defaultMafiaLabel: string;
  defaultCitizenLabel: string;
}

export function useCardDeck({ defaultMafiaLabel, defaultCitizenLabel }: UseCardDeckOptions) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCardId, setFlippedCardId] = useState<number | null>(null);
  const [revealedCardId, setRevealedCardId] = useState<number | null>(null);
  const [isTrembling, setIsTrembling] = useState(false);
  const [dismissingCardId, setDismissingCardId] = useState<number | null>(null);
  const [throwingCardId, setThrowingCardId] = useState<number | null>(null);
  const [throwConfig, setThrowConfig] = useState({ x: 0, y: 0, rotate: 0 });
  const [lastFlippedSide, setLastFlippedSide] = useState<Side | null>(null);
  const [isDisplayHidden, setIsDisplayHidden] = useState(false);

  const displayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createDeck = useCallback(
    (mafiaRoles: string[], citizenRoles: string[]) => {
      const allRoles = [
        ...mafiaRoles.map((r) => ({ role: r.trim() || defaultMafiaLabel, side: "mafia" as Side })),
        ...citizenRoles.map((r) => ({ role: r.trim() || defaultCitizenLabel, side: "citizen" as Side })),
      ];

      const shuffled = allRoles
        .map(({ role, side }, initialIndex) => ({ role, side, initialIndex, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ role, side, initialIndex }, index) => ({
          id: index,
          role,
          initialIndex,
          isFlipped: false,
          isSeen: false,
          side,
        }));

      setCards(shuffled);
      if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
      setIsDisplayHidden(false);
      setFlippedCardId(null);
      setRevealedCardId(null);
      setIsTrembling(false);
      setDismissingCardId(null);
      setThrowingCardId(null);
      setLastFlippedSide(null);
    },
    [defaultMafiaLabel, defaultCitizenLabel]
  );

  const flipCard = useCallback(
    (id: number) => {
      if (flippedCardId !== null || throwingCardId === id) return;
      const target = cards.find((c) => c.id === id);
      if (!target || target.isSeen) return;

      setFlippedCardId(id);
      setLastFlippedSide(target.side);

      if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = setTimeout(() => setIsDisplayHidden(true), 400);

      setIsTrembling(true);
      setTimeout(() => {
        setIsTrembling(false);
        setRevealedCardId(id);
      }, 1800);

      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
    },
    [flippedCardId, throwingCardId, cards]
  );

  const markSeen = useCallback(
    (id: number) => {
      if (throwingCardId !== null || dismissingCardId !== null) return;

      setDismissingCardId(id);
      setRevealedCardId(null);
      setIsTrembling(false);

      setTimeout(() => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = 150;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const rotate = (Math.random() - 0.5) * 720;

        setThrowConfig({ x, y, rotate });
        setDismissingCardId(null);
        setThrowingCardId(id);

        if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
        setIsDisplayHidden(false);
        setTimeout(() => setFlippedCardId(null), 200);

        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isSeen: true, isFlipped: false } : c)));
          setThrowingCardId(null);
        }, 400);
      }, 400);
    },
    [throwingCardId, dismissingCardId]
  );

  const updatePlayerName = useCallback((id: number, name: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, playerName: name } : c)));
  }, []);

  const reset = useCallback(() => {
    setCards([]);
    if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
    setIsDisplayHidden(false);
    setFlippedCardId(null);
    setRevealedCardId(null);
    setIsTrembling(false);
    setDismissingCardId(null);
    setThrowingCardId(null);
    setLastFlippedSide(null);
  }, []);

  const unseenCount = useMemo(() => cards.reduce((acc, c) => (c.isSeen ? acc : acc + 1), 0), [cards]);

  const cardDimensions = useMemo(() => {
    const n = cards.length || 12;
    const sinHalfAngle = Math.sin(Math.PI / n);
    let w = (98 * sinHalfAngle) / (1.667 + 1.333 * sinHalfAngle);
    w = Math.min(w, 28);
    w = Math.max(w, 4);
    const h = w / 0.75;
    const r = Math.min(44, 49 - h / 2);
    return { w, h, r };
  }, [cards.length]);

  return {
    cards,
    flippedCardId,
    revealedCardId,
    isTrembling,
    dismissingCardId,
    throwingCardId,
    throwConfig,
    lastFlippedSide,
    isDisplayHidden,
    cardDimensions,
    unseenCount,
    createDeck,
    flipCard,
    markSeen,
    updatePlayerName,
    reset,
  };
}
