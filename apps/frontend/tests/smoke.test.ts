import { expect, test, describe, beforeAll } from "bun:test";

describe("Smoke Tests - Singpass UI Layout", () => {
  // Since we are doing UI-only prototype, we can check for elements presence
  // using basic DOM-like structure if we were running in a browser, 
  // but here we can check the built HTML if needed or just logic.
  // For this environment, we'll focus on the logic and existence of critical files.

  test("NRIC validator logic is exported and functional", async () => {
    const { validateNric } = await import("../src/lib/nric-validator");
    expect(validateNric("S1234567D")).toBe(true);
    expect(validateNric("S1234567A")).toBe(false);
  });

  test("i18n store is initialized with default English locale", async () => {
    const { i18n } = await import("../src/lib/i18n.svelte");
    expect(i18n.locale).toBe("en");
    expect(i18n.t("login.header")).toBe("Log in with Singpass");
  });

  test("i18n supports Mandarin switching", async () => {
    const { i18n } = await import("../src/lib/i18n.svelte");
    i18n.setLocale("zh");
    expect(i18n.locale).toBe("zh");
    expect(i18n.t("login.header")).toBe("使用 Singpass 登录");
  });
});
