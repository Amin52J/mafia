import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MafiaGame from "@/components/MafiaGame";
import { LanguageProvider } from "@/features/language";

async function renderGame() {
  const result = render(
    <LanguageProvider>
      <MafiaGame />
    </LanguageProvider>
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
  return result;
}

async function setupWithCounts(
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
}

describe("Scenario Management", () => {
  it("opens save scenario modal", async () => {
    const user = userEvent.setup();
    await renderGame();
    await setupWithCounts(user, 2, 3);

    const saveButton = screen.getByRole("button", { name: /ذخیره سناریو/i });
    await user.click(saveButton);

    expect(screen.getByPlaceholderText(/نام سناریو/)).toBeInTheDocument();
  });

  it("saves a scenario and shows it in manage modal", async () => {
    const user = userEvent.setup();
    await renderGame();
    await setupWithCounts(user, 2, 3);

    const saveButton = screen.getByRole("button", { name: /ذخیره سناریو/i });
    await user.click(saveButton);

    const nameInput = screen.getByPlaceholderText(/نام سناریو/);
    await user.type(nameInput, "سناریو تست");

    const confirmSave = screen.getByRole("button", { name: /^ذخیره$/i });
    await user.click(confirmSave);

    const manageButton = screen.getByRole("button", {
      name: /مدیریت سناریوها/i,
    });
    await user.click(manageButton);

    const matches = screen.getAllByText("سناریو تست");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("persists scenarios to localStorage", async () => {
    const user = userEvent.setup();
    await renderGame();
    await setupWithCounts(user, 1, 2);

    const saveButton = screen.getByRole("button", { name: /ذخیره سناریو/i });
    await user.click(saveButton);

    const nameInput = screen.getByPlaceholderText(/نام سناریو/);
    await user.type(nameInput, "ذخیره‌ای");

    const confirmSave = screen.getByRole("button", { name: /^ذخیره$/i });
    await user.click(confirmSave);

    const stored = JSON.parse(localStorage.getItem("scenarios") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("ذخیره‌ای");
    expect(stored[0].mafiasCount).toBe(1);
    expect(stored[0].citizensCount).toBe(2);
  });

  it("loads a scenario and populates counts and roles", async () => {
    const scenario = {
      id: "test1",
      name: "بازی شش نفره",
      mafiasCount: 2,
      citizensCount: 4,
      mafiaRoles: ["پدرخوانده", "ناتو"],
      citizenRoles: ["کاراگاه", "دکتر", "تفنگدار", ""],
    };
    localStorage.setItem("scenarios", JSON.stringify([scenario]));

    const user = userEvent.setup();
    await renderGame();

    const manageButton = screen.getByRole("button", {
      name: /مدیریت سناریوها/i,
    });
    await user.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("بازی شش نفره")).toBeInTheDocument();
    });

    await user.click(screen.getByText("بازی شش نفره"));

    const mafiaInputs = screen.getAllByPlaceholderText(/نقش مافیا/);
    expect(mafiaInputs).toHaveLength(2);
    expect(mafiaInputs[0]).toHaveValue("پدرخوانده");
    expect(mafiaInputs[1]).toHaveValue("ناتو");

    const citizenInputs = screen.getAllByPlaceholderText(/نقش شهروند/);
    expect(citizenInputs).toHaveLength(4);
  });

  it("deletes a scenario with confirmation", async () => {
    const scenario = {
      id: "del1",
      name: "حذف‌شونده",
      mafiasCount: 1,
      citizensCount: 2,
      mafiaRoles: [""],
      citizenRoles: ["", ""],
    };
    localStorage.setItem("scenarios", JSON.stringify([scenario]));

    const user = userEvent.setup();
    await renderGame();

    const manageButton = screen.getByRole("button", {
      name: /مدیریت سناریوها/i,
    });
    await user.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("حذف‌شونده")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /^حذف$/i });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(screen.queryByText("حذف‌شونده")).not.toBeInTheDocument();
  });

  it("renames a scenario", async () => {
    const scenario = {
      id: "ren1",
      name: "نام قدیم",
      mafiasCount: 1,
      citizensCount: 1,
      mafiaRoles: [""],
      citizenRoles: [""],
    };
    localStorage.setItem("scenarios", JSON.stringify([scenario]));

    const user = userEvent.setup();
    await renderGame();

    const manageButton = screen.getByRole("button", {
      name: /مدیریت سناریوها/i,
    });
    await user.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText("نام قدیم")).toBeInTheDocument();
    });

    const renameButton = screen.getByRole("button", { name: /تغییر نام/i });
    await user.click(renameButton);

    const renameInput = screen.getByPlaceholderText(/نام سناریو/);
    await user.clear(renameInput);
    await user.type(renameInput, "نام جدید");

    const saveRename = screen.getByRole("button", { name: /^ذخیره$/i });
    await user.click(saveRename);

    expect(screen.getByText("نام جدید")).toBeInTheDocument();
    expect(screen.queryByText("نام قدیم")).not.toBeInTheDocument();
  });

  it("shows suggested scenarios matching current player count", async () => {
    const scenarios = [
      {
        id: "s1",
        name: "سه نفره",
        mafiasCount: 1,
        citizensCount: 2,
        mafiaRoles: [""],
        citizenRoles: ["", ""],
      },
      {
        id: "s2",
        name: "پنج نفره",
        mafiasCount: 2,
        citizensCount: 3,
        mafiaRoles: ["", ""],
        citizenRoles: ["", "", ""],
      },
    ];
    localStorage.setItem("scenarios", JSON.stringify(scenarios));

    const user = userEvent.setup();
    await renderGame();

    await setupWithCounts(user, 1, 2);

    await waitFor(() => {
      expect(screen.getByText("سه نفره")).toBeInTheDocument();
    });
    expect(screen.queryByText("پنج نفره")).not.toBeInTheDocument();
  });

  it("export shows success message", async () => {
    const scenario = {
      id: "exp1",
      name: "صادراتی",
      mafiasCount: 1,
      citizensCount: 1,
      mafiaRoles: [""],
      citizenRoles: [""],
    };
    localStorage.setItem("scenarios", JSON.stringify([scenario]));

    const user = userEvent.setup();
    await renderGame();

    const manageButton = screen.getByRole("button", {
      name: /مدیریت سناریوها/i,
    });
    await user.click(manageButton);

    const exportButton = screen.getByRole("button", {
      name: /خروجی گرفتن از داده‌ها/i,
    });
    await user.click(exportButton);

    await waitFor(() => {
      const matches = screen.getAllByText(/داده‌ها در حافظه کپی شد/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("import button triggers clipboard read", async () => {
    const importPayload = {
      scenarios: [
        {
          id: "imp1",
          name: "وارداتی",
          mafiasCount: 2,
          citizensCount: 3,
          mafiaRoles: ["", ""],
          citizenRoles: ["", "", ""],
        },
      ],
      speechDuration: 60,
      extraTime: 15,
      language: "fa",
    };

    const readTextFn = vi.fn(() =>
      Promise.resolve(JSON.stringify(importPayload))
    );

    const user = userEvent.setup();
    await renderGame();

    Object.defineProperty(navigator, "clipboard", {
      get: () => ({
        writeText: vi.fn(() => Promise.resolve()),
        readText: readTextFn,
      }),
      configurable: true,
    });

    const manageButton = screen.getByRole("button", {
      name: /مدیریت سناریوها/i,
    });
    await user.click(manageButton);

    const importButton = screen.getByRole("button", {
      name: /وارد کردن داده‌ها/i,
    });
    await user.click(importButton);

    await waitFor(() => {
      expect(readTextFn).toHaveBeenCalled();
    });

    await waitFor(() => {
      const success = screen.queryByText(/داده‌ها با موفقیت وارد شد/);
      const error = screen.queryByText(/فرمت داده‌ها نامعتبر است/);
      expect(success || error).toBeTruthy();
    });
  });

  it("groups scenarios by player count in manage modal", async () => {
    const scenarios = [
      {
        id: "g1",
        name: "سناریو سه",
        mafiasCount: 1,
        citizensCount: 2,
        mafiaRoles: [""],
        citizenRoles: ["", ""],
      },
      {
        id: "g2",
        name: "سناریو پنج",
        mafiasCount: 2,
        citizensCount: 3,
        mafiaRoles: ["", ""],
        citizenRoles: ["", "", ""],
      },
    ];
    localStorage.setItem("scenarios", JSON.stringify(scenarios));

    const user = userEvent.setup();
    await renderGame();

    const manageButton = screen.getByRole("button", {
      name: /مدیریت سناریوها/i,
    });
    await user.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText(/۳ نفره/)).toBeInTheDocument();
      expect(screen.getByText(/۵ نفره/)).toBeInTheDocument();
    });
  });
});
