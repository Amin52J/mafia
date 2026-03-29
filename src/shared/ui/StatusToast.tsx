"use client";

interface StatusToastProps {
  message: { text: string; type: "success" | "error" } | null;
}

export function StatusToast({ message }: StatusToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100] animate-slide-up pointer-events-none">
      <div className={`px-6 py-3 rounded-2xl font-black text-sm shadow-2xl border border-white/10 glass ${
        message.type === "success" ? "text-emerald-400" : "text-red-400"
      }`}>
        {message.text}
      </div>
    </div>
  );
}
