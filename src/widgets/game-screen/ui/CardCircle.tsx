"use client";

import type { Card, Side } from "@/entities/card";
import { Icon } from "@/shared/ui";
import type { TranslationKey } from "@/features/language";

interface CardCircleProps {
  cards: Card[];
  flippedCardId: number | null;
  revealedCardId: number | null;
  isTrembling: boolean;
  dismissingCardId: number | null;
  throwingCardId: number | null;
  throwConfig: { x: number; y: number; rotate: number };
  lastFlippedSide: Side | null;
  isDisplayHidden: boolean;
  cardDimensions: { w: number; h: number; r: number };
  formatNumber: (v: number) => string;
  t: (key: TranslationKey) => string;
  onFlip: (id: number) => void;
  onMarkSeen: (id: number) => void;
}

export function CardCircle({
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
  formatNumber,
  t,
  onFlip,
  onMarkSeen,
}: CardCircleProps) {
  return (
    <div className="relative w-full aspect-square max-w-[min(90vw,min(70vh,500px))] mx-auto animate-slide-up perspective-1000 preserve-3d [transform:translateZ(0)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] pointer-events-none z-20 overflow-hidden">
        <div className={`absolute inset-0 transition-opacity ${flippedCardId !== null && dismissingCardId === null && throwingCardId === null ? "duration-1000 opacity-100" : "duration-[600ms] opacity-0"}`}>
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vmax] h-[100vmax] rounded-full blur-[100px] opacity-40 animate-breathe transition-colors duration-1000 ${revealedCardId === null ? "bg-white/40" : lastFlippedSide === "mafia" ? "bg-mafia" : "bg-citizen"}`} />
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] opacity-20 animate-spin-slow [mask-image:radial-gradient(circle,white,transparent_70%)] ${revealedCardId === null ? "bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.3),transparent,rgba(255,255,255,0.3),transparent)]" : lastFlippedSide === "mafia" ? "bg-[conic-gradient(from_0deg,transparent,var(--color-mafia),transparent,var(--color-mafia),transparent)]" : "bg-[conic-gradient(from_0deg,transparent,var(--color-citizen),transparent,var(--color-citizen),transparent)]"}`} />
        </div>
        <div className={`absolute inset-0 transition-opacity ${flippedCardId !== null && dismissingCardId === null && throwingCardId === null ? "duration-1000 opacity-100" : "duration-[800ms] opacity-0"}`}>
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-60 animate-breathe transition-colors duration-1000 ${revealedCardId === null ? "bg-white/40" : lastFlippedSide === "mafia" ? "bg-mafia" : "bg-citizen"}`} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full blur-md bg-white opacity-20" />
        </div>
      </div>

      {cards.map((card, index) => {
        const angle = (index * 2 * Math.PI) / cards.length - Math.PI / 2;
        const x = Math.cos(angle) * cardDimensions.r;
        const y = Math.sin(angle) * cardDimensions.r;
        const isFlipped = flippedCardId === card.id;
        const isRevealed = revealedCardId === card.id;
        const isDismissing = dismissingCardId === card.id;
        const isThrowing = throwingCardId === card.id;
        const timingFunc = isThrowing ? "ease-in" : "ease-out";
        const durationClass =
          isFlipped && !isRevealed && !isDismissing && !isThrowing
            ? "duration-[1800ms]"
            : "duration-[400ms]";

        if (card.isSeen) {
          return (
            <div
              key={card.id}
              className="absolute"
              style={{
                width: `${cardDimensions.w}%`,
                height: `${cardDimensions.h}%`,
                left: `${50 + x}%`,
                top: `${50 + y}%`,
                transform: "translate(-50%, -50%)",
              }}
              aria-hidden
            />
          );
        }

        return (
          <div
            key={card.id}
            onClick={() => onFlip(card.id)}
            className={`absolute cursor-pointer transition-all ${durationClass} ${timingFunc} preserve-3d ${
              isFlipped || isDismissing
                ? "z-50 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] rounded-3xl sm:rounded-[2.5rem]"
                : isThrowing
                  ? "z-40 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] rounded-3xl sm:rounded-[2.5rem]"
                  : `z-10 shadow-2xl rounded-lg sm:rounded-xl ${flippedCardId !== null ? `opacity-0 scale-90 pointer-events-none ${isDisplayHidden ? "hidden" : "invisible"}` : "hover:scale-110"}`
            }`}
            style={{
              width: isFlipped || isThrowing || isDismissing ? "min(60vw, 240px)" : `${cardDimensions.w}%`,
              height: isFlipped || isThrowing || isDismissing ? "min(80vw, 320px)" : `${cardDimensions.h}%`,
              left: isFlipped || isThrowing || isDismissing ? "50%" : `${50 + x}%`,
              top: isFlipped || isThrowing || isDismissing ? "50%" : `${50 + y}%`,
              transform: isThrowing
                ? `translate(-50%, -50%) translateZ(100px) translate(${throwConfig.x}vw, ${throwConfig.y}vh) rotate(${throwConfig.rotate}deg) rotateY(0deg) scale(0.5)`
                : `translate(-50%, -50%) ${isFlipped || isDismissing ? "translateZ(150px)" : flippedCardId !== null && dismissingCardId === null ? "translateZ(-100px)" : "translateZ(0px)"} rotate(0deg) ${isRevealed ? "rotateY(180deg)" : "rotateY(0deg)"} scale(1)`,
            }}
          >
            <div className={`w-full h-full preserve-3d ${isTrembling && flippedCardId === card.id ? "animate-tremble" : ""}`}>
              <div className={`absolute inset-0 glass ${isFlipped || isThrowing || isDismissing ? "rounded-3xl sm:rounded-[2.5rem]" : "rounded-lg sm:rounded-xl"} border border-white/10 flex flex-col items-center justify-center backface-hidden [transform:translateZ(2px)] transition-all ${durationClass} ${timingFunc}`}>
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className={`rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-zinc-500 tabular-nums leading-none transition-all ${durationClass} ${timingFunc} aspect-square ${isFlipped || isThrowing || isDismissing ? "w-28 h-28 text-5xl sm:w-40 sm:h-40 sm:text-7xl" : "w-8 h-8 text-xs"}`}>
                    <span className="relative top-[0.05em]">{formatNumber(card.id + 1)}</span>
                  </div>
                </div>
              </div>

              <div className={`absolute inset-0 bg-zinc-100 text-black ${isFlipped || isThrowing || isDismissing ? "rounded-3xl sm:rounded-[2.5rem]" : "rounded-lg sm:rounded-xl"} flex flex-col items-center justify-between [transform:rotateY(180deg)_translateZ(2px)] backface-hidden p-6 text-center border-4 transition-all ${durationClass} ${timingFunc} ${card.side === "mafia" ? "border-mafia" : "border-citizen"}`}>
                <div className="w-full flex-1 flex flex-col items-center justify-center gap-2 relative z-10">
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">
                    {card.side === "mafia" ? t("defaultMafia") : t("defaultCitizen")}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{card.role}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkSeen(card.id); }}
                  className="w-full py-4 bg-black text-white rounded-xl text-sm font-bold leading-none flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg relative z-10"
                >
                  <Icon className="h-5 w-5"><path d="M20 6 9 17l-5-5" /></Icon>
                  {t("seen")}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
