// src/lib/billing.ts
//
// Billing-period helpers computed in the application timezone (Asia/Karachi by
// default). All month/day calculations for the reminder system flow through
// here so behaviour is deterministic regardless of the server's local clock.

export const DEFAULT_TIMEZONE = "Asia/Karachi";

/** Resolve the configured application timezone from env, falling back to Asia/Karachi. */
export function getAppTimezone(): string {
  return (
    process.env.RENT_REMINDER_TIMEZONE ||
    process.env.APP_TIMEZONE ||
    DEFAULT_TIMEZONE
  );
}

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
}

/** Break a Date down into calendar parts as observed in the given timezone. */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(date);
  const lookup = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  // Intl may render midnight as "24"; normalize to 0.
  let hour = lookup("hour");
  if (hour === 24) hour = 0;

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour,
  };
}

/**
 * Canonical billing period key ("YYYY-MM") for the given moment in the app timezone.
 * This is the value stored on RentReminderLog.billingPeriod and used for idempotency.
 */
export function getBillingPeriod(
  date: Date = new Date(),
  timeZone: string = getAppTimezone()
): string {
  const { year, month } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Human-friendly billing month label, e.g. "July 2026".
 * Matches the format used elsewhere in the app (`toLocaleString` month + year)
 * but is pinned to the app timezone.
 */
export function getBillingMonthLabel(
  date: Date = new Date(),
  timeZone: string = getAppTimezone()
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Legacy payment-record month label used by the existing schema
 * (PaymentRecord.month stores e.g. "July 2026"). Reuses the same format so we
 * can correctly determine whether the current month's rent has been paid.
 */
export function getPaymentMonthLabel(
  date: Date = new Date(),
  timeZone: string = getAppTimezone()
): string {
  return getBillingMonthLabel(date, timeZone);
}

/** Current day-of-month (1-31) in the app timezone. */
export function getZonedDayOfMonth(
  date: Date = new Date(),
  timeZone: string = getAppTimezone()
): number {
  return getZonedParts(date, timeZone).day;
}

/** Current hour (0-23) in the app timezone. */
export function getZonedHour(
  date: Date = new Date(),
  timeZone: string = getAppTimezone()
): number {
  return getZonedParts(date, timeZone).hour;
}
