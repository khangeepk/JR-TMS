// src/lib/reminders/template.ts
//
// Builds the ordered variable list for the approved WhatsApp template and the
// plain-text preview shown in the admin panel.
//
// Approved template body (variables {{1}}..{{6}}):
//   Assalam-o-Alaikum {{1}},
//   Aap ka {{2}} ka rent due hai.
//   Property: {{3}}
//   Unit: {{4}}
//   Outstanding Rent: {{5}}
//   Meherbani farma kar ke jald adaigi kar dein.
//   Shukriya,
//   {{6}}

export interface TemplateContext {
  tenantName: string;
  billingMonthLabel: string; // e.g. "July 2026"
  propertyName: string;
  unit: string; // office/flat/shop
  outstandingAmount?: number | null;
  supportContact?: string; // signature / support line ({{6}})
  currency?: string; // default "Rs."
}

function formatAmount(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "N/A";
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/** Ordered variables for the approved template's {{1}}..{{6}} slots. */
export function buildTemplateVariables(ctx: TemplateContext): string[] {
  const currency = ctx.currency || "Rs.";
  return [
    ctx.tenantName || "Tenant",
    ctx.billingMonthLabel,
    ctx.propertyName || "-",
    ctx.unit || "-",
    formatAmount(ctx.outstandingAmount, currency),
    ctx.supportContact || "Management",
  ];
}

/**
 * Simple fallback preview text for the admin panel. This mirrors the concise
 * reminder wording and is NOT what gets sent (the provider sends the approved
 * template), but it lets admins eyeball the message.
 */
export function buildPreviewText(ctx: TemplateContext): string {
  return `Assalam-o-Alaikum ${ctx.tenantName || "{tenantName}"}, aap ka ${ctx.billingMonthLabel} ka rent due hai. Meherbani farma kar ke jald adaigi kar dein. Shukriya.`;
}

/** Full preview reflecting the multi-line approved template layout. */
export function buildDetailedPreview(ctx: TemplateContext): string {
  const currency = ctx.currency || "Rs.";
  const lines = [
    `Assalam-o-Alaikum ${ctx.tenantName || "{tenantName}"},`,
    "",
    `Aap ka ${ctx.billingMonthLabel} ka rent due hai.`,
    "",
    `Property: ${ctx.propertyName || "-"}`,
    `Unit: ${ctx.unit || "-"}`,
    `Outstanding Rent: ${formatAmount(ctx.outstandingAmount, currency)}`,
    "",
    "Meherbani farma kar ke jald adaigi kar dein.",
    "",
    "Shukriya,",
    ctx.supportContact || "Management",
  ];
  return lines.join("\n");
}
