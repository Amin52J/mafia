import { describe, it, expect, vi } from "vitest";
import { render, screen, act, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MafiaGame from "@/components/MafiaGame";
import { LanguageProvider } from "@/features/language";

function renderGame() {
  return render(
    <LanguageProvider>
      <MafiaGame />
    </LanguageProvider>
  );
}

async function startGameWith(
  user: ReturnType<typeof userEvent.setup>,
  mafiaCount: number,
  citizenCount: number
) {
  for (let i = 0; i < mafiaCount; i++) {
    const buttons = screen.getAllByRole("button", { name: /افزایش/i });
    await user.click(buttons[0]);
  }
  for (let i = 0; i < citizenCount; i++) {
    const buttons = screen.getAllByRole("button", { name: /افزایش/i });
    await user.click(buttons[1]);
  }

  const startButton = screen.getByRole("button", { name: /شروع/i });
  await user.click(startButton);

  await waitFor(() => {
    expect(screen.queryByText("تعداد مافیا")).not.toBeInTheDocument();
  });
}

function getFlippedCardSeenButton(): HTMLElement {
  const candidates = document.querySelectorAll('[class*="z-50"]');
  for (const el of candidates) {
    if (el.className.includes("cursor-pointer")) {
      return within(el as HTMLElement).getByText("دیدم");
    }
  }
  throw new Error("No flipped card found");
}

async function flipAndSeeCard(
  user: ReturnType<typeof userEvent.setup>,
  cardText: string
) {
  const cardEl = screen.getByText(cardText).closest("[class*=cursor-pointer]");
  expect(cardEl).toBeTruthy();
  await user.click(cardEl!);

  await act(async () => {
    vi.advanceTimersByTime(2000);
  });

  const seenButton = getFlippedCardSeenButton();
  await user.click(seenButton);

  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
}

async function seeAllCards(
  user: ReturnType<typeof userEvent.setup>,
  count: number
) {
  for (let i = 1; i <= count; i++) {
    const persianNum = new Intl.NumberFormat("fa-IR-u-nu-arabext").format(i);
    await flipAndSeeCard(user, persianNum);
  }
}

describe("Game Play - Card Interactions", () => {
  it("flipping a card shows the tremble animation then reveals role", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);

    const card1 = screen.getByText("۱").closest("[class*=cursor-pointer]");
    await user.click(card1!);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const allMafia = screen.queryAllByText("مافیا");
    const allCitizen = screen.queryAllByText("شهروند");
    expect(allMafia.length + allCitizen.length).toBeGreaterThanOrEqual(2);

    const seenButton = getFlippedCardSeenButton();
    expect(seenButton).toBeInTheDocument();
  });

  it("marking a card as seen removes it and proceeds to next card", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);

    await flipAndSeeCard(user, "۱");

    const card2 = screen.getByText("۲");
    expect(card2).toBeInTheDocument();
  });

  it("shows game controls after all cards are seen", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    expect(screen.getByText("صحبت کن")).toBeInTheDocument();
    expect(screen.getByText("چالش")).toBeInTheDocument();
    expect(screen.getByText("شب")).toBeInTheDocument();
  });
});

describe("Game Play - Timer", () => {
  it("speech timer counts down from configured duration", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    expect(screen.getByText("۴۰")).toBeInTheDocument();

    await user.click(screen.getByText("صحبت کن"));

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("۳۵")).toBeInTheDocument();
  });

  it("stop button stops the timer and resets countdown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    await user.click(screen.getByText("صحبت کن"));

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    await user.click(screen.getByText("تمام"));

    expect(screen.getByText("۴۰")).toBeInTheDocument();
  });

  it("challenge timer counts down from challenge time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    await user.click(screen.getByText("چالش"));

    expect(screen.getByText("۳۰")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("۲۵")).toBeInTheDocument();
  });
});

describe("Game Play - Night Mode", () => {
  it("toggles night mode", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    await user.click(screen.getByText("شب"));
    expect(screen.getByText("روز")).toBeInTheDocument();

    await user.click(screen.getByText("روز"));
    expect(screen.getByText("شب")).toBeInTheDocument();
  });
});

describe("Game Play - Restart", () => {
  it("shows restart confirmation and returns to setup on confirm", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);

    await user.click(screen.getByText(/بازنشانی/));

    expect(
      screen.getByText("آیا از پایان دادن به این بازی اطمینان دارید؟")
    ).toBeInTheDocument();

    await user.click(screen.getByText("تایید"));

    expect(screen.getByText("تعداد مافیا")).toBeInTheDocument();
  });

  it("cancel in restart confirmation stays in game", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);

    await user.click(screen.getByText(/بازنشانی/));
    await user.click(screen.getByText("لغو"));

    expect(screen.getByText("۱")).toBeInTheDocument();
  });
});

describe("Game Play - God's Note and Player Roles", () => {
  it("god's note textarea is visible after all cards seen", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    expect(screen.getByPlaceholderText("یادداشت خدا")).toBeInTheDocument();
  });

  it("player roles section expands and collapses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    const toggleButton = screen.getByText("بازیکنان و نقش‌ها");
    await user.click(toggleButton);

    const playerNameInputs = screen.getAllByPlaceholderText("نام بازیکن");
    expect(playerNameInputs.length).toBe(2);

    await user.click(toggleButton);
    expect(screen.queryAllByPlaceholderText("نام بازیکن")).toHaveLength(0);
  });
});

describe("Game Play - LocalStorage Persistence", () => {
  it("persists speech duration to localStorage", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderGame();
    await startGameWith(user, 1, 1);
    await seeAllCards(user, 2);

    const speechInput = screen.getByDisplayValue("۴۰");
    await user.clear(speechInput);
    await user.type(speechInput, "60");

    expect(localStorage.getItem("speechDuration")).toBe("60");
  });
});
