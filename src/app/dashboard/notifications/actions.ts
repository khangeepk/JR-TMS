"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getEffectiveSettings,
  retryReminder,
  sendTestReminder,
} from "@/lib/reminders/service";

/** Only administrators may manage the reminder automation. */
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized: administrator access required.");
  }
  return session;
}

export interface SaveSettingsInput {
  enabled: boolean;
  reminderDay: number;
  reminderHour: number;
  templateName: string;
  templateLanguage: string;
  paymentInstructions: string;
  supportContact: string;
}

export async function saveNotificationSettings(input: SaveSettingsInput) {
  await requireAdmin();

  const reminderDay = clamp(Math.round(input.reminderDay), 1, 28);
  const reminderHour = clamp(Math.round(input.reminderHour), 0, 23);

  await prisma.notificationSettings.upsert({
    where: { id: 1 },
    update: {
      enabled: Boolean(input.enabled),
      reminderDay,
      reminderHour,
      templateName: input.templateName?.trim() || "rent_due_reminder",
      templateLanguage: input.templateLanguage?.trim() || "en_US",
      paymentInstructions: input.paymentInstructions ?? "",
      supportContact: input.supportContact ?? "",
    },
    create: {
      id: 1,
      enabled: Boolean(input.enabled),
      reminderDay,
      reminderHour,
      templateName: input.templateName?.trim() || "rent_due_reminder",
      templateLanguage: input.templateLanguage?.trim() || "en_US",
      paymentInstructions: input.paymentInstructions ?? "",
      supportContact: input.supportContact ?? "",
    },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true, message: "Settings saved." };
}

const TEST_RATE_WINDOW_MS = 60_000;
const TEST_RATE_MAX = 3;

/** Admin-only manual test send with a best-effort DB-backed rate limit. */
export async function sendTestReminderAction(tenantId: number) {
  await requireAdmin();

  const since = new Date(Date.now() - TEST_RATE_WINDOW_MS);
  const recentTests = await prisma.rentReminderLog.count({
    where: { reminderType: "TEST", createdAt: { gte: since } },
  });
  if (recentTests >= TEST_RATE_MAX) {
    return {
      success: false,
      message: "Rate limit reached. Please wait a minute before sending another test.",
    };
  }

  const result = await sendTestReminder(tenantId);
  revalidatePath("/dashboard/notifications");
  return result;
}

/** Admin-only manual retry of a failed reminder. */
export async function retryReminderAction(logId: number) {
  await requireAdmin();
  const result = await retryReminder(logId);
  revalidatePath("/dashboard/notifications");
  return result;
}

/** Load current effective settings for the admin UI. */
export async function loadEffectiveSettings() {
  await requireAdmin();
  return getEffectiveSettings();
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
