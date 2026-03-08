import { expect, test, describe } from "bun:test";
import { validateNric } from "../../src/lib/nric-validator";

describe("NRIC/FIN Comprehensive Validation", () => {
  test("S-series (Singapore Citizens/PRs before 2000)", () => {
    expect(validateNric("S1234567D")).toBe(true);
    expect(validateNric("S0000001I")).toBe(true);
    expect(validateNric("S1234567A")).toBe(false);
  });

  test("T-series (Singapore Citizens/PRs from 2000 onwards)", () => {
    expect(validateNric("T0123456G")).toBe(true);
    expect(validateNric("T1234567J")).toBe(true);
    expect(validateNric("T0123456A")).toBe(false);
  });

  test("F-series (Foreigners before 2000)", () => {
    expect(validateNric("F1234567N")).toBe(true);
    expect(validateNric("F0123456X")).toBe(true);
    expect(validateNric("F1234567A")).toBe(false);
  });

  test("G-series (Foreigners from 2000 onwards)", () => {
    expect(validateNric("G1234567X")).toBe(true);
    expect(validateNric("G0123456R")).toBe(true);
    expect(validateNric("G1234567A")).toBe(false);
  });

  test("M-series (Foreigners from 2022 onwards)", () => {
    expect(validateNric("M1234567K")).toBe(true);
    expect(validateNric("M0123456N")).toBe(true);
    expect(validateNric("M1234567A")).toBe(false);
  });

  test("Edge cases", () => {
    expect(validateNric("")).toBe(false);
    expect(validateNric("S1234567")).toBe(false); // Too short
    expect(validateNric("S12345678D")).toBe(false); // Too long
    expect(validateNric("A1234567D")).toBe(false); // Invalid prefix
    expect(validateNric("S123A567D")).toBe(false); // Non-digit in middle
  });
});
