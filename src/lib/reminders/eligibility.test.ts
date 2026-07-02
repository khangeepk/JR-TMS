import { describe, it, expect } from "vitest";
import { evaluateEligibility, type EligibilityTenant } from "./eligibility";

const activeTenant: EligibilityTenant = {
  id: 1,
  name: "Ali Khan",
  phone: "03001234567",
  isActive: true,
  whatsappOptIn: true,
  doNotContact: false,
};

const enabledCtx = { automationEnabled: true, rentFullyPaid: false };

describe("evaluateEligibility", () => {
  it("sends to an active tenant with unpaid rent", () => {
    expect(evaluateEligibility(activeTenant, enabledCtx)).toEqual({ eligible: true });
  });

  it("does not send when rent is fully paid", () => {
    const res = evaluateEligibility(activeTenant, { automationEnabled: true, rentFullyPaid: true });
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("already_paid");
  });

  it("does not send to inactive / vacated tenants", () => {
    const res = evaluateEligibility({ ...activeTenant, isActive: false }, enabledCtx);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("tenant_inactive");
  });

  it("does not send when there is no valid phone number", () => {
    const res = evaluateEligibility({ ...activeTenant, phone: "" }, enabledCtx);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("invalid_phone");
  });

  it("respects opt-out and do-not-contact flags", () => {
    expect(
      evaluateEligibility({ ...activeTenant, whatsappOptIn: false }, enabledCtx).reason
    ).toBe("not_opted_in");
    expect(
      evaluateEligibility({ ...activeTenant, doNotContact: true }, enabledCtx).reason
    ).toBe("do_not_contact");
  });

  it("does not send when automation is globally disabled", () => {
    const res = evaluateEligibility(activeTenant, { automationEnabled: false, rentFullyPaid: false });
    expect(res.reason).toBe("automation_disabled");
  });

  it("treats legacy tenants (undefined flags) as eligible", () => {
    const legacy: EligibilityTenant = { id: 2, name: "Legacy", phone: "03007654321" };
    expect(evaluateEligibility(legacy, enabledCtx).eligible).toBe(true);
  });

  it("prefers whatsappNumber over phone for validation", () => {
    const res = evaluateEligibility(
      { ...activeTenant, phone: "bad", whatsappNumber: "03009999999" },
      enabledCtx
    );
    expect(res.eligible).toBe(true);
  });
});
