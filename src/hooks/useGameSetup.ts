"use client";

import { useState, useCallback } from "react";
import type { Scenario } from "@/entities/scenario";

function adjustArray(arr: string[], targetLength: number): string[] {
  const next = [...arr];
  while (next.length < targetLength) next.push("");
  if (next.length > targetLength) next.splice(targetLength);
  return next;
}

export function useGameSetup() {
  const [mafiasCount, setMafiasCount] = useState(0);
  const [citizensCount, setCitizensCount] = useState(0);
  const [mafiaRoles, setMafiaRoles] = useState<string[]>([]);
  const [citizenRoles, setCitizenRoles] = useState<string[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioNotes, setScenarioNotes] = useState("");

  const totalPlayers = mafiasCount + citizensCount;

  const updateMafiasCount = useCallback((count: number) => {
    setMafiasCount(count);
    setMafiaRoles((prev) => adjustArray(prev, count));
  }, []);

  const updateCitizensCount = useCallback((count: number) => {
    setCitizensCount(count);
    setCitizenRoles((prev) => adjustArray(prev, count));
  }, []);

  const updateMafiaRole = useCallback((index: number, value: string) => {
    setMafiaRoles((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const updateCitizenRole = useCallback((index: number, value: string) => {
    setCitizenRoles((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const loadScenario = useCallback((s: Scenario) => {
    setMafiasCount(s.mafiasCount);
    setCitizensCount(s.citizensCount);
    setMafiaRoles([...s.mafiaRoles]);
    setCitizenRoles([...s.citizenRoles]);
    setScenarioNotes(s.notes || "");
    setScenarioName(s.name);
  }, []);

  const reset = useCallback(() => {
    setMafiasCount(0);
    setCitizensCount(0);
    setMafiaRoles([]);
    setCitizenRoles([]);
    setScenarioName("");
    setScenarioNotes("");
  }, []);

  return {
    mafiasCount,
    citizensCount,
    mafiaRoles,
    citizenRoles,
    scenarioName,
    scenarioNotes,
    totalPlayers,
    setScenarioName,
    setScenarioNotes,
    updateMafiasCount,
    updateCitizensCount,
    updateMafiaRole,
    updateCitizenRole,
    loadScenario,
    reset,
  };
}
