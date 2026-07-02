// src/lib/reminders/eligibility.ts
//
// Pure, side-effect-free eligibility rules for the rent-due reminder. Kept
// independent of Prisma/DB so the business rules are trivially unit-testable.

import { isValidWhatsAppNumber } from "@/lib/phone";

export interface EligibilityTenant {
  id: number;
  name: string;
  phone: string | null;
  whatsappNumber?: string | null;
  isActive?: boolean;
  whatsappOptIn?: boolean;
  doNotContact?: boolean;
}

export interface EligibilityContext {
  /** Global automation switch (settings.enabled AND env RENT_REMINDER_ENABLED). */
  automationEnabled: boolean;
  /** True when the current billing month's rent is fully paid. */
  rentFullyPaid: boolean;
}

export type IneligibleReason =
  | "automation_disabled"
  | "tenant_inactive"
  | "do_not_contact"
  | "not_opted_in"
  | "invalid_phone"
  | "already_paid";

export interface EligibilityResult {
  eligible: boolean;
  reason?: IneligibleReason;
}

/**
 * Decide whether a tenant should receive the monthly rent-due reminder.
 * Duplicate-suppression (already-sent-this-period) is enforced separately by
 * the DB unique constraint in the service layer, not here.
 */
export function evaluateEligibility(
  tenant: EligibilityTenant,
  ctx: EligibilityContext
): EligibilityResult {
  if (!ctx.automationEnabled) {
    return { eligible: false, reason: "automation_disabled" };
  }
  // isActive defaults to true when undefined (legacy rows).
  if (tenant.isActive === false) {
    return { eligible: false, reason: "tenant_inactive" };
  }
  if (tenant.doNotContact === true) {
    return { eligible: false, reason: "do_not_contact" };
  }
  if (tenant.whatsappOptIn === false) {
    return { eligible: false, reason: "not_opted_in" };
  }
  const numberToUse = tenant.whatsappNumber || tenant.phone;
  if (!isValidWhatsAppNumber(numberToUse)) {
    return { eligible: false, reason: "invalid_phone" };
  }
  if (ctx.rentFullyPaid) {
    return { eligible: false, reason: "already_paid" };
  }
  return { eligible: true };
}
