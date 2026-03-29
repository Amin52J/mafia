"use client";

import { Icon } from "@/shared/ui";
import type { Language, TranslationKey } from "@/features/language";

interface GameControlsProps {
  language: Language;
  t: (key: TranslationKey) => string;
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
  cards: { id: number; role: string; side: string; initialIndex: number; playerName?: string }[];
  formatNumber: (v: number) => string;
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
  godsNoteRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function GameControls({
  language,
  t,
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
  cards,
  formatNumber,
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
  godsNoteRef,
}: GameControlsProps) {
  const timeUnit = language === "fa" ? "ثانیه" : "s";
  const unitPosition = language === "fa" ? "left-3" : "right-3";

  return (
    <div className="w-full max-w-sm flex flex-col items-center animate-zoom-in">
      <div className="mb-8 text-4xl">🎭</div>

      <div className="w-full space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onToggleSpeaking}
            className={`py-4 rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 border ${
              isSpeaking ? "bg-red-500 text-white border-transparent" : "bg-zinc-800 text-white border-white/10"
            }`}
          >
            {language === "en"
              ? isSpeaking ? t("stop").toUpperCase() : t("speak").toUpperCase()
              : isSpeaking ? t("stop") : t("speak")}
          </button>
          <button
            onClick={onToggleChallenging}
            className={`py-4 rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 border ${
              isChallenging ? "bg-red-500 text-white border-transparent" : "bg-zinc-800 text-white border-white/10"
            }`}
          >
            {language === "en"
              ? isChallenging ? t("stop").toUpperCase() : t("challenge").toUpperCase()
              : isChallenging ? t("stop") : t("challenge")}
          </button>
          <button
            onClick={onToggleNight}
            className={`col-span-2 py-4 rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 border ${
              isNight ? "bg-white text-black border-transparent" : "bg-zinc-800 text-white border-white/10"
            }`}
          >
            {isNight ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                {language === "en" ? t("day").toUpperCase() : t("day")}
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                {language === "en" ? t("night").toUpperCase() : t("night")}
              </>
            )}
          </button>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6 flex flex-col items-center gap-4">
          <div className={`text-6xl font-black tabular-nums transition-colors duration-300 ${
            countdown > extraTime ? "text-green-500" : countdown >= 0 ? "text-yellow-400" : "text-red-500"
          }`}>
            {formatNumber(countdown)}
          </div>

          <div className="w-full grid grid-cols-2 gap-4">
            <TimerInput label={t("speechDuration")} value={formatNumber(speechDuration)} onChange={onSpeechDurationChange} unit={timeUnit} unitPosition={unitPosition} language={language} />
            <TimerInput label={t("challengeTime")} value={formatNumber(challengeTime)} onChange={onChallengeTimeChange} unit={timeUnit} unitPosition={unitPosition} language={language} />
            <div className="col-span-2">
              <TimerInput label={t("extraTime")} value={formatNumber(extraTime)} onChange={onExtraTimeChange} unit={timeUnit} unitPosition={unitPosition} language={language} />
            </div>
          </div>
        </div>
      </div>

      {scenarioNotes && (
        <div className="w-full mb-8 glass rounded-3xl border border-white/10 p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 text-center">{t("notes")}</div>
          <div className="text-sm font-medium text-zinc-200 leading-relaxed whitespace-pre-wrap">{scenarioNotes}</div>
        </div>
      )}

      <div className="w-full mb-8 glass rounded-3xl border border-white/10 p-6">
        <button
          onClick={onTogglePlayerRoles}
          className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
        >
          <span className="flex-1 text-center">{t("playerRoles")}</span>
          <Icon className={`h-4 w-4 transition-transform duration-300 ${showPlayerRoles ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" />
          </Icon>
        </button>
        {showPlayerRoles && (
          <div className="mt-6 space-y-4 animate-fade-in">
            {[...cards].sort((a, b) => a.initialIndex - b.initialIndex).map((card) => (
              <div key={card.id} className="flex items-center gap-3 text-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${card.side === "mafia" ? "bg-mafia/10 border-mafia text-mafia" : "bg-citizen/10 border-citizen text-citizen"}`}>
                  {formatNumber(card.id + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 truncate">{card.role}</div>
                  <input
                    type="text"
                    value={card.playerName || ""}
                    onChange={(e) => onPlayerNameChange(card.id, e.target.value)}
                    placeholder={t("playerName")}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full mb-8 glass rounded-3xl border border-white/10 p-6">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 text-center">{t("godsNote")}</div>
        <textarea
          ref={godsNoteRef}
          value={godsNote}
          onChange={(e) => onGodsNoteChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === " ") e.stopPropagation(); }}
          className="w-full bg-transparent text-sm font-medium text-zinc-200 leading-relaxed outline-none resize-none overflow-hidden placeholder:text-zinc-600"
          placeholder={t("godsNote")}
        />
      </div>

      <button
        onClick={onRestart}
        className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg leading-none inline-flex items-center justify-center active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
      >
        {t("restart")}
      </button>
    </div>
  );
}

function TimerInput({ label, value, onChange, unit, unitPosition, language }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  unit: string;
  unitPosition: string;
  language: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block text-center">
        {language === "en" ? label.toUpperCase() : label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all tabular-nums"
        />
        <span className={`absolute ${unitPosition} top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 ${language === "en" ? "uppercase" : ""}`}>
          {unit}
        </span>
      </div>
    </div>
  );
}
