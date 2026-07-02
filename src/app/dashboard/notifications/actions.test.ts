import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth session so we can simulate different roles.
const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

// Prevent real DB / provider work if the guard were ever bypassed.
vi.mock("@/lib/prisma", () => ({
  default: {
    notificationSettings: { upsert: vi.fn() },
    rentReminderLog: { count: vi.fn(async () => 0) },
  },
}));
vi.mock("@/lib/reminders/service", () => ({
  getEffectiveSettings: vi.fn(),
  retryReminder: vi.fn(async () => ({ success: true, message: "ok" })),
  sendTestReminder: vi.fn(async () => ({ success: true, message: "ok" })),
}));

import {
  saveNotificationSettings,
  sendTestReminderAction,
  retryReminderAction,
} from "./actions";

const settingsInput = {
  enabled: true,
  reminderDay: 5,
  reminderHour: 10,
  templateName: "rent_due_reminder",
  templateLanguage: "en_US",
  paymentInstructions: "",
  supportContact: "",
};

describe("notification admin actions authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated users", async () => {
    getServerSession.mockResolvedValue(null);
    await expect(saveNotificationSettings(settingsInput)).rejects.toThrow(/Unauthorized/);
  });

  it("rejects non-admin users for settings, test send, and retry", async () => {
    getServerSession.mockResolvedValue({ user: { isAdmin: false } });
    await expect(saveNotificationSettings(settingsInput)).rejects.toThrow(/Unauthorized/);
    await expect(sendTestReminderAction(1)).rejects.toThrow(/Unauthorized/);
    await expect(retryReminderAction(1)).rejects.toThrow(/Unauthorized/);
  });

  it("allows admin users", async () => {
    getServerSession.mockResolvedValue({ user: { isAdmin: true } });
    const res = await retryReminderAction(1);
    expect(res.success).toBe(true);
  });
});
