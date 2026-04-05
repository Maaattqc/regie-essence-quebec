import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface HealthCheck {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  checks: {
    supabase: { ok: boolean; latencyMs?: number; error?: string };
    upstash?: { ok: boolean; latencyMs?: number; error?: string };
  };
}

export async function GET() {
  const result: HealthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {
      supabase: { ok: false },
    },
  };

  // Vérifier Supabase
  try {
    const start = Date.now();
    const { error } = await supabaseAdmin
      .from("station_sync_state")
      .select("singleton")
      .limit(1);
    const latencyMs = Date.now() - start;
    result.checks.supabase = error
      ? { ok: false, latencyMs, error: error.message }
      : { ok: true, latencyMs };
  } catch (e) {
    result.checks.supabase = {
      ok: false,
      error: e instanceof Error ? e.message : "Supabase unreachable",
    };
  }

  // Vérifier Upstash Redis (si configuré)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const start = Date.now();
      const res = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/ping`,
        {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          signal: AbortSignal.timeout(3000),
        }
      );
      const latencyMs = Date.now() - start;
      result.checks.upstash = res.ok
        ? { ok: true, latencyMs }
        : { ok: false, latencyMs, error: `HTTP ${res.status}` };
    } catch (e) {
      result.checks.upstash = {
        ok: false,
        error: e instanceof Error ? e.message : "Upstash unreachable",
      };
    }
  }

  // Déterminer le statut global
  const allChecks = Object.values(result.checks);
  const anyDown = allChecks.some((c) => !c.ok);
  const allDown = allChecks.every((c) => !c.ok);

  if (allDown) result.status = "down";
  else if (anyDown) result.status = "degraded";

  const httpStatus = result.status === "down" ? 503 : 200;
  return NextResponse.json(result, { status: httpStatus });
}
