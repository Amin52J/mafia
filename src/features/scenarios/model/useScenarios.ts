"use client";

import { useState, useEffect, useCallback } from "react";
import type { Scenario } from "@/entities/scenario";
import type { Language } from "@/features/language";

interface UseScenariosOptions {
  language: Language;
  t: (key: string) => string;
}

export function useScenarios({ language, t }: UseScenariosOptions) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("scenarios");
    if (saved) {
      setTimeout(() => {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setScenarios(parsed.sort((a: Scenario, b: Scenario) => a.name.localeCompare(b.name)));
        }
      }, 0);
    }
  }, []);

  const persistScenarios = useCallback((next: Scenario[]) => {
    const sorted = [...next].sort((a, b) => a.name.localeCompare(b.name));
    setScenarios(sorted);
    localStorage.setItem("scenarios", JSON.stringify(sorted));
  }, []);

  const saveScenario = useCallback(
    (name: string, notes: string, mafiasCount: number, citizensCount: number, mafiaRoles: string[], citizenRoles: string[]): boolean => {
      const trimmedName = name.trim();
      if (!trimmedName) return false;

      const existingIndex = scenarios.findIndex(
        (s) => s.name === trimmedName && s.mafiasCount === mafiasCount && s.citizensCount === citizensCount
      );
      if (existingIndex !== -1) {
        const ok = window.confirm(t("confirmOverrideScenario"));
        if (!ok) return false;

        const updated = [...scenarios];
        updated[existingIndex] = {
          ...updated[existingIndex],
          notes: notes.trim() || undefined,
          mafiasCount,
          citizensCount,
          mafiaRoles,
          citizenRoles,
        };
        persistScenarios(updated);
        return true;
      }

      const newScenario: Scenario = {
        id: Math.random().toString(36).substring(2, 11),
        name: trimmedName,
        notes: notes.trim() || undefined,
        mafiasCount,
        citizensCount,
        mafiaRoles,
        citizenRoles,
      };
      persistScenarios([...scenarios, newScenario]);
      return true;
    },
    [scenarios, persistScenarios, t]
  );

  const deleteScenario = useCallback(
    (id: string) => {
      const ok = window.confirm(t("confirmDeleteScenario"));
      if (!ok) return;
      persistScenarios(scenarios.filter((s) => s.id !== id));
    },
    [scenarios, persistScenarios, t]
  );

  const renameScenario = useCallback(
    (id: string, name: string) => {
      const nextName = name.trim();
      if (!nextName) return;
      persistScenarios(scenarios.map((s) => (s.id === id ? { ...s, name: nextName } : s)));
    },
    [scenarios, persistScenarios]
  );

  const exportData = useCallback(
    (speechDuration: number, extraTime: number) => {
      const data = { scenarios, speechDuration, extraTime, language };
      return navigator.clipboard.writeText(JSON.stringify(data));
    },
    [scenarios, language]
  );

  const importData = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    const data = JSON.parse(text);
    if (data.scenarios && Array.isArray(data.scenarios)) {
      setScenarios(data.scenarios);
      localStorage.setItem("scenarios", JSON.stringify(data.scenarios));
    }
    if (typeof data.speechDuration === "number") {
      localStorage.setItem("speechDuration", data.speechDuration.toString());
    }
    if (typeof data.extraTime === "number") {
      localStorage.setItem("extraTime", data.extraTime.toString());
    }
    if (typeof data.language === "string") {
      localStorage.setItem("language", data.language);
    }
    return data;
  }, []);

  const getSuggested = useCallback(
    (mafiasCount: number, citizensCount: number) =>
      scenarios.filter((s) => s.mafiasCount === mafiasCount && s.citizensCount === citizensCount),
    [scenarios]
  );

  return {
    scenarios,
    saveScenario,
    deleteScenario,
    renameScenario,
    exportData,
    importData,
    getSuggested,
  };
}
