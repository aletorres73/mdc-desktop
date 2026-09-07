import { describe, expect, it } from "vitest";
import { formatNumberToMoney, parseMoneyToNumber } from "@/data/mappers/money";

describe("billing money mapping", () => {
  it("parses invariant decimal strings without changing their scale", () => {
    expect(parseMoneyToNumber("6000.00")).toBe(6000);
    expect(parseMoneyToNumber("60000.00")).toBe(60000);
  });

  it("keeps compatibility with Argentine-formatted values", () => {
    expect(parseMoneyToNumber("$ 6.000,00")).toBe(6000);
    expect(parseMoneyToNumber("$ 60.000,00")).toBe(60000);
  });

  it("writes the Android-compatible invariant representation", () => {
    expect(formatNumberToMoney(6000)).toBe("6000.00");
    expect(formatNumberToMoney(60000)).toBe("60000.00");
  });
});