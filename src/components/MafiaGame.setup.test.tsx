import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

function clickIncrease(index: number) {
  const buttons = screen.getAllByRole("button", { name: /افزایش/i });
  return buttons[index];
}

function clickDecrease(index: number) {
  const buttons = screen.getAllByRole("button", { name: /کاهش/i });
  return buttons[index];
}

describe("Setup Screen", () => {
  it("renders the title", () => {
    renderGame();
    expect(screen.getByText("مافیا")).toBeInTheDocument();
  });

  it("renders mafia and citizen count steppers starting at zero", () => {
    renderGame();
    expect(screen.getByText("تعداد مافیا")).toBeInTheDocument();
    expect(screen.getByText("تعداد شهروند")).toBeInTheDocument();
    const zeros = screen.getAllByText("۰");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it("start button is disabled when total players is 0", () => {
    renderGame();
    const startButton = screen.getByRole("button", { name: /شروع/i });
    expect(startButton).toBeDisabled();
  });

  it("increments mafia count when + is clicked", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0));
    expect(screen.getByText("۱")).toBeInTheDocument();
  });

  it("does not decrement below 0", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickDecrease(0));
    const zeros = screen.getAllByText("۰");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it("shows mafia role inputs when mafia count > 0", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0));
    await user.click(clickIncrease(0));

    const roleInputs = screen.getAllByPlaceholderText(/نقش مافیا/);
    expect(roleInputs).toHaveLength(2);
  });

  it("shows citizen role inputs when citizen count > 0", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(1));

    const roleInputs = screen.getAllByPlaceholderText(/نقش شهروند/);
    expect(roleInputs).toHaveLength(1);
  });

  it("allows typing role names", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0));

    const roleInput = screen.getByPlaceholderText(/نقش مافیا ۱/);
    await user.clear(roleInput);
    await user.type(roleInput, "پدرخوانده");

    expect(roleInput).toHaveValue("پدرخوانده");
  });

  it("enables start button when total players > 0", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0));

    const startButton = screen.getByRole("button", { name: /شروع/i });
    expect(startButton).not.toBeDisabled();
  });

  it("decrements mafia count and removes role inputs", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0));
    await user.click(clickIncrease(0));
    expect(screen.getAllByPlaceholderText(/نقش مافیا/)).toHaveLength(2);

    await user.click(clickDecrease(0));
    expect(screen.getAllByPlaceholderText(/نقش مافیا/)).toHaveLength(1);
  });

  it("reset button clears all counts and roles", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0));
    await user.click(clickIncrease(1));

    const resetButton = screen.getByRole("button", { name: /بازنشانی/i });
    await user.click(resetButton);

    expect(screen.queryAllByPlaceholderText(/نقش مافیا/)).toHaveLength(0);
    expect(screen.queryAllByPlaceholderText(/نقش شهروند/)).toHaveLength(0);
  });

  it("switches language to English", async () => {
    const user = userEvent.setup();
    renderGame();

    const englishButton = screen.getByRole("button", { name: /انگلیسی/i });
    await user.click(englishButton);

    expect(screen.getByText("Mafia")).toBeInTheDocument();
    expect(screen.getByText("Number of Mafias")).toBeInTheDocument();
  });

  it("notes textarea is visible when roles are shown", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0));

    expect(screen.getByPlaceholderText(/یادداشت‌ها/)).toBeInTheDocument();
  });
});

describe("Setup Screen - Starting Game", () => {
  it("transitions to game screen after clicking start", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.click(clickIncrease(0)); // 1 mafia
    await user.click(clickIncrease(1)); // 1 citizen

    const startButton = screen.getByRole("button", { name: /شروع/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.queryByText("تعداد مافیا")).not.toBeInTheDocument();
    });
  });

  it("creates correct number of cards", async () => {
    const user = userEvent.setup();
    renderGame();

    // 2 mafia + 3 citizen = 5 cards
    await user.click(clickIncrease(0));
    await user.click(clickIncrease(0));
    await user.click(clickIncrease(1));
    await user.click(clickIncrease(1));
    await user.click(clickIncrease(1));

    const startButton = screen.getByRole("button", { name: /شروع/i });
    await user.click(startButton);

    await waitFor(() => {
      for (const num of ["۱", "۲", "۳", "۴", "۵"]) {
        expect(screen.getByText(num)).toBeInTheDocument();
      }
    });
  });
});
