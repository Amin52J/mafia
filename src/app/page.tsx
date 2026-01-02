"use client";

import { useState, useEffect } from "react";
import MafiaGame from "@/components/MafiaGame";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return <MafiaGame />;
}
