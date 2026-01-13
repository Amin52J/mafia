"use client";

import { useState, useEffect, useSyncExternalStore, useRef, useCallback, type ReactNode } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Scenario, Card } from "@/types/game";

export default function MafiaGame() {
  const { t, language, setLanguage } = useLanguage();
  const backArrow = language === "fa" ? "→" : "←";
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  
  // Game Setup State
  const [mafiasCount, setMafiasCount] = useState<number>(0);
  const [citizensCount, setCitizensCount] = useState<number>(0);
  const [mafiaRoles, setMafiaRoles] = useState<string[]>([]);
  const [citizenRoles, setCitizenRoles] = useState<string[]>([]);
  
  // App State
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCardId, setFlippedCardId] = useState<number | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioNotes, setScenarioNotes] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [showManageScenarios, setShowManageScenarios] = useState(false);
  const [renamingScenarioId, setRenamingScenarioId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isExported, setIsExported] = useState(false);
  
  // Game Controls State
  const [isNight, setIsNight] = useState(false);
  const [speechDuration, setSpeechDuration] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("speechDuration");
      return saved ? parseInt(saved, 10) : 40;
    }
    return 40;
  });
  const [extraTime, setExtraTime] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("extraTime");
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [countdown, setCountdown] = useState(speechDuration);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const nightAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellRepeatAudioRef = useRef<HTMLAudioElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isAudioUnlockedRef = useRef(false);
  const needsAudioReunlockRef = useRef(false);
  const isNightRef = useRef(false);
  const lastUnlockAttemptAtRef = useRef(0);

  useEffect(() => {
    isNightRef.current = isNight;
  }, [isNight]);

  const isIOSDevice = useCallback(() => {
    const ua = navigator.userAgent;
    const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ often reports as Mac; maxTouchPoints is a common workaround.
    const isIpadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const hasMSStream = !!(window as Window & { MSStream?: unknown }).MSStream;
    return (isAppleMobile || isIpadOs) && !hasMSStream;
  }, []);

  const playSound = useCallback(async (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
      audio.muted = false;
      // iOS can get into a weird state after background/lock/interruption; re-load helps sometimes.
      if (needsAudioReunlockRef.current) {
        try {
          audio.load();
        } catch {
          // ignore
        }
      }
      await audio.play();
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        // Ignore AbortError as it's likely a new load/play request
        return;
      }

      // After an interruption on iOS PWA, we'll need a fresh user gesture to re-enable audio.
      if (isIOSDevice()) {
        needsAudioReunlockRef.current = true;
        isAudioUnlockedRef.current = false;
      }
      console.warn("Audio play failed:", e);
      setStatusMessage({ text: t("tapToEnableAudio"), type: "error" });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  }, [t, isIOSDevice]);

  const handleAudioUnlock = useCallback(async (skipElements: (HTMLAudioElement | null)[] = []) => {
    // On Chrome, we only need to do this once.
    // On iOS, we might need to do it again after interruptions, but usually once per session is okay.
    const isIOS = isIOSDevice();
    if (isAudioUnlockedRef.current && !isIOS) return;

    const audios = [
      nightAudioRef.current,
      bellAudioRef.current,
      bellRepeatAudioRef.current,
      silentAudioRef.current
    ];

    let anySucceeded = false;

    for (const audio of audios) {
      if (audio && !skipElements.includes(audio)) {
        // Skip if already playing and unmuted (likely currently in use)
        if (!audio.paused && !audio.muted && audio !== silentAudioRef.current) continue;
        // Skip silent keeper if already playing
        if (audio === silentAudioRef.current && !audio.paused) continue;

        const wasMuted = audio.muted;
        try {
          // Some iOS interruption states recover more reliably if we force a reload.
          try {
            audio.load();
          } catch {
            // ignore
          }
          audio.muted = true;
          await audio.play();
          anySucceeded = true;
          if (audio === silentAudioRef.current) {
            audio.muted = false;
            audio.volume = 0.001;
          } else {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = wasMuted;
          }
        } catch {
          audio.muted = wasMuted;
        }
      }
    }

    if (anySucceeded) {
      isAudioUnlockedRef.current = true;
      needsAudioReunlockRef.current = false;
    }
  }, [isIOSDevice]);

  useEffect(() => {
    const markNeedsReunlock = () => {
      if (!isIOSDevice()) return;
      needsAudioReunlockRef.current = true;
      isAudioUnlockedRef.current = false;

      // Don't attempt autoplay here (often blocked); just reset so the next tap can re-enable.
      try {
        silentAudioRef.current?.pause();
        if (silentAudioRef.current) silentAudioRef.current.currentTime = 0;
        silentAudioRef.current?.load();
      } catch {
        // ignore
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markNeedsReunlock();
      } else {
        markNeedsReunlock();
      }
    };

    const handleFocus = () => {
      markNeedsReunlock();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isIOSDevice]);

  useEffect(() => {
    const initAudio = () => {
      if (!nightAudioRef.current) {
        nightAudioRef.current = new Audio("/night.mp3");
        nightAudioRef.current.loop = true;
        nightAudioRef.current.preload = "auto";
        nightAudioRef.current.setAttribute("playsinline", "true");
        nightAudioRef.current.setAttribute("webkit-playsinline", "true");
      }
      if (!bellAudioRef.current) {
        bellAudioRef.current = new Audio("/bell.mp3");
        bellAudioRef.current.preload = "auto";
        bellAudioRef.current.setAttribute("playsinline", "true");
        bellAudioRef.current.setAttribute("webkit-playsinline", "true");
      }
      if (!bellRepeatAudioRef.current) {
        bellRepeatAudioRef.current = new Audio("/bell-repeat.mp3");
        bellRepeatAudioRef.current.loop = true;
        bellRepeatAudioRef.current.preload = "auto";
        bellRepeatAudioRef.current.setAttribute("playsinline", "true");
        bellRepeatAudioRef.current.setAttribute("webkit-playsinline", "true");
      }
      if (!silentAudioRef.current) {
        // Use a tiny silent base64 mp3 or just one of the files at very low volume
        silentAudioRef.current = new Audio("data:audio/mpeg;base64,SUQzBAAAAAABAFRYWFhYAAAAHAAAAERlYnVnZ2luZyBpbmZvcm1hdGlvbgAAMi40LjADAQAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUE9XWUVSTUVTU0FHRREAAAABvH0UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUE9XWUVSTUVTU0FHRREAAAABvH0UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
        silentAudioRef.current.loop = true;
        silentAudioRef.current.volume = 0.001;
        silentAudioRef.current.preload = "auto";
        silentAudioRef.current.setAttribute("playsinline", "true");
        silentAudioRef.current.setAttribute("webkit-playsinline", "true");
      }

      // Try to load
      nightAudioRef.current?.load();
      bellAudioRef.current?.load();
      bellRepeatAudioRef.current?.load();
      silentAudioRef.current?.load();
    };

    initAudio();

    // iOS PWA can lose audio after lock/background; keep a lightweight interaction hook
    // so the next user gesture can re-unlock audio.
    const handleInteraction = () => {
      const now = Date.now();
      if (now - lastUnlockAttemptAtRef.current < 350) return;
      lastUnlockAttemptAtRef.current = now;

      if (!isAudioUnlockedRef.current || needsAudioReunlockRef.current) {
        void handleAudioUnlock();
      }

      // If we're currently in night mode and audio got interrupted, try to resume it on the next tap.
      if (isNightRef.current && nightAudioRef.current?.paused) {
        nightAudioRef.current.currentTime = 0;
        void playSound(nightAudioRef.current);
      }
    };

    document.addEventListener("touchstart", handleInteraction, { passive: true });
    document.addEventListener("click", handleInteraction);
    document.addEventListener("pointerdown", handleInteraction);

    return () => {
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("pointerdown", handleInteraction);
    };
  }, [handleAudioUnlock, playSound]);

  const saveInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = "auto";
      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
    }
  }, [scenarioNotes]);

  useEffect(() => {
    if (showSaveInput) {
      const timer = setTimeout(() => {
        saveInputRef.current?.focus();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [showSaveInput]);

  useEffect(() => {
    if (renamingScenarioId) {
      const timer = setTimeout(() => {
        renameInputRef.current?.focus();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [renamingScenarioId]);

  useEffect(() => {
    if (showSaveInput || showManageScenarios) {
      // Prevent background scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showSaveInput, showManageScenarios]);

  useEffect(() => {
    localStorage.setItem("speechDuration", speechDuration.toString());
  }, [speechDuration]);

  useEffect(() => {
    localStorage.setItem("extraTime", extraTime.toString());
  }, [extraTime]);

  useEffect(() => {
    // Avoid starting audio from an effect (not a user gesture). Night audio should be started
    // from the explicit user action that toggles night.
    if (!isNight) {
      nightAudioRef.current?.pause();
    }
    return () => {
      nightAudioRef.current?.pause();
    };
  }, [isNight]);

  useEffect(() => {
    if (isSpeaking) {
      setCountdown(speechDuration);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= -extraTime) return prev;
          const next = prev - 1;
          if (next === extraTime) {
            if (bellAudioRef.current) bellAudioRef.current.currentTime = 0;
            void playSound(bellAudioRef.current);
          } else if (next === 0) {
            if (bellAudioRef.current) bellAudioRef.current.currentTime = 0;
            void playSound(bellAudioRef.current);
          } else if (next === -extraTime) {
            if (bellRepeatAudioRef.current) bellRepeatAudioRef.current.currentTime = 0;
            void playSound(bellRepeatAudioRef.current);
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      bellRepeatAudioRef.current?.pause();
      if (bellRepeatAudioRef.current) bellRepeatAudioRef.current.currentTime = 0;
      setCountdown(speechDuration);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      bellRepeatAudioRef.current?.pause();
    };
  }, [isSpeaking, speechDuration, extraTime, playSound]);

  const delocalizeDigits = (text: string) => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    let normalized = text;
    for (let i = 0; i <= 9; i++) {
      normalized = normalized.replace(persianDigits[i], i.toString());
    }
    return normalized;
  };

  const handleSpeechDurationChange = (val: string) => {
    const normalized = delocalizeDigits(val);
    const num = parseInt(normalized.replace(/\D/g, ""), 10);
    if (!isNaN(num)) {
      setSpeechDuration(num);
      if (!isSpeaking) setCountdown(num);
    } else if (normalized === "") {
      setSpeechDuration(0);
      if (!isSpeaking) setCountdown(0);
    }
  };

  const handleExtraTimeChange = (val: string) => {
    const normalized = delocalizeDigits(val);
    const num = parseInt(normalized.replace(/\D/g, ""), 10);
    if (!isNaN(num)) {
      setExtraTime(num);
    } else if (normalized === "") {
      setExtraTime(0);
    }
  };

  const toggleNight = () => {
    const nextNight = !isNight;
    setIsNight(nextNight);
    // Directly handle audio in click handler for iOS Safari/PWA
    void handleAudioUnlock(nextNight ? [nightAudioRef.current] : []);
    if (nextNight) {
      if (nightAudioRef.current) {
        nightAudioRef.current.currentTime = 0;
        void playSound(nightAudioRef.current);
      }
    } else {
      nightAudioRef.current?.pause();
    }
  };

  const toggleSpeaking = () => {
    const nextSpeaking = !isSpeaking;
    setIsSpeaking(nextSpeaking);
    // Pre-unlock sounds on click
    void handleAudioUnlock();
  };

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

  if (!isClient) {
    return <div className="min-h-screen bg-black" />;
  }

  const handleMafiasCountChange = (count: number) => {
    setMafiasCount(count);
    setMafiaRoles(prev => {
      const next = [...prev];
      if (next.length < count) {
        for (let i = next.length; i < count; i++) next.push("");
      } else if (next.length > count) {
        next.splice(count);
      }
      return next;
    });
  };

  const handleCitizensCountChange = (count: number) => {
    setCitizensCount(count);
    setCitizenRoles(prev => {
      const next = [...prev];
      if (next.length < count) {
        for (let i = next.length; i < count; i++) next.push("");
      } else if (next.length > count) {
        next.splice(count);
      }
      return next;
    });
  };

  const totalPlayers = mafiasCount + citizensCount;
  const numberFormatter = new Intl.NumberFormat(
    language === "fa" ? "fa-IR-u-nu-arabext" : "en-US"
  );
  const formatNumber = (value: number) => numberFormatter.format(value);

  const localizeDigits = (text: string) => {
    if (language !== "fa") return text;
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    return text.replace(/\d/g, (d) => persianDigits[Number(d)] ?? d);
  };

  const Icon = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className ?? "h-5 w-5"} block shrink-0`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );

  const CountStepper = ({
    label,
    value,
    onChange,
    accent,
  }: {
    label: string;
    value: number;
    onChange: (next: number) => void;
    accent: "mafia" | "citizen";
  }) => {
    const decDisabled = value <= 0;
    const accentDotClass = accent === "mafia" ? "bg-mafia" : "bg-citizen";
    const accentRingClass =
      accent === "mafia"
        ? "focus-visible:outline-mafia/50"
        : "focus-visible:outline-citizen/50";

    return (
      <div className="glass rounded-3xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${accentDotClass} shadow-[0_0_14px_rgba(255,255,255,0.12)]`} />
              <span className="block text-xs font-black uppercase tracking-widest text-zinc-500">
                {label}
              </span>
            </div>
            <div className="mt-2 text-4xl font-black tracking-tight tabular-nums">
              {formatNumber(value)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t("decrease")}
              disabled={decDisabled}
              onClick={() => onChange(Math.max(0, value - 1))}
              className={`h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-lg font-black transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${accentRingClass} ${decDisabled ? "opacity-40" : "hover:bg-white/10"}`}
            >
              −
            </button>
            <button
              type="button"
              aria-label={t("increase")}
              onClick={() => onChange(value + 1)}
              className={`h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-lg font-black transition-all hover:bg-white/10 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${accentRingClass}`}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const saveScenario = () => {
    if (!scenarioName.trim()) {
      setShowSaveInput(true);
      return;
    }

    const newScenario: Scenario = {
      id: Math.random().toString(36).substring(2, 11),
      name: scenarioName.trim(),
      notes: scenarioNotes.trim() || undefined,
      mafiasCount,
      citizensCount,
      mafiaRoles,
      citizenRoles,
    };

    const updated = [...scenarios, newScenario].sort((a, b) => a.name.localeCompare(b.name));
    setScenarios(updated);
    localStorage.setItem("scenarios", JSON.stringify(updated));
    setScenarioName("");
    setShowSaveInput(false);
  };

  const loadScenario = (s: Scenario) => {
    setMafiasCount(s.mafiasCount);
    setCitizensCount(s.citizensCount);
    setMafiaRoles(s.mafiaRoles);
    setCitizenRoles(s.citizenRoles);
    setScenarioNotes(s.notes || "");
  };

  const resetSetup = () => {
    setMafiasCount(0);
    setCitizensCount(0);
    setMafiaRoles([]);
    setCitizenRoles([]);
    setScenarioName("");
    setScenarioNotes("");
    setShowSaveInput(false);
  };

  const startGame = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    const allRoles = [
      ...mafiaRoles.map(r => ({role: r.trim() || t("defaultMafia"), side: 'mafia'})),
      ...citizenRoles.map(r => ({role: r.trim() || t("defaultCitizen"), side: 'citizen'})),
    ];

    // Shuffle
    const shuffled = allRoles
      .map(({role, side}) => ({ role, side, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ role, side }, index) => ({
        id: index,
        role,
        isFlipped: false,
        isSeen: false,
        side: side as "citizen" | "mafia",
      }));

    setCards(shuffled);
    setIsStarted(true);
    setFlippedCardId(null);

    // Unlock audio and resume context for iOS Safari PWA
    void handleAudioUnlock();
  };

  const flipCard = (id: number) => {
    if (flippedCardId !== null) return;

    const target = cards.find((c) => c.id === id);
    if (!target || target.isSeen) return;

    setFlippedCardId(id);
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
  };

  const markSeen = (id: number) => {
    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, isSeen: true, isFlipped: false } : c))
    );
    setFlippedCardId(null);
  };

  const restart = () => {
    setIsStarted(false);
    setCards([]);
    setFlippedCardId(null);
    setIsNight(false);
    setIsSpeaking(false);
  };

  const exportData = () => {
    const data = {
      scenarios,
      speechDuration,
      extraTime,
      language
    };
    navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
      setStatusMessage({ text: t("exportSuccess"), type: "success" });
      setIsExported(true);
      setTimeout(() => {
        setStatusMessage(null);
        setIsExported(false);
      }, 3000);
    });
  };

  const importData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (data.scenarios && Array.isArray(data.scenarios)) {
        setScenarios(data.scenarios);
        localStorage.setItem("scenarios", JSON.stringify(data.scenarios));
      }
      if (typeof data.speechDuration === "number") {
        setSpeechDuration(data.speechDuration);
        localStorage.setItem("speechDuration", data.speechDuration.toString());
      }
      if (typeof data.extraTime === "number") {
        setExtraTime(data.extraTime);
        localStorage.setItem("extraTime", data.extraTime.toString());
      }
      if (typeof data.language === "string") {
        setLanguage(data.language);
        localStorage.setItem("language", data.language);
      }
      setStatusMessage({ text: t("importSuccess"), type: "success" });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage({ text: t("importError"), type: "error" });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const suggestedScenarios = scenarios.filter(
    s => s.mafiasCount === mafiasCount && s.citizensCount === citizensCount
  );

  const unseenCardsCount = cards.reduce((acc, c) => (c.isSeen ? acc : acc + 1), 0);

  const persistScenarios = (next: Scenario[]) => {
    const sorted = [...next].sort((a, b) => a.name.localeCompare(b.name));
    setScenarios(sorted);
    localStorage.setItem("scenarios", JSON.stringify(sorted));
  };

  const deleteScenario = (id: string) => {
    const ok = window.confirm(t("confirmDeleteScenario"));
    if (!ok) return;
    persistScenarios(scenarios.filter((s) => s.id !== id));
  };

  const renameScenario = (id: string, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    persistScenarios(scenarios.map((s) => (s.id === id ? { ...s, name: nextName } : s)));
  };

  if (isStarted) {
    return (
      <div
        dir={language === "fa" ? "rtl" : "ltr"}
        className="relative flex flex-col min-h-dvh bg-background text-foreground font-sans max-w-lg mx-auto overflow-x-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        <header className="p-4 flex items-center justify-between glass-dark sticky top-0 z-50">
          <button 
            onClick={restart}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {backArrow} {t("reset")}
          </button>
          <h1 className="text-lg font-bold tracking-tight">{t("title")}</h1>
          <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-zinc-500">
            <span className="hidden sm:inline">{t("cardsLeft")}</span>
            <span className="inline-flex min-w-7 justify-center rounded-full bg-white/5 px-2 py-1 text-[11px] font-black text-zinc-200 tabular-nums">
              {formatNumber(unseenCardsCount)}
            </span>
          </div>
        </header>

        <main className="relative flex-1 p-6 flex flex-col items-center justify-center gap-8">
          {unseenCardsCount > 0 ? (
            <div className="grid w-full max-w-lg grid-cols-2 gap-4 sm:grid-cols-3 animate-slide-up">
              {cards.map((card) => {
                // Keep grid positions stable, but make seen cards truly empty so they can't "ghost" during 3D flips.
                if (card.isSeen) {
                  return (
                    <div
                      key={card.id}
                      className={`relative aspect-[3/4] rounded-3xl`}
                      aria-hidden
                    />
                  );
                }

                return (
                  <div
                    key={card.id}
                    onClick={() => flipCard(card.id)}
                    className={`relative aspect-[3/4] rounded-3xl cursor-pointer transition-all duration-700 preserve-3d group ${
                      flippedCardId === card.id ? "[transform:rotateY(180deg)]" : ""
                    } ${flippedCardId !== null && flippedCardId !== card.id ? "opacity-30 blur-[1px] scale-95" : "hover:scale-[1.02]"}`}
                  >
                    {/* Front Side */}
                    <div className="absolute inset-0 glass rounded-3xl border border-white/10 flex flex-col items-center justify-center backface-hidden shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-zinc-500 tabular-nums">
                          {formatNumber(card.id + 1)}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                          {t("tapToReveal")}
                        </span>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className={`absolute inset-0 bg-zinc-100 text-black rounded-3xl flex flex-col items-center justify-between [transform:rotateY(180deg)] backface-hidden p-6 text-center shadow-2xl border-4 ${card.side === "mafia" ? "border-mafia" : "border-citizen"}`}>
                      <div className="w-full">
                        <div className="text-2xl font-black tracking-tight leading-tight mt-8">{card.role}</div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markSeen(card.id);
                        }}
                        className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold leading-none flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
                      >
                        <Icon className="h-5 w-5">
                          <path d="M20 6 9 17l-5-5" />
                        </Icon>
                        {t("seen")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full max-w-sm flex flex-col items-center animate-zoom-in">
              <div className="mb-8 text-4xl">🎭</div>
              
              <div className="w-full space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={toggleNight}
                    className={`py-4 rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isNight ? "bg-white text-black" : "bg-zinc-800 text-white border border-white/10"
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

                  <button
                    onClick={toggleSpeaking}
                    className={`py-4 rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isSpeaking ? "bg-red-500 text-white" : "bg-zinc-800 text-white border border-white/10"
                    }`}
                  >
                    {language === "en" 
                      ? (isSpeaking ? t("stop").toUpperCase() : t("speak").toUpperCase())
                      : (isSpeaking ? t("stop") : t("speak"))
                    }
                  </button>
                </div>

                <div className="glass rounded-3xl border border-white/10 p-6 flex flex-col items-center gap-4">
                  <div className={`text-6xl font-black tabular-nums transition-colors duration-300 ${
                    countdown > extraTime ? "text-green-500" : countdown >= 0 ? "text-yellow-400" : "text-red-500"
                  }`}>
                    {formatNumber(countdown)}
                  </div>
                  
                  <div className="w-full grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block text-center">
                        {language === "en" ? t("speechDuration").toUpperCase() : t("speechDuration")}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumber(speechDuration)}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleSpeechDurationChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all tabular-nums"
                        />
                        {language === "en" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 uppercase">
                            s
                          </span>
                        )}
                        {language === "fa" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500">
                            ثانیه
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block text-center">
                        {language === "en" ? t("extraTime").toUpperCase() : t("extraTime")}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumber(extraTime)}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleExtraTimeChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all tabular-nums"
                        />
                        {language === "en" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 uppercase">
                            s
                          </span>
                        )}
                        {language === "fa" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500">
                            ثانیه
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {scenarioNotes && (
                <div className="w-full mb-8 glass rounded-3xl border border-white/10 p-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 text-center">
                    {t("notes")}
                  </div>
                  <div className="text-sm font-medium text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {scenarioNotes}
                  </div>
                </div>
              )}

              <button
                onClick={restart}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg leading-none inline-flex items-center justify-center active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {t("restart")}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div
      dir={language === "fa" ? "rtl" : "ltr"}
      className="relative flex flex-col min-h-dvh bg-background text-foreground font-sans max-w-lg mx-auto overflow-x-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <header className="p-6 flex justify-between items-center sticky top-0 z-50 glass-dark">
        <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white">
          {t("title")}
        </h1>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {["en", "fa"].map((l) => (
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
      </header>

      <main className="relative flex-1 p-6 pb-40 space-y-10 animate-fade-in">
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CountStepper
              label={t("mafiasCount")}
              value={mafiasCount}
              onChange={handleMafiasCountChange}
              accent="mafia"
            />
            <CountStepper
              label={t("citizensCount")}
              value={citizensCount}
              onChange={handleCitizensCountChange}
              accent="citizen"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowManageScenarios(true)}
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
                {suggestedScenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadScenario(s)}
                    className="shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="max-w-[12rem] truncate">
                        {localizeDigits(s.name)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black text-zinc-300">
                        <span className="text-mafia">{formatNumber(s.mafiasCount)}</span>
                        <span className="text-zinc-500">/</span>
                        <span className="text-citizen">{formatNumber(s.citizensCount)}</span>
                      </span>
                    </span>
                  </button>
                ))}
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
                    onChange={(e) => {
                      const next = [...mafiaRoles];
                      next[i] = e.target.value;
                      setMafiaRoles(next);
                    }}
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
                    onChange={(e) => {
                      const next = [...citizenRoles];
                      next[i] = e.target.value;
                      setCitizenRoles(next);
                    }}
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
                  onChange={(e) => setScenarioNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === " ") e.stopPropagation();
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-white/20 transition-all font-medium resize-none min-h-[100px] overflow-hidden"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold leading-none inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Icon className="h-5 w-5">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </Icon>
                    {t("saveScenario")}
                  </button>
                  <button
                    onClick={resetSetup}
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
            onClick={startGame}
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

      {showSaveInput && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setShowSaveInput(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 safe-pb px-6 pb-6">
            <div className="glass rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black tracking-tight">{t("saveScenario")}</div>
                <button
                  type="button"
                  aria-label={t("close")}
                  onClick={() => setShowSaveInput(false)}
                  className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-zinc-300 hover:bg-white/10 active:scale-95 transition-all inline-flex items-center justify-center"
                >
                  <Icon className="h-5 w-5">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </Icon>
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  ref={saveInputRef}
                  placeholder={t("scenarioName")}
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === " ") e.stopPropagation();
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm outline-none focus:border-white/40 font-bold"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSaveInput(false)}
                    className="flex-1 py-4 bg-transparent border border-white/10 rounded-2xl text-sm font-bold leading-none text-zinc-400 hover:text-white transition-all active:scale-95 inline-flex items-center justify-center"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={saveScenario}
                    className="flex-1 py-4 bg-white text-black rounded-2xl text-sm font-black leading-none active:scale-95 transition-all shadow-xl inline-flex items-center justify-center"
                  >
                    {t("save")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageScenarios && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => {
              setShowManageScenarios(false);
              setRenamingScenarioId(null);
              setRenameValue("");
            }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="absolute inset-x-0 bottom-0 safe-pb px-6 pb-6 max-h-full flex flex-col justify-end">
            <div className="glass rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up flex flex-col max-h-[90dvh]">
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="text-sm font-black tracking-tight">{t("savedScenarios")}</div>
                <button
                  type="button"
                  aria-label={t("close")}
                  onClick={() => {
                    setShowManageScenarios(false);
                    setRenamingScenarioId(null);
                    setRenameValue("");
                  }}
                  className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-sm font-black leading-none text-zinc-300 hover:bg-white/10 active:scale-95 transition-all inline-flex items-center justify-center"
                >
                  <Icon className="h-5 w-5">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </Icon>
                </button>
              </div>

              <div className="mt-4 overflow-y-auto pr-1 flex-1">
                <div className="space-y-2">
                  {scenarios.length === 0 ? (
                  <div className="py-8 text-center text-sm font-bold text-zinc-500">
                    {t("noSavedScenarios")}
                  </div>
                ) : (
                  scenarios.map((s) => {
                    const isRenaming = renamingScenarioId === s.id;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                      >
                        <button
                          type="button"
                          onKeyDown={(e) => {
                            if (e.key === " " && renamingScenarioId === s.id) {
                              e.stopPropagation();
                            }
                          }}
                          onClick={() => {
                            if (isRenaming) return;
                            loadScenario(s);
                            setShowManageScenarios(false);
                          }}
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
                                  onKeyDown={(e) => {
                                    if (e.key === " ") e.stopPropagation();
                                  }}
                                />
                              ) : (
                                <div className="truncate text-sm font-black">
                                  {localizeDigits(s.name)}
                                </div>
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
                            onClick={() => {
                              renameScenario(s.id, renameValue);
                              setRenamingScenarioId(null);
                              setRenameValue("");
                            }}
                            className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white text-black active:scale-95 transition-all inline-flex items-center justify-center self-start"
                          >
                            <Icon className="h-5 w-5">
                              <path d="M20 6 9 17l-5-5" />
                            </Icon>
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={t("rename")}
                            onClick={() => {
                              setRenamingScenarioId(s.id);
                              setRenameValue(s.name);
                            }}
                            className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 active:scale-95 transition-all inline-flex items-center justify-center"
                          >
                            <Icon className="h-5 w-5">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </Icon>
                          </button>
                        )}

                        <button
                          type="button"
                          aria-label={t("delete")}
                          onClick={() => deleteScenario(s.id)}
                          className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all inline-flex items-center justify-center"
                        >
                          <Icon className="h-5 w-5">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </Icon>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={exportData}
                  className={`w-full h-12 rounded-2xl font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    isExported 
                      ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                      : "bg-white text-black"
                  }`}
                >
                  <Icon className="h-5 w-5">
                    {isExported ? (
                      <path d="M20 6 9 17l-5-5" />
                    ) : (
                      <>
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </>
                    )}
                  </Icon>
                  {isExported ? t("exportSuccess") : t("export")}
                </button>

                <button
                  type="button"
                  onClick={importData}
                  className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white font-black text-sm hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Icon className="h-5 w-5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </Icon>
                  {t("import")}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
      {statusMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up pointer-events-none">
          <div className={`px-6 py-3 rounded-2xl font-black text-sm shadow-2xl border border-white/10 glass ${
            statusMessage.type === "success" ? "text-emerald-400" : "text-red-400"
          }`}>
            {statusMessage.text}
          </div>
        </div>
      )}
    </div>
  );
}
