import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/features/language";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe("useLanguage", () => {
  it("defaults to Persian", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe("fa");
  });

  it("translates keys in Persian", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t("title")).toBe("مافیا");
    expect(result.current.t("start")).toBe("شروع");
  });

  it("switches to English and translates correctly", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLanguage("en"));
    expect(result.current.language).toBe("en");
    expect(result.current.t("title")).toBe("Mafia");
    expect(result.current.t("start")).toBe("Start");
  });

  it("persists language choice to localStorage", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLanguage("en"));
    expect(localStorage.getItem("language")).toBe("en");
  });

  it("restores language from localStorage", async () => {
    localStorage.setItem("language", "en");
    const { result, rerender } = renderHook(() => useLanguage(), { wrapper });
    rerender();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.language).toBe("en");
  });

  it("updates document dir and lang attributes", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("fa");

    act(() => result.current.setLanguage("en"));
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });

  it("falls back to Persian for missing keys", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLanguage("en"));
    expect(result.current.t("title")).toBe("Mafia");
  });

  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow("useLanguage must be used within a LanguageProvider");
  });
});
