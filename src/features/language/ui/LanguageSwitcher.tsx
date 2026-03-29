"use client";

import { useLanguage, type Language } from "../model/useLanguage";
import { Icon } from "@/shared/ui";

const LANGUAGES: Language[] = ["en", "fa"];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          onClick={() => setLanguage(l)}
          className={`inline-flex items-center justify-center gap-2 px-3 py-1 rounded-lg text-xs font-bold leading-none transition-all ${
            language === l ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15 15 0 0 1 0 20" />
            <path d="M12 2a15 15 0 0 0 0 20" />
          </Icon>
          {l === "en" ? t("english") : t("persian")}
        </button>
      ))}
    </div>
  );
}
