import { describe, it, expect } from "vitest";
import {
  getBillingPeriod,
  getBillingMonthLabel,
  getZonedDayOfMonth,
  getZonedHour,
} from "./billing";

const KARACHI = "Asia/Karachi";

describe("billing period (Asia/Karachi)", () => {
  it("computes the billing period key in Asia/Karachi", () => {
    // 2026-07-05 06:00 UTC -> 11:00 Karachi, still July.
    const d = new Date("2026-07-05T06:00:00Z");
    expect(getBillingPeriod(d, KARACHI)).toBe("2026-07");
  });

  it("uses the local Karachi date across the UTC midnight boundary", () => {
    // 2026-07-31 20:00 UTC == 2026-08-01 01:00 Karachi (UTC+5).
    const d = new Date("2026-07-31T20:00:00Z");
    expect(getBillingPeriod(d, KARACHI)).toBe("2026-08");
    expect(getBillingMonthLabel(d, KARACHI)).toBe("August 2026");
  });

  it("labels the month in a friendly format", () => {
    const d = new Date("2026-07-05T06:00:00Z");
    expect(getBillingMonthLabel(d, KARACHI)).toBe("July 2026");
  });

  it("returns the correct day-of-month in Karachi", () => {
    // 2026-07-04 21:00 UTC == 2026-07-05 02:00 Karachi -> day 5.
    const d = new Date("2026-07-04T21:00:00Z");
    expect(getZonedDayOfMonth(d, KARACHI)).toBe(5);
  });

  it("returns the correct hour in Karachi", () => {
    // 05:00 UTC == 10:00 Karachi.
    const d = new Date("2026-07-05T05:00:00Z");
    expect(getZonedHour(d, KARACHI)).toBe(10);
  });
});
