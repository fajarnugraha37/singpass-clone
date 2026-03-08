import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("LoginTabs Component Logic", () => {
  const componentPath = join(import.meta.dir, "../../src/components/LoginTabs.svelte");

  test("LoginTabs component file exists", () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  test("Default tab is 'password'", () => {
    const content = readFileSync(componentPath, "utf-8");
    // Verify the state initialization
    expect(content).toContain("let activeTab = $state<Tab>('password');");
  });

  test("Renders tabs with correct onClick handlers", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("onclick={() => setTab('app')}");
    expect(content).toContain("onclick={() => setTab('password')}");
  });

  test("Renders LoginForm by default (when activeTab is password)", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("<LoginForm />");
    expect(content).toContain("{#if activeTab === 'app'}");
    expect(content).toContain("<QRPlaceholder />");
  });
});
