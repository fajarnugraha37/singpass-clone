import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { validateNric } from "../../src/lib/nric-validator";

describe("NRIC Validation Logic", () => {
  test("should validate correct S-series NRIC", () => {
    expect(validateNric("S9000001B")).toBe(true);
  });

  test("should invalidate incorrect S-series NRIC", () => {
    expect(validateNric("S1234567A")).toBe(false);
  });

  test("should validate correct T-series NRIC", () => {
    expect(validateNric("T0123456G")).toBe(true);
  });

  test("should validate correct F-series FIN", () => {
    expect(validateNric("F1234567N")).toBe(true);
  });

  test("should validate correct G-series FIN", () => {
    expect(validateNric("G1234567X")).toBe(true);
  });

  test("should handle invalid length", () => {
    expect(validateNric("S1234567")).toBe(false);
  });

  test("should handle invalid first character", () => {
    expect(validateNric("Z1234567A")).toBe(false);
  });
});

describe("Form Rendering Components", () => {
  const srcDir = join(import.meta.dir, "../../src/components");

  test("LoginForm component exists and contains NricInput and PasswordInput", () => {
    const componentPath = join(srcDir, "LoginForm.svelte");
    expect(existsSync(componentPath)).toBe(true);
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("<NricInput");
    expect(content).toContain("<PasswordInput");
  });

  test("NricInput component exists", () => {
    expect(existsSync(join(srcDir, "NricInput.svelte"))).toBe(true);
  });

  test("PasswordInput component exists", () => {
    expect(existsSync(join(srcDir, "PasswordInput.svelte"))).toBe(true);
  });
});
