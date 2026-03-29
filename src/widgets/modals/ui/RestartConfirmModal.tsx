"use client";

import { BottomSheet } from "@/shared/ui";
import type { TranslationKey } from "@/features/language";

interface RestartConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: TranslationKey) => string;
}

export function RestartConfirmModal({ open, onClose, onConfirm, t }: RestartConfirmModalProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={t("restart")} closeLabel={t("close")}>
      <div className="mt-4 space-y-4">
        <p className="text-sm font-medium text-zinc-300 leading-relaxed text-center">
          {t("confirmFinishGame")}
        </p>
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
            onClick={onConfirm}
            className="flex-1 py-4 bg-white text-black rounded-2xl text-sm font-black leading-none active:scale-95 transition-all shadow-xl inline-flex items-center justify-center"
          >
            {t("confirm")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
