import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi, beforeEach } from "vitest";

class MockAudio {
  src = "";
  loop = false;
  preload = "";
  volume = 1;
  muted = false;
  currentTime = 0;
  paused = true;

  onended: (() => void) | null = null;
  private listeners: Record<string, Set<EventListener>> = {};

  constructor(src?: string) {
    if (src) this.src = src;
  }

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  load() {}

  addEventListener(event: string, handler: EventListener) {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(handler);
  }

  removeEventListener(event: string, handler: EventListener) {
    this.listeners[event]?.delete(handler);
  }
}

export const clipboardMock = {
  writeText: vi.fn((): Promise<void> => Promise.resolve()),
  readText: vi.fn((): Promise<string> => Promise.resolve("{}")),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal("Audio", MockAudio);
  vi.stubGlobal("scrollTo", vi.fn());
  window.scrollTo = vi.fn();
  window.confirm = vi.fn(() => true);

  clipboardMock.writeText = vi.fn((): Promise<void> => Promise.resolve());
  clipboardMock.readText = vi.fn((): Promise<string> => Promise.resolve("{}"));
  Object.defineProperty(navigator, "clipboard", {
    get: () => clipboardMock,
    configurable: true,
  });

  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
