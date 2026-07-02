import { describe, it, expect } from "vitest";
import { buildTemplateVariables, buildPreviewText } from "./template";

const ctx = {
  tenantName: "Ali Khan",
  billingMonthLabel: "July 2026",
  propertyName: "JR Arcade",
  unit: "Shop 12",
  outstandingAmount: 25000,
  supportContact: "JR Arcade Management",
};

describe("buildTemplateVariables", () => {
  it("maps context to ordered {{1}}..{{6}} slots", () => {
    const vars = buildTemplateVariables(ctx);
    expect(vars).toHaveLength(6);
    expect(vars[0]).toBe("Ali Khan");
    expect(vars[1]).toBe("July 2026");
    expect(vars[2]).toBe("JR Arcade");
    expect(vars[3]).toBe("Shop 12");
    expect(vars[4]).toBe("Rs. 25,000");
    expect(vars[5]).toBe("JR Arcade Management");
  });

  it("shows N/A when outstanding amount is unknown", () => {
    const vars = buildTemplateVariables({ ...ctx, outstandingAmount: null });
    expect(vars[4]).toBe("N/A");
  });
});

describe("buildPreviewText", () => {
  it("produces the concise fallback reminder text", () => {
    expect(buildPreviewText(ctx)).toBe(
      "Assalam-o-Alaikum Ali Khan, aap ka July 2026 ka rent due hai. Meherbani farma kar ke jald adaigi kar dein. Shukriya."
    );
  });
});
