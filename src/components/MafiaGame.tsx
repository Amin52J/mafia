"use client";

import { useState, useEffect, useSyncExternalStore, type ReactNode } from "react";
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
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [showManageScenarios, setShowManageScenarios] = useState(false);
  const [renamingScenarioId, setRenamingScenarioId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("scenarios");
    if (saved) {
      setTimeout(() => {
        setScenarios(JSON.parse(saved));
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
      mafiasCount,
      citizensCount,
      mafiaRoles,
      citizenRoles,
    };

    const updated = [...scenarios, newScenario];
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
  };

  const resetSetup = () => {
    setMafiasCount(0);
    setCitizensCount(0);
    setMafiaRoles([]);
    setCitizenRoles([]);
    setScenarioName("");
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
    resetSetup();
  };

  const suggestedScenarios = scenarios.filter(
    s => s.mafiasCount === mafiasCount && s.citizensCount === citizensCount
  );

  const unseenCardsCount = cards.reduce((acc, c) => (c.isSeen ? acc : acc + 1), 0);

  const persistScenarios = (next: Scenario[]) => {
    setScenarios(next);
    localStorage.setItem("scenarios", JSON.stringify(next));
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
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-zinc-500">
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
            <div className="text-center animate-zoom-in">
              <div className="mb-8 text-4xl">🎭</div>
              <button
                onClick={restart}
                className="px-10 py-4 bg-white text-black rounded-2xl font-black text-lg leading-none inline-flex items-center justify-center active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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

          {scenarios.length > 0 && (
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
          )}

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
                  className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-zinc-300 hover:bg-white/10 active:scale-95 transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  placeholder={t("scenarioName")}
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm outline-none focus:border-white/40 font-bold"
                  autoFocus
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

          <div className="absolute inset-x-0 bottom-0 safe-pb px-6 pb-6">
            <div className="glass rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between gap-3">
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
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-2 max-h-[55dvh] overflow-auto pr-1">
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
                          onClick={() => {
                            loadScenario(s);
                            setShowManageScenarios(false);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {isRenaming ? (
                              <input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder={t("scenarioName")}
                                className="w-full bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-white/40"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div className="truncate text-sm font-black">
                                {localizeDigits(s.name)}
                              </div>
                            )}
                            <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black text-zinc-300">
                              <span className="text-mafia">{formatNumber(s.mafiasCount)}</span>
                              <span className="text-zinc-500">/</span>
                              <span className="text-citizen">{formatNumber(s.citizensCount)}</span>
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
                            className="h-10 w-10 rounded-2xl border border-white/10 bg-white text-black active:scale-95 transition-all inline-flex items-center justify-center"
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
                            className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 active:scale-95 transition-all inline-flex items-center justify-center"
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
                          className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 active:scale-95 transition-all inline-flex items-center justify-center"
                        >
                          <Icon className="h-5 w-5">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                          </Icon>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
