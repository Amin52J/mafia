"use client";

import { CardCircle } from "./CardCircle";
import { GameControls } from "./GameControls";
import type { Card, Side } from "@/entities/card";
import type { Language, TranslationKey } from "@/features/language";

interface GameScreenProps {
  language: Language;
  t: (key: TranslationKey) => string;
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
  unseenCount: number;
  countdown: number;
  isSpeaking: boolean;
  isChallenging: boolean;
  isNight: boolean;
  speechDuration: number;
  challengeTime: number;
  extraTime: number;
  scenarioNotes: string;
  godsNote: string;
  showPlayerRoles: boolean;
  formatNumber: (v: number) => string;
  onFlip: (id: number) => void;
  onMarkSeen: (id: number) => void;
  onToggleSpeaking: () => void;
  onToggleChallenging: () => void;
  onToggleNight: () => void;
  onSpeechDurationChange: (val: string) => void;
  onChallengeTimeChange: (val: string) => void;
  onExtraTimeChange: (val: string) => void;
  onGodsNoteChange: (val: string) => void;
  onTogglePlayerRoles: () => void;
  onPlayerNameChange: (id: number, name: string) => void;
  onRestart: () => void;
  onHeaderRestart: () => void;
  godsNoteRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function GameScreen({
  language,
  t,
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
  countdown,
  isSpeaking,
  isChallenging,
  isNight,
  speechDuration,
  challengeTime,
  extraTime,
  scenarioNotes,
  godsNote,
  showPlayerRoles,
  formatNumber,
  onFlip,
  onMarkSeen,
  onToggleSpeaking,
  onToggleChallenging,
  onToggleNight,
  onSpeechDurationChange,
  onChallengeTimeChange,
  onExtraTimeChange,
  onGodsNoteChange,
  onTogglePlayerRoles,
  onPlayerNameChange,
  onRestart,
  onHeaderRestart,
  godsNoteRef,
}: GameScreenProps) {
  const backArrow = language === "fa" ? "→" : "←";

  return (
    <>
      <header className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between glass-dark sticky top-0 z-50">
        <button
          onClick={onHeaderRestart}
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          {backArrow} {t("reset")}
        </button>
        <h1 className="text-lg font-bold tracking-tight">{t("title")}</h1>
        <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-zinc-500 w-16" />
      </header>

      <main className="relative flex-1 p-4 sm:p-6 flex flex-col items-center justify-center">
        {unseenCount > 0 ? (
          <CardCircle
            cards={cards}
            flippedCardId={flippedCardId}
            revealedCardId={revealedCardId}
            isTrembling={isTrembling}
            dismissingCardId={dismissingCardId}
            throwingCardId={throwingCardId}
            throwConfig={throwConfig}
            lastFlippedSide={lastFlippedSide}
            isDisplayHidden={isDisplayHidden}
            cardDimensions={cardDimensions}
            formatNumber={formatNumber}
            t={t}
            onFlip={onFlip}
            onMarkSeen={onMarkSeen}
          />
        ) : (
          <GameControls
            language={language}
            t={t}
            countdown={countdown}
            isSpeaking={isSpeaking}
            isChallenging={isChallenging}
            isNight={isNight}
            speechDuration={speechDuration}
            challengeTime={challengeTime}
            extraTime={extraTime}
            scenarioNotes={scenarioNotes}
            godsNote={godsNote}
            showPlayerRoles={showPlayerRoles}
            cards={cards}
            formatNumber={formatNumber}
            onToggleSpeaking={onToggleSpeaking}
            onToggleChallenging={onToggleChallenging}
            onToggleNight={onToggleNight}
            onSpeechDurationChange={onSpeechDurationChange}
            onChallengeTimeChange={onChallengeTimeChange}
            onExtraTimeChange={onExtraTimeChange}
            onGodsNoteChange={onGodsNoteChange}
            onTogglePlayerRoles={onTogglePlayerRoles}
            onPlayerNameChange={onPlayerNameChange}
            onRestart={onRestart}
            godsNoteRef={godsNoteRef}
          />
        )}
      </main>
    </>
  );
}
