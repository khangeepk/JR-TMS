// src/lib/phone.ts
//
// Phone number normalization + masking helpers.
//
// - Normalizes local Pakistani numbers into E.164 (e.g. "0300 1234567" -> "+923001234567").
// - Never mutates the caller's input; returns derived values only.
// - Masking keeps the country code + last 4 digits visible: "+92******1234".

const PK_COUNTRY_CODE = "92";

export interface NormalizedPhone {
  /** E.164 formatted number, e.g. "+923001234567". null when the input is not usable. */
  e164: string | null;
  /** Digits only (no leading +), suitable for the Meta Cloud API `to` field. */
  msisdn: string | null;
  valid: boolean;
}

/**
 * Normalize a raw phone string into E.164, defaulting unknown local numbers to Pakistan.
 * Pure function — the original tenant record is never modified.
 */
export function normalizePhone(
  raw: string | null | undefined,
  defaultCountryCode: string = PK_COUNTRY_CODE
): NormalizedPhone {
  if (!raw) return { e164: null, msisdn: null, valid: false };

  // Strip everything except digits and a possible leading '+'.
  const hasPlus = raw.trim().startsWith("+");
  let digits = raw.replace(/[^\d]/g, "");

  if (!digits) return { e164: null, msisdn: null, valid: false };

  if (hasPlus) {
    // Already international, trust the country code as given.
    // (digits already has the leading '+' stripped)
  } else if (digits.startsWith("00")) {
    // International dialing prefix 00xx -> xx
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    // Local Pakistani format 03xxxxxxxxx -> 92 3xxxxxxxxx
    digits = defaultCountryCode + digits.slice(1);
  } else if (!digits.startsWith(defaultCountryCode)) {
    // Bare subscriber number without country code — assume default country.
    digits = defaultCountryCode + digits;
  }

  // E.164 allows up to 15 digits; require a sane minimum length.
  const valid = digits.length >= 11 && digits.length <= 15;

  return {
    e164: valid ? `+${digits}` : null,
    msisdn: valid ? digits : null,
    valid,
  };
}

/** Returns true when the raw phone can be normalized into a sendable E.164 number. */
export function isValidWhatsAppNumber(raw: string | null | undefined): boolean {
  return normalizePhone(raw).valid;
}

/**
 * Mask a phone number for safe display in logs and the admin UI.
 * Keeps the country-code prefix and the last 4 digits: "+92******1234".
 */
export function maskPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const normalized = normalizePhone(raw);
  const source = normalized.msisdn ?? raw.replace(/[^\d]/g, "");
  if (!source) return "";

  const prefix = source.startsWith(PK_COUNTRY_CODE) ? `+${PK_COUNTRY_CODE}` : "+";
  const last4 = source.slice(-4);
  const hiddenCount = Math.max(0, source.length - PK_COUNTRY_CODE.length - 4);
  return `${prefix}${"*".repeat(hiddenCount || 6)}${last4}`;
}
