// src/lib/reminders/service.ts
//
// Orchestrates the automated WhatsApp rent-due reminder run. Responsible for:
//   - resolving effective settings (DB + env),
//   - determining the current billing period in Asia/Karachi,
//   - selecting eligible tenants,
//   - creating idempotent log rows BEFORE sending (unique constraint = dedupe),
//   - sending the approved template with bounded retry/backoff,
//   - recording the provider response + final status.

import prisma from "@/lib/prisma";
import {
  getWhatsAppProvider,
  getWhatsAppConfig,
  type WhatsAppProvider,
} from "@/lib/whatsapp";
import { normalizePhone, maskPhone } from "@/lib/phone";
import {
  getAppTimezone,
  getBillingPeriod,
  getBillingMonthLabel,
  getPaymentMonthLabel,
  getZonedDayOfMonth,
} from "@/lib/billing";
import { evaluateEligibility } from "./eligibility";
import { sendTemplateWithRetry } from "./retry";
import { buildTemplateVariables } from "./template";

const REMINDER_TYPE = "RENT_DUE" as const;
const TEST_REMINDER_TYPE = "TEST" as const;
const MAX_ATTEMPTS = 3;

export interface EffectiveSettings {
  enabled: boolean;
  reminderDay: number;
  reminderHour: number;
  timezone: string;
  templateName: string;
  templateLanguage: string;
  paymentInstructions: string;
  supportContact: string;
  propertyName: string;
  /** Combined global switch: DB enabled AND env RENT_REMINDER_ENABLED. */
  automationEnabled: boolean;
}

/** Read + merge NotificationSettings (DB) with environment configuration. */
export async function getEffectiveSettings(): Promise<EffectiveSettings> {
  const [settings, property] = await Promise.all([
    prisma.notificationSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    }),
    prisma.propertyInfo.findUnique({ where: { id: 1 } }),
  ]);

  const waConfig = getWhatsAppConfig();
  const envEnabled = process.env.RENT_REMINDER_ENABLED !== "false"; // default on

  return {
    enabled: settings.enabled,
    reminderDay: Number(process.env.RENT_REMINDER_DAY || settings.reminderDay),
    reminderHour: Number(process.env.RENT_REMINDER_HOUR || settings.reminderHour),
    timezone: process.env.RENT_REMINDER_TIMEZONE || settings.timezone || getAppTimezone(),
    templateName: waConfig.templateName || settings.templateName,
    templateLanguage: waConfig.templateLanguage || settings.templateLanguage,
    paymentInstructions: settings.paymentInstructions,
    supportContact: settings.supportContact,
    propertyName: property?.propertyName || "JR Arcade",
    automationEnabled: settings.enabled && envEnabled,
  };
}

export interface ReminderRunSummary {
  billingPeriod: string;
  monthLabel: string;
  timezone: string;
  totalTenants: number;
  eligible: number;
  sent: number;
  failed: number;
  skipped: number;
  skippedReasons: Record<string, number>;
  dryRun: boolean;
  ranAt: string;
}

interface RunOptions {
  now?: Date;
  /** Skip the day-of-month guard (used by manual "run now"). */
  force?: boolean;
  /** Evaluate + log skips but never call the provider. */
  dryRun?: boolean;
  provider?: WhatsAppProvider;
}

/**
 * Execute the monthly reminder batch. Safe to call more than once for the same
 * period — the unique log constraint prevents duplicate deliveries.
 */
export async function runRentReminders(
  options: RunOptions = {}
): Promise<ReminderRunSummary> {
  const now = options.now ?? new Date();
  const settings = await getEffectiveSettings();
  const timezone = settings.timezone;
  const billingPeriod = getBillingPeriod(now, timezone);
  const monthLabel = getBillingMonthLabel(now, timezone);
  const paymentMonthLabel = getPaymentMonthLabel(now, timezone);
  const provider = options.provider ?? getWhatsAppProvider();

  const summary: ReminderRunSummary = {
    billingPeriod,
    monthLabel,
    timezone,
    totalTenants: 0,
    eligible: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    skippedReasons: {},
    dryRun: Boolean(options.dryRun),
    ranAt: now.toISOString(),
  };

  const bumpSkip = (reason: string) => {
    summary.skipped++;
    summary.skippedReasons[reason] = (summary.skippedReasons[reason] || 0) + 1;
  };

  // Day-of-month guard so accidental daily triggers don't fire mid-month.
  if (!options.force) {
    const day = getZonedDayOfMonth(now, timezone);
    if (day !== settings.reminderDay) {
      return { ...summary, skippedReasons: { not_reminder_day: 1 }, skipped: 1 };
    }
  }

  const tenants = await prisma.tenantProfile.findMany({
    include: { payments: { where: { type: "RENT", month: paymentMonthLabel } } },
  });
  summary.totalTenants = tenants.length;

  for (const tenant of tenants) {
    const paidRent = tenant.payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, tenant.monthlyRent - paidRent);
    const rentFullyPaid = outstanding <= 0.001;

    const decision = evaluateEligibility(tenant, {
      automationEnabled: settings.automationEnabled,
      rentFullyPaid,
    });

    if (!decision.eligible) {
      bumpSkip(decision.reason ?? "ineligible");
      continue;
    }
    summary.eligible++;

    if (options.dryRun) continue;

    const outcome = await deliverReminder({
      tenant,
      settings,
      billingPeriod,
      monthLabel,
      outstanding,
      provider,
      reminderType: REMINDER_TYPE,
    });

    if (outcome === "sent") summary.sent++;
    else if (outcome === "failed") summary.failed++;
    else bumpSkip("already_processed");
  }

  return summary;
}

interface DeliverArgs {
  tenant: {
    id: number;
    name: string;
    phone: string | null;
    whatsappNumber?: string | null;
    offices: string[];
  };
  settings: EffectiveSettings;
  billingPeriod: string;
  monthLabel: string;
  outstanding: number;
  provider: WhatsAppProvider;
  reminderType: string;
}

type DeliverOutcome = "sent" | "failed" | "skipped";

/**
 * Idempotently create a log row then send. Returns "skipped" when a row already
 * exists for this tenant+period+type (concurrent run or prior attempt), which
 * guarantees a successful message is never re-sent.
 */
async function deliverReminder(args: DeliverArgs): Promise<DeliverOutcome> {
  const {
    tenant,
    settings,
    billingPeriod,
    monthLabel,
    outstanding,
    provider,
    reminderType,
  } = args;

  const numberSource = tenant.whatsappNumber || tenant.phone;
  const normalized = normalizePhone(numberSource);
  const masked = maskPhone(numberSource);

  // 1. Reserve the slot. Unique(tenantId, leaseId, billingPeriod, reminderType).
  let logId: number;
  try {
    const created = await prisma.rentReminderLog.create({
      data: {
        tenantId: tenant.id,
        leaseId: tenant.id, // no separate lease entity — mirror tenant id
        billingPeriod,
        reminderType,
        phoneNumberMasked: masked,
        provider: provider.name,
        templateName: settings.templateName,
        status: "pending",
        attemptCount: 0,
      },
    });
    logId = created.id;
  } catch (e: unknown) {
    // P2002 = unique constraint violation => already handled this period.
    if (isUniqueViolation(e)) return "skipped";
    throw e;
  }

  // 2. Send with bounded retry.
  const variables = buildTemplateVariables({
    tenantName: tenant.name,
    billingMonthLabel: monthLabel,
    propertyName: settings.propertyName,
    unit: (tenant.offices || []).join(", "),
    outstandingAmount: outstanding,
    supportContact: settings.supportContact || settings.propertyName,
  });

  const { result, attempts } = await sendTemplateWithRetry(
    provider,
    {
      to: normalized.msisdn ?? "",
      templateName: settings.templateName,
      languageCode: settings.templateLanguage,
      variables,
    },
    { maxAttempts: MAX_ATTEMPTS }
  );

  // 3. Persist final status.
  await prisma.rentReminderLog.update({
    where: { id: logId },
    data: {
      attemptCount: attempts,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.providerMessageId ?? null,
      errorCode: result.success ? null : result.errorCode ?? "unknown",
      errorMessage: result.success ? null : result.errorMessage ?? "Send failed",
      sentAt: result.success ? new Date() : null,
    },
  });

  return result.success ? "sent" : "failed";
}

/** Manually retry a previously failed reminder (admin action). */
export async function retryReminder(
  logId: number,
  provider: WhatsAppProvider = getWhatsAppProvider()
): Promise<{ success: boolean; message: string }> {
  const log = await prisma.rentReminderLog.findUnique({ where: { id: logId } });
  if (!log) return { success: false, message: "Reminder log not found." };
  if (log.status === "sent") {
    return { success: false, message: "This reminder was already delivered." };
  }

  const tenant = await prisma.tenantProfile.findUnique({
    where: { id: log.tenantId },
  });
  if (!tenant) return { success: false, message: "Tenant no longer exists." };

  const settings = await getEffectiveSettings();
  const monthLabel = billingPeriodToLabel(log.billingPeriod, settings.timezone);

  const paymentMonthLabel = monthLabel;
  const payments = await prisma.paymentRecord.findMany({
    where: { tenantId: tenant.id, type: "RENT", month: paymentMonthLabel },
  });
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, tenant.monthlyRent - paid);
  if (outstanding <= 0.001) {
    await prisma.rentReminderLog.update({
      where: { id: logId },
      data: { status: "skipped", errorCode: "already_paid", errorMessage: "Rent already paid." },
    });
    return { success: false, message: "Rent is already fully paid; nothing to send." };
  }

  const numberSource = tenant.whatsappNumber || tenant.phone;
  const normalized = normalizePhone(numberSource);
  if (!normalized.valid) {
    await prisma.rentReminderLog.update({
      where: { id: logId },
      data: { status: "failed", errorCode: "invalid_phone", errorMessage: "Invalid phone number." },
    });
    return { success: false, message: "Tenant has no valid WhatsApp number." };
  }

  const variables = buildTemplateVariables({
    tenantName: tenant.name,
    billingMonthLabel: monthLabel,
    propertyName: settings.propertyName,
    unit: (tenant.offices || []).join(", "),
    outstandingAmount: outstanding,
    supportContact: settings.supportContact || settings.propertyName,
  });

  const { result, attempts } = await sendTemplateWithRetry(
    provider,
    {
      to: normalized.msisdn ?? "",
      templateName: settings.templateName,
      languageCode: settings.templateLanguage,
      variables,
    },
    { maxAttempts: MAX_ATTEMPTS }
  );

  await prisma.rentReminderLog.update({
    where: { id: logId },
    data: {
      attemptCount: log.attemptCount + attempts,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.providerMessageId ?? log.providerMessageId ?? null,
      errorCode: result.success ? null : result.errorCode ?? "unknown",
      errorMessage: result.success ? null : result.errorMessage ?? "Send failed",
      sentAt: result.success ? new Date() : null,
    },
  });

  return {
    success: result.success,
    message: result.success
      ? "Reminder re-sent successfully."
      : `Retry failed: ${result.errorMessage ?? "unknown error"}`,
  };
}

/**
 * Send a one-off TEST reminder to a tenant (admin action). Logged separately
 * with reminderType = TEST so it never collides with the monthly RENT_DUE row.
 */
export async function sendTestReminder(
  tenantId: number,
  provider: WhatsAppProvider = getWhatsAppProvider()
): Promise<{ success: boolean; message: string }> {
  const tenant = await prisma.tenantProfile.findUnique({ where: { id: tenantId } });
  if (!tenant) return { success: false, message: "Tenant not found." };

  const numberSource = tenant.whatsappNumber || tenant.phone;
  const normalized = normalizePhone(numberSource);
  if (!normalized.valid) {
    return { success: false, message: "Tenant has no valid WhatsApp number." };
  }

  const settings = await getEffectiveSettings();
  const now = new Date();
  const billingPeriod = `TEST-${getBillingPeriod(now, settings.timezone)}-${Date.now()}`;
  const monthLabel = getBillingMonthLabel(now, settings.timezone);

  const paymentMonthLabel = getPaymentMonthLabel(now, settings.timezone);
  const payments = await prisma.paymentRecord.findMany({
    where: { tenantId, type: "RENT", month: paymentMonthLabel },
  });
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, tenant.monthlyRent - paid);

  const created = await prisma.rentReminderLog.create({
    data: {
      tenantId: tenant.id,
      leaseId: tenant.id,
      billingPeriod,
      reminderType: TEST_REMINDER_TYPE,
      phoneNumberMasked: maskPhone(numberSource),
      provider: provider.name,
      templateName: settings.templateName,
      status: "pending",
    },
  });

  const variables = buildTemplateVariables({
    tenantName: tenant.name,
    billingMonthLabel: monthLabel,
    propertyName: settings.propertyName,
    unit: (tenant.offices || []).join(", "),
    outstandingAmount: outstanding > 0 ? outstanding : tenant.monthlyRent,
    supportContact: settings.supportContact || settings.propertyName,
  });

  const { result, attempts } = await sendTemplateWithRetry(
    provider,
    {
      to: normalized.msisdn ?? "",
      templateName: settings.templateName,
      languageCode: settings.templateLanguage,
      variables,
    },
    { maxAttempts: MAX_ATTEMPTS }
  );

  await prisma.rentReminderLog.update({
    where: { id: created.id },
    data: {
      attemptCount: attempts,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.providerMessageId ?? null,
      errorCode: result.success ? null : result.errorCode ?? "unknown",
      errorMessage: result.success ? null : result.errorMessage ?? "Send failed",
      sentAt: result.success ? new Date() : null,
    },
  });

  return {
    success: result.success,
    message: result.success
      ? "Test reminder sent successfully."
      : `Test failed: ${result.errorMessage ?? "unknown error"}`,
  };
}

// ── helpers ────────────────────────────────────────────────────────────────

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "P2002"
  );
}

/** Convert a "YYYY-MM" billing period back into a "Month YYYY" label. */
export function billingPeriodToLabel(
  period: string,
  timezone: string = getAppTimezone()
): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  const year = Number(match[1]);
  const month = Number(match[2]);
  // Build a mid-month UTC date to avoid boundary drift, then format in tz.
  const date = new Date(Date.UTC(year, month - 1, 15, 12));
  return getBillingMonthLabel(date, timezone);
}
