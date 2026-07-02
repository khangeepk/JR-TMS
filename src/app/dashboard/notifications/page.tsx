import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageCircle, ShieldAlert } from "lucide-react";
import NotificationsClient from "@/components/notifications/NotificationsClient";
import { getEffectiveSettings } from "@/lib/reminders/service";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  period?: string;
  tenant?: string;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  if (!session.user?.isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-white premium-shadow rounded-[2rem] p-8 text-center">
          <div className="mx-auto w-fit p-3 bg-rose-50 rounded-full mb-3">
            <ShieldAlert className="text-rose-500" size={28} />
          </div>
          <h1 className="text-xl font-black text-slate-800">Administrator Access Required</h1>
          <p className="text-sm text-slate-500 mt-2">
            You do not have permission to view WhatsApp reminder settings or logs.
            Please contact a system administrator.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter = params.status && params.status !== "all" ? params.status : undefined;
  const periodFilter = params.period?.trim() || undefined;
  const tenantFilter = params.tenant?.trim() || undefined;

  const [settings, effective, logs, tenants] = await Promise.all([
    prisma.notificationSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    getEffectiveSettings(),
    prisma.rentReminderLog.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(periodFilter ? { billingPeriod: { contains: periodFilter } } : {}),
        ...(tenantFilter
          ? { tenant: { name: { contains: tenantFilter, mode: "insensitive" } } }
          : {}),
      },
      include: { tenant: { select: { name: true, offices: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.tenantProfile.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        whatsappNumber: true,
        offices: true,
        monthlyRent: true,
        isActive: true,
        whatsappOptIn: true,
        doNotContact: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const logRows = logs.map((l) => ({
    id: l.id,
    tenantName: l.tenant?.name ?? `Tenant #${l.tenantId}`,
    property: effective.propertyName,
    unit: (l.tenant?.offices ?? []).join(", "),
    billingPeriod: l.billingPeriod,
    reminderType: l.reminderType,
    phoneNumberMasked: l.phoneNumberMasked,
    provider: l.provider,
    providerMessageId: l.providerMessageId,
    status: l.status,
    attemptCount: l.attemptCount,
    errorCode: l.errorCode,
    errorMessage: l.errorMessage,
    sentAt: l.sentAt ? l.sentAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="text-emerald-500" size={24} />
          WhatsApp Rent Reminders
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Automated monthly rent-due reminders &middot; Timezone{" "}
          <span className="font-semibold text-slate-700">{effective.timezone}</span>
        </p>
      </div>

      <NotificationsClient
        settings={{
          enabled: settings.enabled,
          reminderDay: settings.reminderDay,
          reminderHour: settings.reminderHour,
          timezone: effective.timezone,
          templateName: settings.templateName,
          templateLanguage: settings.templateLanguage,
          paymentInstructions: settings.paymentInstructions,
          supportContact: settings.supportContact,
        }}
        providerConfigured={isWhatsAppConfigured()}
        providerName={effective.automationEnabled ? "enabled" : "disabled"}
        propertyName={effective.propertyName}
        logs={logRows}
        tenants={tenants}
        filters={{
          status: params.status ?? "all",
          period: periodFilter ?? "",
          tenant: tenantFilter ?? "",
        }}
      />
    </div>
  );
}
