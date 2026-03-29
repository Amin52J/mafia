"use client";

import { BottomSheet } from "@/shared/ui";
import type { TranslationKey } from "@/features/language";

interface SaveScenarioModalProps {
  open: boolean;
  onClose: () => void;
  scenarioName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  t: (key: TranslationKey) => string;
  saveInputRef: React.RefObject<HTMLInputElement | null>;
}

export function SaveScenarioModal({
  open,
  onClose,
  scenarioName,
  onNameChange,
  onSave,
  t,
  saveInputRef,
}: SaveScenarioModalProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={t("saveScenario")} closeLabel={t("close")}>
      <div className="mt-4 space-y-3">
        <input
          ref={saveInputRef}
          placeholder={t("scenarioName")}
          value={scenarioName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === " ") e.stopPropagation(); }}
          className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm outline-none focus:border-white/40 font-bold"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-transparent border border-white/10 rounded-2xl text-sm font-bold leading-none text-zinc-400 hover:text-white transition-all active:scale-95 inline-flex items-center justify-center"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex-1 py-4 bg-white text-black rounded-2xl text-sm font-black leading-none active:scale-95 transition-all shadow-xl inline-flex items-center justify-center"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
