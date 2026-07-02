import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/reminders/cron-auth";
import { runRentReminders } from "@/lib/reminders/service";

// Always run dynamically; never cache a cron response.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Monthly automated WhatsApp rent-due reminder job.
 *
 * Triggered by Vercel Cron (see vercel.json). Vercel automatically attaches
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is configured. We fail
 * closed if no secret is set, so this endpoint cannot be invoked anonymously.
 *
 * The job is idempotent: reminder rows are reserved via a unique DB constraint
 * before any message is sent, so an accidental double-trigger or retry will not
 * produce duplicate WhatsApp messages.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const authorized = isAuthorizedCron(authHeader, {
    cronSecret: process.env.CRON_SECRET,
    authToken: process.env.AUTH_TOKEN,
  });

  if (!authorized) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // `force` lets an authorized manual call bypass the day-of-month guard.
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "1";
    const dryRun = url.searchParams.get("dryRun") === "1";

    const summary = await runRentReminders({ force, dryRun });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("[cron:reminders] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Reminder job failed" },
      { status: 500 }
    );
  }
}
