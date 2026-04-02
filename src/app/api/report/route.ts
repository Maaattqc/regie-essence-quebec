import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { z } from "zod";

export const reportSchema = z.object({
  station_name: z
    .string()
    .min(1, "Le nom de la station est requis"),
  address: z
    .string()
    .min(1, "L'adresse est requise"),
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z
    .string()
    .email("L'adresse courriel est invalide"),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères"),
});

export async function POST(request: NextRequest) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez plus tard" },
      { status: 429 },
    );
  }

  const body = await request.json();
  const result = reportSchema.safeParse(body);

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    return NextResponse.json(
      { error: "Données invalides", fieldErrors },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from("reports").insert(result.data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
