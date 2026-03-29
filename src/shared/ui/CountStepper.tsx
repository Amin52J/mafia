"use client";

interface CountStepperProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  accent: "mafia" | "citizen";
  formatNumber: (value: number) => string;
  decreaseLabel: string;
  increaseLabel: string;
}

export function CountStepper({
  label,
  value,
  onChange,
  accent,
  formatNumber,
  decreaseLabel,
  increaseLabel,
}: CountStepperProps) {
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
            aria-label={decreaseLabel}
            disabled={decDisabled}
            onClick={() => onChange(Math.max(0, value - 1))}
            className={`h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-lg font-black transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${accentRingClass} ${decDisabled ? "opacity-40" : "hover:bg-white/10"}`}
          >
            −
          </button>
          <button
            type="button"
            aria-label={increaseLabel}
            onClick={() => onChange(value + 1)}
            className={`h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-lg font-black transition-all hover:bg-white/10 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${accentRingClass}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
