import { expect, test, describe } from "bun:test";
import { validateNric } from "../src/lib/nric-validator";

describe("NRIC Validator", () => {
  test("should validate correct S-series NRIC", () => {
    expect(validateNric("S9000001B")).toBe(true);
  });

  test("should invalidate incorrect S-series NRIC", () => {
    expect(validateNric("S1234567A")).toBe(false);
  });

  test("should validate correct T-series NRIC", () => {
    // T0123456G calculation: (0*2+1*7+2*6+3*5+4*4+5*3+6*2)+4 = (0+7+12+15+16+15+12)+4 = 77+4 = 81. 81%11 = 4. S/T[4] = G
    expect(validateNric("T0123456G")).toBe(true);
  });

  test("should validate correct F-series FIN", () => {
    // F1234567N calculation: (1*2+2*7+3*6+4*5+5*4+6*3+7*2)+0 = (2+14+18+20+20+18+14)+0 = 106. 106%11 = 7. F/G[7] = N
    expect(validateNric("F1234567N")).toBe(true);
  });

  test("should validate correct G-series FIN", () => {
    // G1234567X calculation: (1*2+2*7+3*6+4*5+5*4+6*3+7*2)+4 = 106+4 = 110. 110%11 = 0. F/G[0] = X
    expect(validateNric("G1234567X")).toBe(true);
  });

  test("should handle invalid length", () => {
    expect(validateNric("S1234567")).toBe(false);
  });

  test("should handle invalid first character", () => {
    expect(validateNric("Z1234567A")).toBe(false);
  });
});
