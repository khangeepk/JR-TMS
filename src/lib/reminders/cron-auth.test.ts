import { describe, it, expect } from "vitest";
import { isAuthorizedCron } from "./cron-auth";

describe("isAuthorizedCron", () => {
  const env = { cronSecret: "s3cret", authToken: undefined };

  it("accepts a matching CRON_SECRET bearer token", () => {
    expect(isAuthorizedCron("Bearer s3cret", env)).toBe(true);
  });

  it("rejects a missing Authorization header", () => {
    expect(isAuthorizedCron(null, env)).toBe(false);
    expect(isAuthorizedCron(undefined, env)).toBe(false);
  });

  it("rejects an incorrect secret", () => {
    expect(isAuthorizedCron("Bearer wrong", env)).toBe(false);
    expect(isAuthorizedCron("s3cret", env)).toBe(false); // missing "Bearer "
  });

  it("fails closed when no secret is configured", () => {
    expect(isAuthorizedCron("Bearer anything", {})).toBe(false);
  });

  it("also accepts the legacy AUTH_TOKEN bearer", () => {
    expect(
      isAuthorizedCron("Bearer legacy", { cronSecret: "s3cret", authToken: "legacy" })
    ).toBe(true);
  });
});
