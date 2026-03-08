import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("LanguageSwitcher Component", () => {
  const componentPath = join(import.meta.dir, "../../src/components/LanguageSwitcher.svelte");

  test("LanguageSwitcher component file exists", () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  test("Renders language options (en, zh, ms, ta)", () => {
    if (!existsSync(componentPath)) return;
    const content = readFileSync(componentPath, "utf-8");
    // Verify it contains the language codes or labels
    expect(content).toContain("en");
    expect(content).toContain("zh");
    expect(content).toContain("ms");
    expect(content).toContain("ta");
    expect(content).toContain("i18n.setLocale");
  });
});
