import { describe, it, expect } from "vitest";
import { normalizePhone, isValidWhatsAppNumber, maskPhone } from "./phone";

describe("normalizePhone", () => {
  it("normalizes a local Pakistani number (0300...) to E.164", () => {
    const r = normalizePhone("0300 1234567");
    expect(r.valid).toBe(true);
    expect(r.e164).toBe("+923001234567");
    expect(r.msisdn).toBe("923001234567");
  });

  it("keeps an already international +92 number", () => {
    const r = normalizePhone("+92-321-1234567");
    expect(r.e164).toBe("+923211234567");
  });

  it("handles the 0092 international prefix", () => {
    const r = normalizePhone("0092 3011234567");
    expect(r.e164).toBe("+923011234567");
  });

  it("assumes Pakistan for a bare subscriber number", () => {
    const r = normalizePhone("3009876543"); // 10 digits -> 92 + 10 = 12
    expect(r.e164).toBe("+923009876543");
  });

  it("marks empty or too-short input as invalid", () => {
    expect(normalizePhone("").valid).toBe(false);
    expect(normalizePhone(null).valid).toBe(false);
    expect(normalizePhone("123").valid).toBe(false);
  });
});

describe("isValidWhatsAppNumber", () => {
  it("returns true for valid numbers and false otherwise", () => {
    expect(isValidWhatsAppNumber("03001234567")).toBe(true);
    expect(isValidWhatsAppNumber("abc")).toBe(false);
    expect(isValidWhatsAppNumber(undefined)).toBe(false);
  });
});

describe("maskPhone", () => {
  it("masks the middle keeping country code and last 4 digits", () => {
    const masked = maskPhone("03001234567");
    expect(masked.startsWith("+92")).toBe(true);
    expect(masked.endsWith("4567")).toBe(true);
    expect(masked).not.toContain("300123");
  });

  it("returns empty string for empty input", () => {
    expect(maskPhone("")).toBe("");
  });
});
