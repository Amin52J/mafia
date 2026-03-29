"use client";

import { useState, useRef, useEffect } from "react";
import { BottomSheet, Icon } from "@/shared/ui";
import { localizeDigits, createNumberFormatter } from "@/shared/lib";
import type { Scenario } from "@/entities/scenario";
import type { Language, TranslationKey } from "@/features/language";

interface ManageScenariosModalProps {
  open: boolean;
  onClose: () => void;
  scenarios: Scenario[];
  language: Language;
  t: (key: TranslationKey) => string;
  isExported: boolean;
  onLoad: (s: Scenario) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onExport: () => void;
  onImport: () => void;
}

export function ManageScenariosModal({
  open,
  onClose,
  scenarios,
  language,
  t,
  isExported,
  onLoad,
  onDelete,
  onRename,
  onExport,
  onImport,
}: ManageScenariosModalProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) {
      const timer = setTimeout(() => renameInputRef.current?.focus(), 550);
      return () => clearTimeout(timer);
    }
  }, [renamingId]);

  const handleClose = () => {
    setRenamingId(null);
    setRenameValue("");
    onClose();
  };

  const formatter = createNumberFormatter(language);
  const formatNumber = (v: number) => formatter.format(v);

  const grouped = scenarios.reduce((acc, s) => {
    const total = s.mafiasCount + s.citizensCount;
    if (!acc[total]) acc[total] = [];
    acc[total].push(s);
    return acc;
  }, {} as Record<number, Scenario[]>);

  return (
    <BottomSheet open={open} onClose={handleClose} title={t("savedScenarios")} closeLabel={t("close")} maxHeight>
      <div className="mt-4 overflow-y-auto pr-1 flex-1">
        {scenarios.length === 0 ? (
          <div className="py-8 text-center text-sm font-bold text-zinc-500">{t("noSavedScenarios")}</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([count, groupScenarios]) => (
                <div key={count} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-px flex-1 bg-white/5" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      {t("playersCount").replace("{count}", formatNumber(Number(count)))}
                    </div>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    {groupScenarios.map((s) => {
                      const isRenaming = renamingId === s.id;
                      return (
                        <div key={s.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                          <button
                            type="button"
                            onKeyDown={(e) => { if (e.key === " " && isRenaming) e.stopPropagation(); }}
                            onClick={() => { if (isRenaming) return; onLoad(s); handleClose(); }}
                            className={`min-w-0 flex-1 text-left ${isRenaming ? "cursor-default" : ""}`}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-3">
                                {isRenaming ? (
                                  <input
                                    ref={renameInputRef}
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    placeholder={t("scenarioName")}
                                    className="w-full bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-white/40"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => { if (e.key === " ") e.stopPropagation(); }}
                                  />
                                ) : (
                                  <div className="truncate text-sm font-black">{localizeDigits(s.name, language)}</div>
                                )}
                                <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black text-zinc-300 tabular-nums">
                                  <span className="text-mafia">{formatNumber(s.mafiasCount)}</span>
                                  <span className="text-zinc-500">/</span>
                                  <span className="text-citizen">{formatNumber(s.citizensCount)}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                          {isRenaming ? (
                            <button
                              type="button"
                              aria-label={t("save")}
                              onClick={() => { onRename(s.id, renameValue); setRenamingId(null); setRenameValue(""); }}
                              className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white text-black active:scale-95 transition-all inline-flex items-center justify-center self-start"
                            >
                              <Icon className="h-5 w-5"><path d="M20 6 9 17l-5-5" /></Icon>
                            </button>
                          ) : (
                            <button
                              type="button"
                              aria-label={t("rename")}
                              onClick={() => { setRenamingId(s.id); setRenameValue(s.name); }}
                              className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 active:scale-95 transition-all inline-flex items-center justify-center"
                            >
                              <Icon className="h-5 w-5"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icon>
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={t("delete")}
                            onClick={() => onDelete(s.id)}
                            className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all inline-flex items-center justify-center"
                          >
                            <Icon className="h-5 w-5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Icon>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={onExport}
          className={`w-full h-12 rounded-2xl font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
            isExported ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white text-black"
          }`}
        >
          <Icon className="h-5 w-5">
            {isExported ? <path d="M20 6 9 17l-5-5" /> : <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>}
          </Icon>
          {isExported ? t("exportSuccess") : t("export")}
        </button>
        <button
          type="button"
          onClick={onImport}
          className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white font-black text-sm hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Icon className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>
          {t("import")}
        </button>
      </div>
    </BottomSheet>
  );
}
