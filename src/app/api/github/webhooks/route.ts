import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  handlePullRequestWebhook,
  verifyGitHubWebhookSignature,
  type PullRequestWebhookPayload,
} from "@/lib/github/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "missing_webhook_secret" },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  const isSignatureValid = verifyGitHubWebhookSignature({
    payload,
    signatureHeader,
    secret: webhookSecret,
  });

  if (!isSignatureValid) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  if (!event) {
    return NextResponse.json({ ok: false, error: "missing_event_header" }, { status: 400 });
  }

  if (event === "ping") {
    return NextResponse.json({ ok: true, event: "ping" });
  }

  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, ignored: true, reason: `ignored_event_${event}` });
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(payload);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json_payload" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const result = await handlePullRequestWebhook({
      supabase,
      payload: parsedPayload as PullRequestWebhookPayload,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GitHub webhook processing failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ ok: false, error: "webhook_processing_failed" }, { status: 500 });
  }
}
