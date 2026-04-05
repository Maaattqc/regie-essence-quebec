import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { commentSchema, voteSchema } from "@/lib/schemas";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

function isAdmin(email: string | undefined) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

function getToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace("Bearer ", "") || null;
}

async function getUser(token: string) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

// GET comments for a station
export async function GET(request: NextRequest) {
  if (!(await rateLimit(getIP(request)))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const { searchParams } = request.nextUrl;
  const station = searchParams.get("station");
  const address = searchParams.get("address");
  if (!station || !address) return NextResponse.json({ error: "station et address requis" }, { status: 400 });

  const { data: comments } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("station_name", station)
    .eq("address", address)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const userIds = [...new Set((comments || []).map((c) => c.user_id).filter(Boolean))];
  const emails: Record<string, string> = {};
  for (const uid of userIds) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (u?.user?.email) emails[uid] = u.user.email.split("@")[0];
  }

  const token = getToken(request);
  const anonymousId = searchParams.get("anonymous_id");
  let myVotes: Record<number, number> = {};
  if (token) {
    const user = await getUser(token);
    if (user) {
      const { data: votes } = await supabaseAdmin
        .from("comment_votes")
        .select("comment_id, vote")
        .eq("user_id", user.id);
      myVotes = Object.fromEntries((votes || []).map((v) => [v.comment_id, v.vote]));
    }
  } else if (anonymousId) {
    const { data: votes } = await supabaseAdmin
      .from("comment_votes")
      .select("comment_id, vote")
      .eq("anonymous_id", anonymousId)
      .is("user_id", null);
    myVotes = Object.fromEntries((votes || []).map((v) => [v.comment_id, v.vote]));
  }

  const result = (comments || []).map((c) => ({
    id: c.id,
    content: c.content,
    parent_id: c.parent_id,
    likes: c.likes,
    dislikes: c.dislikes,
    created_at: c.created_at,
    author: c.user_id
      ? (emails[c.user_id] || "Anonyme")
      : `Anonyme-${(c.anonymous_id || "0000").slice(0, 4)}`,
    user_id: c.user_id,
    my_vote: myVotes[c.id] || 0,
  }));

  return NextResponse.json(result);
}

// POST new comment or vote
export async function POST(request: NextRequest) {
  if (!(await rateLimit(getIP(request)))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const token = getToken(request);
  const user = token ? await getUser(token) : null;
  const body = await request.json();

  // Vote action (atomique via RPC)
  if (body.action === "vote") {
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    const { comment_id, vote, anonymous_id } = parsed.data;

    if (!user && !anonymous_id) return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });

    const { error: rpcError } = await supabaseAdmin.rpc("handle_vote", {
      p_comment_id: comment_id,
      p_vote: vote,
      p_user_id: user?.id ?? null,
      p_anonymous_id: user ? null : (anonymous_id ?? null),
    });

    if (rpcError) return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // New comment
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  const { station_name, address, content, parent_id, anonymous_id } = parsed.data;

  if (!user && !anonymous_id) {
    return NextResponse.json({ error: "Identifiant anonyme requis" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("comments").insert({
    user_id: user?.id || null,
    anonymous_id: user ? null : anonymous_id!,
    station_name,
    address,
    content,
    parent_id: parent_id || null,
  });

  if (error) return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE comment (admin only)
export async function DELETE(request: NextRequest) {
  if (!(await rateLimit(getIP(request)))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const user = await getUser(token);
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { comment_id } = await request.json();
  if (!comment_id || typeof comment_id !== "number") return NextResponse.json({ error: "comment_id requis (number)" }, { status: 400 });

  const now = new Date().toISOString();
  await supabaseAdmin.from("comments").update({ deleted_at: now }).eq("parent_id", comment_id);
  const { error } = await supabaseAdmin.from("comments").update({ deleted_at: now }).eq("id", comment_id);

  if (error) return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
