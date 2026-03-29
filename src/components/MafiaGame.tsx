"use client";

import { useState, useEffect, useSyncExternalStore, useRef, useCallback } from "react";
import { useLanguage, LanguageSwitcher } from "@/features/language";
import { useAudio } from "@/features/audio";
import { useTimer } from "@/features/timer";
import { useScenarios } from "@/features/scenarios";
import { useCardDeck } from "@/features/cards";
import { createNumberFormatter, delocalizeDigits } from "@/shared/lib";
import { StatusToast } from "@/shared/ui";
import { useAutoResize, useBodyScrollLock, useStatusMessage } from "@/shared/hooks";
import { useGameSetup } from "@/hooks/useGameSetup";
import { useGameSession } from "@/hooks/useGameSession";

import { SetupScreen } from "@/widgets/setup-screen";
import { GameScreen } from "@/widgets/game-screen";
import { SaveScenarioModal, ManageScenariosModal, RestartConfirmModal } from "@/widgets/modals";

type ActiveModal = "save" | "manage" | "restart" | null;

export default function MafiaGame() {
  const { t, language, setLanguage } = useLanguage();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const setup = useGameSetup();
  const session = useGameSession();
  const status = useStatusMessage();

  const [isStarted, setIsStarted] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isExported, setIsExported] = useState(false);

  const saveInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const godsNoteRef = useRef<HTMLTextAreaElement>(null);

  const audio = useAudio();
  const timer = useTimer({
    playBell: audio.playBell,
    startBellRepeat: audio.startBellRepeat,
    stopBellRepeat: audio.stopBellRepeat,
  });
  const scenarios = useScenarios({ language, t: t as (key: string) => string });
  const cardDeck = useCardDeck({
    defaultMafiaLabel: t("defaultMafia"),
    defaultCitizenLabel: t("defaultCitizen"),
  });

  const formatter = createNumberFormatter(language);
  const formatNumber = useCallback((v: number) => formatter.format(v), [formatter]);

  useAutoResize(notesRef, setup.scenarioNotes);
  useAutoResize(godsNoteRef, session.godsNote);
  useBodyScrollLock(
    activeModal !== null ||
      cardDeck.flippedCardId !== null ||
      cardDeck.throwingCardId !== null
  );

  useEffect(() => {
    if (activeModal === "save") {
      const t = setTimeout(() => saveInputRef.current?.focus(), 550);
      return () => clearTimeout(t);
    }
  }, [activeModal]);

  useEffect(() => {
    if (!session.isNight) audio.stopNight();
    return () => {
      audio.stopNight();
    };
  }, [session.isNight, audio]);

  const parseLocalizedNumber = (val: string): number | null => {
    const normalized = delocalizeDigits(val);
    const num = parseInt(normalized.replace(/\D/g, ""), 10);
    return isNaN(num) ? (normalized === "" ? 0 : null) : num;
  };

  const handleSpeechDurationChange = (val: string) => {
    const num = parseLocalizedNumber(val);
    if (num !== null) timer.setSpeechDuration(num);
  };

  const handleChallengeTimeChange = (val: string) => {
    const num = parseLocalizedNumber(val);
    if (num !== null) timer.setChallengeTime(num);
  };

  const handleExtraTimeChange = (val: string) => {
    const num = parseLocalizedNumber(val);
    if (num !== null) timer.setExtraTime(num);
  };

  const startGame = async () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    cardDeck.createDeck(setup.mafiaRoles, setup.citizenRoles);
    setIsStarted(true);
    session.setGodsNote("");
    audio.clearPlayedSongs();
    await audio.handleAudioUnlock(false);
  };

  const restart = () => {
    setIsStarted(false);
    cardDeck.reset();
    session.reset();
    timer.stopAll();
    audio.clearPlayedSongs();
  };

  const toggleNight = async () => {
    const nextNight = !session.isNight;
    session.setIsNight(nextNight);
    if (nextNight) timer.stopAll();
    await audio.handleAudioUnlock(nextNight);
    if (nextNight) await audio.startNight();
    else audio.stopNight();
  };

  const toggleSpeaking = async () => {
    timer.toggleSpeaking();
    await audio.handleAudioUnlock(session.isNight);
  };

  const toggleChallenging = async () => {
    timer.toggleChallenging();
    await audio.handleAudioUnlock(session.isNight);
  };

  const saveScenario = () => {
    const trimmedName = setup.scenarioName.trim();
    if (!trimmedName) {
      setActiveModal("save");
      return;
    }
    const saved = scenarios.saveScenario(
      trimmedName,
      setup.scenarioNotes,
      setup.mafiasCount,
      setup.citizensCount,
      setup.mafiaRoles,
      setup.citizenRoles
    );
    if (saved) setActiveModal(null);
  };

  const handleResetSetup = () => {
    setup.reset();
    setActiveModal(null);
  };

  const handleExport = () => {
    scenarios.exportData(timer.speechDuration, timer.extraTime).then(() => {
      status.show(t("exportSuccess"), "success");
      setIsExported(true);
      setTimeout(() => setIsExported(false), 3000);
    });
  };

  const handleImport = async () => {
    try {
      const data = await scenarios.importData();
      if (typeof data.speechDuration === "number") timer.setSpeechDuration(data.speechDuration);
      if (typeof data.extraTime === "number") timer.setExtraTime(data.extraTime);
      if (typeof data.language === "string") setLanguage(data.language as "en" | "fa");
      status.show(t("importSuccess"), "success");
    } catch {
      status.show(t("importError"), "error");
    }
  };

  const handleConfirmRestart = () => {
    restart();
    setActiveModal(null);
  };

  const suggestedScenarios = scenarios.getSuggested(setup.mafiasCount, setup.citizensCount);

  if (!isClient) return <div className="min-h-screen bg-black" />;

  const dir = language === "fa" ? "rtl" : "ltr";

  if (isStarted) {
    return (
      <div
        dir={dir}
        className={`relative flex flex-col min-h-dvh bg-background text-foreground font-sans max-w-lg mx-auto ${cardDeck.unseenCount > 0 ? "overflow-hidden" : "overflow-x-hidden"}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

        <GameScreen
          language={language}
          t={t}
          cards={cardDeck.cards}
          flippedCardId={cardDeck.flippedCardId}
          revealedCardId={cardDeck.revealedCardId}
          isTrembling={cardDeck.isTrembling}
          dismissingCardId={cardDeck.dismissingCardId}
          throwingCardId={cardDeck.throwingCardId}
          throwConfig={cardDeck.throwConfig}
          lastFlippedSide={cardDeck.lastFlippedSide}
          isDisplayHidden={cardDeck.isDisplayHidden}
          cardDimensions={cardDeck.cardDimensions}
          unseenCount={cardDeck.unseenCount}
          countdown={timer.countdown}
          isSpeaking={timer.isSpeaking}
          isChallenging={timer.isChallenging}
          isNight={session.isNight}
          speechDuration={timer.speechDuration}
          challengeTime={timer.challengeTime}
          extraTime={timer.extraTime}
          scenarioNotes={setup.scenarioNotes}
          godsNote={session.godsNote}
          showPlayerRoles={session.showPlayerRoles}
          formatNumber={formatNumber}
          onFlip={cardDeck.flipCard}
          onMarkSeen={cardDeck.markSeen}
          onToggleSpeaking={toggleSpeaking}
          onToggleChallenging={toggleChallenging}
          onToggleNight={toggleNight}
          onSpeechDurationChange={handleSpeechDurationChange}
          onChallengeTimeChange={handleChallengeTimeChange}
          onExtraTimeChange={handleExtraTimeChange}
          onGodsNoteChange={session.setGodsNote}
          onTogglePlayerRoles={session.togglePlayerRoles}
          onPlayerNameChange={cardDeck.updatePlayerName}
          onRestart={() => setActiveModal("restart")}
          onHeaderRestart={() => setActiveModal("restart")}
          godsNoteRef={godsNoteRef}
        />

        <StatusToast message={status.message} />

        <RestartConfirmModal
          open={activeModal === "restart"}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmRestart}
          t={t}
        />
      </div>
    );
  }

  return (
    <div dir={dir} className="relative flex flex-col min-h-dvh bg-background text-foreground font-sans max-w-lg mx-auto overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

      <header className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex justify-between items-center sticky top-0 z-50 glass-dark">
        <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white">{t("title")}</h1>
        <LanguageSwitcher />
      </header>

      <SetupScreen
        language={language}
        t={t}
        mafiasCount={setup.mafiasCount}
        citizensCount={setup.citizensCount}
        mafiaRoles={setup.mafiaRoles}
        citizenRoles={setup.citizenRoles}
        scenarioName={setup.scenarioName}
        scenarioNotes={setup.scenarioNotes}
        suggestedScenarios={suggestedScenarios}
        onMafiasCountChange={setup.updateMafiasCount}
        onCitizensCountChange={setup.updateCitizensCount}
        onMafiaRoleChange={setup.updateMafiaRole}
        onCitizenRoleChange={setup.updateCitizenRole}
        onNotesChange={setup.setScenarioNotes}
        onSave={() => setActiveModal("save")}
        onReset={handleResetSetup}
        onManageScenarios={() => setActiveModal("manage")}
        onLoadScenario={setup.loadScenario}
        onStart={startGame}
        notesRef={notesRef}
      />

      <SaveScenarioModal
        open={activeModal === "save"}
        onClose={() => setActiveModal(null)}
        scenarioName={setup.scenarioName}
        onNameChange={setup.setScenarioName}
        onSave={saveScenario}
        t={t}
        saveInputRef={saveInputRef}
      />

      <ManageScenariosModal
        open={activeModal === "manage"}
        onClose={() => setActiveModal(null)}
        scenarios={scenarios.scenarios}
        language={language}
        t={t}
        isExported={isExported}
        onLoad={setup.loadScenario}
        onDelete={scenarios.deleteScenario}
        onRename={scenarios.renameScenario}
        onExport={handleExport}
        onImport={handleImport}
      />

      <StatusToast message={status.message} />
    </div>
  );
}
