"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Scenario, Card } from "@/types/game";

export default function MafiaGame() {
  const { t, language, setLanguage } = useLanguage();
  
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

  useEffect(() => {
    const saved = localStorage.getItem("scenarios");
    if (saved) {
      setScenarios(JSON.parse(saved)); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

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
    const allRoles = [
      ...mafiaRoles.map(r => r.trim() || t("defaultMafia")),
      ...citizenRoles.map(r => r.trim() || t("defaultCitizen")),
    ];

    // Shuffle
    const shuffled = allRoles
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }, index) => ({
        id: index,
        role: value,
        isFlipped: false,
        isSeen: false,
      }));

    setCards(shuffled);
    setIsStarted(true);
    setFlippedCardId(null);
  };

  const flipCard = (id: number) => {
    if (flippedCardId !== null) return;
    setFlippedCardId(id);
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
  };

  const markSeen = (id: number) => {
    setCards(prev => prev.filter(c => c.id !== id));
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

  if (isStarted) {
    return (
      <div 
        dir={language === 'fa' ? 'rtl' : 'ltr'} 
        className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden"
      >
        <header className="p-4 flex items-center justify-between glass-dark sticky top-0 z-50">
          <button 
            onClick={restart}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            ← {t("reset")}
          </button>
          <h1 className="text-lg font-bold tracking-tight">{t("title")}</h1>
          <div className="w-16" /> {/* Spacer */}
        </header>

        <main className="flex-1 p-6 flex flex-col items-center justify-center gap-8">
          {cards.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => flipCard(card.id)}
                  className={`relative h-48 rounded-2xl cursor-pointer transition-all duration-700 preserve-3d group ${
                    flippedCardId === card.id ? "[transform:rotateY(180deg)]" : ""
                  } ${flippedCardId !== null && flippedCardId !== card.id ? "opacity-30 blur-[1px] scale-95" : "hover:scale-[1.02]"}`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 glass rounded-2xl border border-white/10 flex flex-col items-center justify-center backface-hidden shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-zinc-500">
                        {card.id + 1}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Tap to reveal</span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 bg-zinc-100 text-black rounded-2xl flex flex-col items-center justify-between [transform:rotateY(180deg)] backface-hidden p-6 text-center shadow-2xl">
                    <div className="w-full">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black mb-4">{t("roles")}</div>
                      <div className="text-2xl font-black tracking-tight leading-tight">
                        {card.role}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markSeen(card.id);
                      }}
                      className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold active:scale-95 transition-transform shadow-lg"
                    >
                      {t("seen")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="mb-8 text-4xl">🎭</div>
              <button
                onClick={restart}
                className="px-10 py-4 bg-white text-black rounded-2xl font-black text-lg active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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
      dir={language === 'fa' ? 'rtl' : 'ltr'} 
      className="flex flex-col min-h-screen bg-background text-foreground max-w-md mx-auto relative pb-32"
    >
      <header className="p-6 flex justify-between items-center sticky top-0 z-50 glass-dark">
        <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white">
          {t("title")}
        </h1>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {['en', 'fa'].map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === l ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">
                {t("mafiasCount")}
              </label>
              <input
                type="number"
                min="0"
                value={mafiasCount || ""}
                onChange={(e) => handleMafiasCountChange(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-mafia/50 focus:bg-white/[0.08] transition-all font-bold text-lg"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">
                {t("citizensCount")}
              </label>
              <input
                type="number"
                min="0"
                value={citizensCount || ""}
                onChange={(e) => handleCitizensCountChange(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-citizen/50 focus:bg-white/[0.08] transition-all font-bold text-lg"
                placeholder="0"
              />
            </div>
          </div>

          {suggestedScenarios.length > 0 && (
            <div className="space-y-3 animate-in fade-in duration-500">
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">
                {t("suggestedScenarios")}
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedScenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadScenario(s)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {(mafiasCount > 0 || citizensCount > 0) && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black tracking-tight">{t("roles")}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            <div className="space-y-4">
              {mafiaRoles.map((role, i) => (
                <div key={`m-${i}`} className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-mafia shadow-[0_0_8px_rgba(255,59,59,0.5)]" />
                  <input
                    placeholder={`${t("mafiaRole")} ${i + 1} (${t("defaultMafia")})`}
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
                    placeholder={`${t("citizenRole")} ${i + 1} (${t("defaultCitizen")})`}
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
              {showSaveInput && (
                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-300">
                  <input
                    placeholder={t("scenarioName")}
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl p-4 text-sm outline-none focus:border-white/40 font-bold"
                    autoFocus
                  />
                  <button
                    onClick={saveScenario}
                    className="px-6 bg-white text-black rounded-2xl text-sm font-black active:scale-95 transition-all shadow-xl"
                  >
                    OK
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveInput(!showSaveInput)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all active:scale-95"
                >
                  {t("saveScenario")}
                </button>
                <button
                  onClick={resetSetup}
                  className="px-8 py-4 bg-transparent border border-white/10 rounded-2xl text-sm font-bold text-zinc-500 hover:text-white transition-all active:scale-95"
                >
                  {t("reset")}
                </button>
              </div>
            </div>
          </section>
        )}

        {(mafiasCount > 0 || citizensCount > 0) && (
          <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto z-50">
            <button
              onClick={startGame}
              className="w-full py-5 bg-white text-black rounded-3xl font-black text-xl active:scale-95 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3"
            >
              <span>{t("start")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
