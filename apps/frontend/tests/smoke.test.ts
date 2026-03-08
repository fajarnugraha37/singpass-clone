import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Mock Svelte 5 $state for testing
(globalThis as any).$state = <T>(v: T) => v;

describe("Smoke Tests - Singpass UI Layout", () => {
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

  describe("Layout Components Presence", () => {
    const srcDir = join(import.meta.dir, "../src");

    test("BaseLayout exists and contains header/footer slots or imports", () => {
      const layoutPath = join(srcDir, "layouts/BaseLayout.astro");
      expect(existsSync(layoutPath)).toBe(true);
      const content = readFileSync(layoutPath, "utf-8");
      expect(content).toContain("<Header client:load />");
      expect(content).toContain("<Footer client:load />");
      expect(content).toContain("<Masthead client:load />");
    });

    test("Header component exists", () => {
      expect(existsSync(join(srcDir, "components/Header.svelte"))).toBe(true);
    });

    test("Footer component exists", () => {
      expect(existsSync(join(srcDir, "components/Footer.svelte"))).toBe(true);
    });

    test("Masthead component exists", () => {
      expect(existsSync(join(srcDir, "components/Masthead.svelte"))).toBe(true);
    });
  });
});
