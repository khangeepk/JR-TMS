"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Send,
  RefreshCw,
  Filter,
  ShieldCheck,
  XCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  saveNotificationSettings,
  sendTestReminderAction,
  retryReminderAction,
} from "@/app/dashboard/notifications/actions";
import { buildDetailedPreview, buildPreviewText } from "@/lib/reminders/template";

interface Settings {
  enabled: boolean;
  reminderDay: number;
  reminderHour: number;
  timezone: string;
  templateName: string;
  templateLanguage: string;
  paymentInstructions: string;
  supportContact: string;
}

interface Tenant {
  id: number;
  name: string;
  phone: string;
  whatsappNumber: string | null;
  offices: string[];
  monthlyRent: number;
  isActive: boolean;
  whatsappOptIn: boolean;
  doNotContact: boolean;
}

interface LogRow {
  id: number;
  tenantName: string;
  property: string;
  unit: string;
  billingPeriod: string;
  reminderType: string;
  phoneNumberMasked: string;
  provider: string;
  providerMessageId: string | null;
  status: string;
  attemptCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface Props {
  settings: Settings;
  providerConfigured: boolean;
  providerName: string;
  propertyName: string;
  logs: LogRow[];
  tenants: Tenant[];
  filters: { status: string; period: string; tenant: string };
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
  skipped: "bg-slate-100 text-slate-500",
};

export default function NotificationsClient({
  settings,
  providerConfigured,
  propertyName,
  logs,
  tenants,
  filters,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState<Settings>(settings);
  const [previewTenantId, setPreviewTenantId] = useState<number | "">(
    tenants[0]?.id ?? ""
  );
  const [testTenantId, setTestTenantId] = useState<number | "">("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const previewTenant = useMemo(
    () => tenants.find((t) => t.id === previewTenantId),
    [tenants, previewTenantId]
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: settings.timezone,
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [settings.timezone]
  );

  const previewCtx = {
    tenantName: previewTenant?.name || "Ali Khan",
    billingMonthLabel: monthLabel,
    propertyName,
    unit: previewTenant?.offices?.join(", ") || "Shop 12",
    outstandingAmount: previewTenant?.monthlyRent ?? 25000,
    supportContact: form.supportContact || propertyName,
  };

  const testTenant = useMemo(
    () => tenants.find((t) => t.id === testTenantId),
    [tenants, testTenantId]
  );
  const testTenantHasNumber = Boolean(
    testTenant && (testTenant.whatsappNumber || testTenant.phone)
  );

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await saveNotificationSettings({
          enabled: form.enabled,
          reminderDay: Number(form.reminderDay),
          reminderHour: Number(form.reminderHour),
          templateName: form.templateName,
          templateLanguage: form.templateLanguage,
          paymentInstructions: form.paymentInstructions,
          supportContact: form.supportContact,
        });
        showToast(res.message || "Saved", res.success);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Failed to save", false);
      }
    });
  };

  const handleConfirmTest = () => {
    if (testTenantId === "") return;
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const res = await sendTestReminderAction(Number(testTenantId));
        showToast(res.message, res.success);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Test failed", false);
      }
    });
  };

  const handleRetry = (logId: number) => {
    startTransition(async () => {
      try {
        const res = await retryReminderAction(logId);
        showToast(res.message, res.success);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Retry failed", false);
      }
    });
  };

  const applyFilters = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next };
    const qs = new URLSearchParams();
    if (merged.status && merged.status !== "all") qs.set("status", merged.status);
    if (merged.period) qs.set("period", merged.period);
    if (merged.tenant) qs.set("tenant", merged.tenant);
    router.push(`/dashboard/notifications${qs.toString() ? `?${qs}` : ""}`);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white",
            toast.ok ? "bg-emerald-600" : "bg-rose-600"
          )}
        >
          {toast.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-bold">{toast.msg}</span>
        </div>
      )}

      {/* Provider status banner */}
      <div
        className={cn(
          "rounded-2xl p-4 flex items-start gap-3 border",
          providerConfigured
            ? "bg-emerald-50/60 border-emerald-100"
            : "bg-amber-50/60 border-amber-200"
        )}
      >
        {providerConfigured ? (
          <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
        ) : (
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
        )}
        <div className="text-xs">
          <strong className="font-bold block mb-0.5 text-slate-800">
            {providerConfigured
              ? "WhatsApp provider is configured"
              : "WhatsApp provider is not configured"}
          </strong>
          <span className="text-slate-600">
            {providerConfigured
              ? "Real messages will be sent via the Meta WhatsApp Cloud API using the approved template."
              : "Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your hosting environment. In production, sends will fail safely until configured."}
          </span>
        </div>
      </div>

      {/* ── Automation Settings ── */}
      <div className="bg-white premium-shadow rounded-[2rem] p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Automation Settings
          </h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div>
            <p className="font-bold text-sm text-slate-800">Automated rent reminders</p>
            <p className="text-xs text-slate-500">
              Runs on day {form.reminderDay} of each month at{" "}
              {String(form.reminderHour).padStart(2, "0")}:00 ({form.timezone}).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              form.enabled ? "bg-emerald-500" : "bg-slate-300"
            )}
            aria-pressed={form.enabled}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                form.enabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Reminder Day of Month" icon={Clock}>
            <input
              type="number"
              min={1}
              max={28}
              value={form.reminderDay}
              onChange={(e) => setForm((f) => ({ ...f, reminderDay: Number(e.target.value) }))}
              className={inputClass}
            />
          </Field>
          <Field label="Reminder Hour (24h)" icon={Clock}>
            <input
              type="number"
              min={0}
              max={23}
              value={form.reminderHour}
              onChange={(e) => setForm((f) => ({ ...f, reminderHour: Number(e.target.value) }))}
              className={inputClass}
            />
          </Field>
          <Field label="Timezone" icon={Clock}>
            <input value={form.timezone} disabled className={cn(inputClass, "opacity-70")} />
          </Field>
          <Field label="Template Language" icon={MessageSquare}>
            <input
              value={form.templateLanguage}
              onChange={(e) => setForm((f) => ({ ...f, templateLanguage: e.target.value }))}
              className={inputClass}
              placeholder="en_US"
            />
          </Field>
          <Field label="WhatsApp Template Name" icon={MessageSquare}>
            <input
              value={form.templateName}
              onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))}
              className={inputClass}
              placeholder="rent_due_reminder"
            />
          </Field>
          <Field label="Support / Contact (signature)" icon={MessageSquare}>
            <input
              value={form.supportContact}
              onChange={(e) => setForm((f) => ({ ...f, supportContact: e.target.value }))}
              className={inputClass}
              placeholder="JR Arcade Management"
            />
          </Field>
        </div>

        <Field label="Default Payment Instructions" icon={MessageSquare}>
          <textarea
            value={form.paymentInstructions}
            onChange={(e) => setForm((f) => ({ ...f, paymentInstructions: e.target.value }))}
            rows={2}
            className={cn(inputClass, "rounded-2xl resize-none")}
            placeholder="e.g. Please deposit at Bank Account 0000-0000..."
          />
        </Field>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={16} /> {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* ── Message Preview ── */}
      <div className="bg-white premium-shadow rounded-[2rem] p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Eye size={16} className="text-blue-500" /> Message Preview
          </h2>
        </div>

        <Field label="Preview using tenant" icon={MessageSquare}>
          <select
            value={previewTenantId}
            onChange={(e) => setPreviewTenantId(e.target.value ? Number(e.target.value) : "")}
            className={inputClass}
          >
            <option value="">Sample data</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.offices.join(", ")}
              </option>
            ))}
          </select>
        </Field>

        <div className="bg-[#e5ddd5] rounded-2xl p-4">
          <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm max-w-md whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
            {buildDetailedPreview(previewCtx)}
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          <strong>Note:</strong> actual delivery uses the approved provider template
          (<code className="bg-slate-100 px-1 rounded">{form.templateName}</code>). Concise
          fallback: <span className="italic">{buildPreviewText(previewCtx)}</span>
        </p>
      </div>

      {/* ── Manual Test ── */}
      <div className="bg-white premium-shadow rounded-[2rem] p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-amber-500 rounded-full" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Send size={16} className="text-amber-500" /> Manual Test Send
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Sends a real WhatsApp message to the selected tenant. Test sends are logged
          separately and rate-limited.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Field label="Select tenant" icon={Send}>
              <select
                value={testTenantId}
                onChange={(e) => setTestTenantId(e.target.value ? Number(e.target.value) : "")}
                className={inputClass}
              >
                <option value="">Choose a tenant…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.offices.join(", ")}
                    {!(t.whatsappNumber || t.phone) ? " (no number)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            type="button"
            disabled={isPending || testTenantId === "" || !testTenantHasNumber}
            onClick={() => setConfirmOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-full text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={16} /> Send Test
          </button>
        </div>
        {testTenantId !== "" && !testTenantHasNumber && (
          <p className="text-xs text-rose-500 font-medium">
            This tenant has no phone number — test sending is disabled.
          </p>
        )}
      </div>

      {/* ── Activity Log ── */}
      <div className="bg-white premium-shadow rounded-[2rem] overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Filter size={16} className="text-slate-400" /> Reminder Activity Log
          </h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => applyFilters({ status: e.target.value })}
              className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none"
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="skipped">Skipped</option>
            </select>
            <input
              defaultValue={filters.period}
              placeholder="Period e.g. 2026-07"
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters({ period: (e.target as HTMLInputElement).value });
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none w-36"
            />
            <input
              defaultValue={filters.tenant}
              placeholder="Tenant name"
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters({ tenant: (e.target as HTMLInputElement).value });
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none w-36"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                {["Date", "Tenant", "Unit", "Period", "Type", "Number", "Status", "Msg ID", "Attempts", "Reason", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/60 text-sm">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                    {log.tenantName}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{log.unit || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{log.billingPeriod}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold uppercase text-[9px]">
                      {log.reminderType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {log.phoneNumberMasked || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase",
                        STATUS_STYLES[log.status] ?? "bg-slate-100 text-slate-500"
                      )}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-[140px] truncate">
                    {log.providerMessageId || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 text-center">{log.attemptCount}</td>
                  <td className="px-4 py-3 text-xs text-rose-500 max-w-[180px] truncate" title={log.errorMessage ?? ""}>
                    {log.errorCode ? `${log.errorCode}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {log.status === "failed" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRetry(log.id)}
                        className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-500 text-emerald-700 hover:text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-all disabled:opacity-50"
                      >
                        <RefreshCw size={11} /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center text-muted-foreground text-sm">
                    No reminder activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm test dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Send a real WhatsApp message?</h3>
            </div>
            <p className="text-sm text-slate-600">
              This will send an <strong>actual WhatsApp message</strong> to{" "}
              <strong>{testTenant?.name}</strong> ({testTenant?.whatsappNumber || testTenant?.phone}).
              Test sends are logged separately from scheduled reminders.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTest}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                <Send size={14} /> Yes, send it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-[#F3F4F6] border-none rounded-full px-5 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium placeholder:text-slate-400";

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 ml-2">
        <Icon size={11} />
        {label}
      </label>
      {children}
    </div>
  );
}
