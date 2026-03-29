"use client";

import { Icon, CountStepper } from "@/shared/ui";
import { localizeDigits, createNumberFormatter } from "@/shared/lib";
import type { Scenario } from "@/entities/scenario";
import type { Language, TranslationKey } from "@/features/language";

interface SetupScreenProps {
  language: Language;
  t: (key: TranslationKey) => string;
  mafiasCount: number;
  citizensCount: number;
  mafiaRoles: string[];
  citizenRoles: string[];
  scenarioName: string;
  scenarioNotes: string;
  suggestedScenarios: Scenario[];
  onMafiasCountChange: (count: number) => void;
  onCitizensCountChange: (count: number) => void;
  onMafiaRoleChange: (index: number, value: string) => void;
  onCitizenRoleChange: (index: number, value: string) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onReset: () => void;
  onManageScenarios: () => void;
  onLoadScenario: (s: Scenario) => void;
  onStart: () => void;
  notesRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function SetupScreen({
  language,
  t,
  mafiasCount,
  citizensCount,
  mafiaRoles,
  citizenRoles,
  scenarioName,
  scenarioNotes,
  suggestedScenarios,
  onMafiasCountChange,
  onCitizensCountChange,
  onMafiaRoleChange,
  onCitizenRoleChange,
  onNotesChange,
  onSave,
  onReset,
  onManageScenarios,
  onLoadScenario,
  onStart,
  notesRef,
}: SetupScreenProps) {
  const formatter = createNumberFormatter(language);
  const formatNumber = (v: number) => formatter.format(v);
  const totalPlayers = mafiasCount + citizensCount;

  return (
    <>
      <main className="relative flex-1 p-6 pb-40 space-y-10 animate-fade-in">
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CountStepper
              label={t("mafiasCount")}
              value={mafiasCount}
              onChange={onMafiasCountChange}
              accent="mafia"
              formatNumber={formatNumber}
              decreaseLabel={t("decrease")}
              increaseLabel={t("increase")}
            />
            <CountStepper
              label={t("citizensCount")}
              value={citizensCount}
              onChange={onCitizensCountChange}
              accent="citizen"
              formatNumber={formatNumber}
              decreaseLabel={t("decrease")}
              increaseLabel={t("increase")}
            />
          </div>

          <button
            type="button"
            onClick={onManageScenarios}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold leading-none text-zinc-200 hover:bg-white/10 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
          >
            <Icon className="h-5 w-5">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </Icon>
            {t("manageScenarios")}
          </button>

          {suggestedScenarios.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3 px-1">
                <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  {t("suggestedScenarios")}
                </label>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {suggestedScenarios.map((s) => {
                  const isSelected = s.name === scenarioName;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onLoadScenario(s)}
                      className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? "bg-white text-black shadow-lg"
                          : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="max-w-[12rem] truncate">
                          {localizeDigits(s.name, language)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                            isSelected ? "bg-black/10 text-black/60" : "bg-white/5 text-zinc-300"
                          }`}
                        >
                          <span className="text-mafia">{formatNumber(s.mafiasCount)}</span>
                          <span className={isSelected ? "text-black/40" : "text-zinc-500"}>/</span>
                          <span className="text-citizen">{formatNumber(s.citizensCount)}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {(mafiasCount > 0 || citizensCount > 0) && (
          <section className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black tracking-tight">{t("roles")}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="space-y-4">
              {mafiaRoles.map((role, i) => (
                <div key={`m-${i}`} className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-mafia shadow-[0_0_8px_rgba(255,59,59,0.5)]" />
                  <input
                    placeholder={`${t("mafiaRole")} ${formatNumber(i + 1)}`}
                    value={role}
                    onChange={(e) => onMafiaRoleChange(i, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-4 pl-10 text-sm outline-none focus:border-mafia/30 focus:bg-white/[0.08] transition-all font-medium"
                  />
                </div>
              ))}
              {citizenRoles.map((role, i) => (
                <div key={`c-${i}`} className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-citizen shadow-[0_0_8px_rgba(0,209,255,0.5)]" />
                  <input
                    placeholder={`${t("citizenRole")} ${formatNumber(i + 1)}`}
                    value={role}
                    onChange={(e) => onCitizenRoleChange(i, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-4 pl-10 text-sm outline-none focus:border-citizen/30 focus:bg-white/[0.08] transition-all font-medium"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex flex-col gap-4">
                <textarea
                  ref={notesRef}
                  placeholder={`${t("notes")} (${t("optional")})`}
                  value={scenarioNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === " ") e.stopPropagation(); }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-white/20 transition-all font-medium resize-none min-h-[100px] overflow-hidden"
                />
                <div className="flex gap-3">
                  <button
                    onClick={onSave}
                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold leading-none inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Icon className="h-5 w-5">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </Icon>
                    {t("saveScenario")}
                  </button>
                  <button
                    onClick={onReset}
                    className="px-8 py-4 bg-transparent border border-white/10 rounded-2xl text-sm font-bold leading-none text-zinc-500 hover:text-white transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    <Icon className="h-5 w-5">
                      <path d="M21 12a9 9 0 1 1-3-6.7" />
                      <path d="M21 3v6h-6" />
                    </Icon>
                    {t("reset")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-50">
        <div className="max-w-lg mx-auto px-6 safe-pb pt-6 bg-gradient-to-t from-black via-black/70 to-transparent">
          <button
            onClick={onStart}
            disabled={totalPlayers <= 0}
            className={`w-full py-5 rounded-3xl font-black text-xl transition-all shadow-[0_10px_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 ${
              totalPlayers <= 0
                ? "bg-white/20 text-white/50"
                : "bg-white text-black active:scale-95"
            }`}
          >
            <Icon className="h-6 w-6">
              <path d="M8 5v14l11-7z" />
            </Icon>
            <span>{t("start")}</span>
          </button>
        </div>
      </footer>
    </>
  );
}
