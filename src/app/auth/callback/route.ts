import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  if (!(await rateLimit(getIP(request)))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as "magiclink" });
    if (!error && data.user?.email) {
      await logActivity("auth", "Connexion réussie", data.user.email, { method: type });
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}
