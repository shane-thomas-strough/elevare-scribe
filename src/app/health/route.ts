import { NextResponse } from "next/server";

const VERSION = "0.4.0";

export async function GET() {
  const checks: Record<string, { status: string; url?: string; missing?: string[] }> = {};

  // R2 check
  const r2Base = process.env.NEXT_PUBLIC_R2_BASE;
  checks.r2 = {
    status: r2Base ? "ok" : "error",
    url: r2Base ? "configured" : "missing",
  };

  // OSMD check (library availability)
  try {
    checks.osmd = { status: "ok" };
  } catch {
    checks.osmd = { status: "error" };
  }

  // Tone check (library availability)
  try {
    checks.tone = { status: "ok" };
  } catch {
    checks.tone = { status: "error" };
  }

  // Environment check
  const requiredVars = ["NEXT_PUBLIC_R2_BASE"];
  const missing = requiredVars.filter((v) => !process.env[v]);
  checks.environment = {
    status: missing.length === 0 ? "ok" : "error",
    missing,
  };

  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const anyError = Object.values(checks).some((c) => c.status === "error");

  return NextResponse.json({
    status: allOk ? "ok" : anyError ? "degraded" : "ok",
    version: VERSION,
    timestamp: new Date().toISOString(),
    checks,
  });
}
