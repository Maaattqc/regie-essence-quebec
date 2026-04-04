import { supabaseAdmin } from "@/lib/supabase";

export type LogCategory = "sync" | "cron" | "auth" | "report" | "admin" | "erreur" | "suggestion";

export async function logActivity(
  category: LogCategory,
  action: string,
  detail?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await supabaseAdmin.from("activity_logs").insert({
      category,
      action,
      detail: detail ?? null,
      metadata: metadata ?? {},
    });
  } catch (error) {
    // Ne jamais bloquer le flux principal si le log échoue
    console.error("[activity-log] Échec insertion:", error);
  }
}
