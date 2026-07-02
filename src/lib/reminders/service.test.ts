import { describe, it, expect, beforeEach, vi } from "vitest";
import type { WhatsAppProvider, WhatsAppSendResult } from "@/lib/whatsapp/types";

// ── In-memory Prisma mock ────────────────────────────────────────────────
interface Tenant {
  id: number;
  name: string;
  phone: string | null;
  whatsappNumber: string | null;
  offices: string[];
  monthlyRent: number;
  isActive: boolean;
  whatsappOptIn: boolean;
  doNotContact: boolean;
}
interface Payment { tenantId: number; type: string; month: string; amount: number }
interface Log {
  id: number;
  tenantId: number;
  leaseId: number;
  billingPeriod: string;
  reminderType: string;
  status: string;
  attemptCount: number;
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  phoneNumberMasked: string;
  provider: string;
  templateName: string;
  sentAt: Date | null;
  createdAt: Date;
}

const { store, prismaMock } = vi.hoisted(() => {
  const s = {
    tenants: [] as Tenant[],
    payments: [] as Payment[],
    logs: [] as Log[],
    settings: {
      id: 1,
      enabled: true,
      reminderDay: 5,
      reminderHour: 10,
      timezone: "Asia/Karachi",
      templateName: "rent_due_reminder",
      templateLanguage: "en_US",
      paymentInstructions: "",
      supportContact: "",
    },
    property: { id: 1, propertyName: "JR Arcade" },
    seq: 1,
  };

  const mock = {
    notificationSettings: {
      upsert: vi.fn(async () => s.settings),
    },
    propertyInfo: {
      findUnique: vi.fn(async () => s.property),
    },
    tenantProfile: {
      findMany: vi.fn(async () =>
        s.tenants.map((t) => ({
          ...t,
          payments: s.payments.filter((p) => p.tenantId === t.id && p.type === "RENT"),
        }))
      ),
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) =>
        s.tenants.find((t) => t.id === where.id) ?? null
      ),
    },
    paymentRecord: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: number } }) =>
        s.payments.filter((p) => p.tenantId === where.tenantId && p.type === "RENT")
      ),
    },
    rentReminderLog: {
      create: vi.fn(async ({ data }: { data: Partial<Log> }) => {
        const dup = s.logs.find(
          (l) =>
            l.tenantId === data.tenantId &&
            l.leaseId === data.leaseId &&
            l.billingPeriod === data.billingPeriod &&
            l.reminderType === data.reminderType
        );
        if (dup) {
          const err = new Error("Unique constraint failed") as Error & { code: string };
          err.code = "P2002";
          throw err;
        }
        const row: Log = {
          id: s.seq++,
          tenantId: data.tenantId!,
          leaseId: data.leaseId!,
          billingPeriod: data.billingPeriod!,
          reminderType: data.reminderType!,
          status: data.status ?? "pending",
          attemptCount: data.attemptCount ?? 0,
          providerMessageId: data.providerMessageId ?? null,
          errorCode: data.errorCode ?? null,
          errorMessage: data.errorMessage ?? null,
          phoneNumberMasked: data.phoneNumberMasked ?? "",
          provider: data.provider ?? "",
          templateName: data.templateName ?? "",
          sentAt: data.sentAt ?? null,
          createdAt: new Date(),
        };
        s.logs.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: number }; data: Partial<Log> }) => {
        const row = s.logs.find((l) => l.id === where.id)!;
        Object.assign(row, data);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) =>
        s.logs.find((l) => l.id === where.id) ?? null
      ),
      count: vi.fn(async () => 0),
    },
  };

  return { store: s, prismaMock: mock };
});

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));

function reset() {
  store.tenants = [];
  store.payments = [];
  store.logs = [];
  store.seq = 1;
  store.settings.enabled = true;
}

// Import AFTER the mock is registered.
import { runRentReminders, retryReminder } from "./service";

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: store.seq++,
    name: "Ali Khan",
    phone: "03001234567",
    whatsappNumber: null,
    offices: ["Shop 1"],
    monthlyRent: 25000,
    isActive: true,
    whatsappOptIn: true,
    doNotContact: false,
    ...overrides,
  };
}

const okProvider: WhatsAppProvider = {
  name: "mock",
  sendTemplateMessage: vi.fn(
    async (): Promise<WhatsAppSendResult> => ({ success: true, providerMessageId: "wamid.ok" })
  ),
};

const failProvider: WhatsAppProvider = {
  name: "mock",
  sendTemplateMessage: vi.fn(
    async (): Promise<WhatsAppSendResult> => ({
      success: false,
      retryable: false,
      errorCode: "meta_131026",
      errorMessage: "invalid number",
    })
  ),
};

const NOW = new Date("2026-07-05T06:00:00Z"); // 11:00 Karachi, day 5

describe("runRentReminders", () => {
  beforeEach(() => {
    reset();
    vi.clearAllMocks();
  });

  it("sends a reminder to an active tenant with unpaid rent", async () => {
    store.tenants.push(tenant());
    const summary = await runRentReminders({ now: NOW, force: true, provider: okProvider });
    expect(summary.sent).toBe(1);
    expect(summary.failed).toBe(0);
    expect(store.logs[0].status).toBe("sent");
    expect(store.logs[0].providerMessageId).toBe("wamid.ok");
  });

  it("does not send when rent is fully paid", async () => {
    const t = tenant();
    store.tenants.push(t);
    store.payments.push({ tenantId: t.id, type: "RENT", month: "July 2026", amount: 25000 });
    const summary = await runRentReminders({ now: NOW, force: true, provider: okProvider });
    expect(summary.sent).toBe(0);
    expect(summary.skippedReasons["already_paid"]).toBe(1);
  });

  it("does not send to inactive / vacated tenants", async () => {
    store.tenants.push(tenant({ isActive: false }));
    const summary = await runRentReminders({ now: NOW, force: true, provider: okProvider });
    expect(summary.sent).toBe(0);
    expect(summary.skippedReasons["tenant_inactive"]).toBe(1);
  });

  it("does not send when there is no valid phone number", async () => {
    store.tenants.push(tenant({ phone: "" }));
    const summary = await runRentReminders({ now: NOW, force: true, provider: okProvider });
    expect(summary.sent).toBe(0);
    expect(summary.skippedReasons["invalid_phone"]).toBe(1);
  });

  it("is idempotent — a second run sends no duplicate messages", async () => {
    store.tenants.push(tenant());
    const first = await runRentReminders({ now: NOW, force: true, provider: okProvider });
    const second = await runRentReminders({ now: NOW, force: true, provider: okProvider });
    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    // Only one log row and one provider call total.
    expect(store.logs.filter((l) => l.reminderType === "RENT_DUE")).toHaveLength(1);
    expect(okProvider.sendTemplateMessage).toHaveBeenCalledTimes(1);
  });

  it("records a failed status when the provider rejects the message", async () => {
    store.tenants.push(tenant());
    const summary = await runRentReminders({ now: NOW, force: true, provider: failProvider });
    expect(summary.failed).toBe(1);
    expect(store.logs[0].status).toBe("failed");
    expect(store.logs[0].errorCode).toBe("meta_131026");
  });

  it("skips entirely when automation is disabled", async () => {
    store.settings.enabled = false;
    store.tenants.push(tenant());
    const summary = await runRentReminders({ now: NOW, force: true, provider: okProvider });
    expect(summary.sent).toBe(0);
    expect(summary.skippedReasons["automation_disabled"]).toBe(1);
  });

  it("does not run off the configured reminder day (without force)", async () => {
    store.tenants.push(tenant());
    const offDay = new Date("2026-07-10T06:00:00Z");
    const summary = await runRentReminders({ now: offDay, provider: okProvider });
    expect(summary.sent).toBe(0);
    expect(summary.skippedReasons["not_reminder_day"]).toBe(1);
  });
});

describe("retryReminder", () => {
  beforeEach(() => {
    reset();
    vi.clearAllMocks();
  });

  it("re-sends a previously failed reminder and marks it sent", async () => {
    const t = tenant();
    store.tenants.push(t);
    await runRentReminders({ now: NOW, force: true, provider: failProvider });
    const failedLog = store.logs[0];
    expect(failedLog.status).toBe("failed");

    const res = await retryReminder(failedLog.id, okProvider);
    expect(res.success).toBe(true);
    expect(store.logs[0].status).toBe("sent");
  });

  it("refuses to resend an already-delivered reminder", async () => {
    const t = tenant();
    store.tenants.push(t);
    await runRentReminders({ now: NOW, force: true, provider: okProvider });
    const res = await retryReminder(store.logs[0].id, okProvider);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/already delivered/i);
  });
});
