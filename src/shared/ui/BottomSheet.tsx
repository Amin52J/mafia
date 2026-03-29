"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  maxHeight?: boolean;
}

export function BottomSheet({ open, onClose, title, closeLabel, children, maxHeight }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className={`absolute inset-x-0 bottom-0 safe-pb px-6 pb-6 ${maxHeight ? "max-h-full flex flex-col justify-end" : ""}`}>
        <div className={`glass rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up ${maxHeight ? "flex flex-col max-h-[90dvh]" : ""}`}>
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="text-sm font-black tracking-tight">{title}</div>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-zinc-300 hover:bg-white/10 active:scale-95 transition-all inline-flex items-center justify-center"
            >
              <Icon className="h-5 w-5">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </Icon>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
