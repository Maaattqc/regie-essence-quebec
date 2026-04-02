import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIP } from "@/lib/rateLimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  if (!rateLimit(getIP(request))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const { searchParams } = request.nextUrl;
  const station = searchParams.get("station");
  const address = searchParams.get("address");
  if (!station || !address) return NextResponse.json({ error: "station et address requis" }, { status: 400 });

  // Get all comments for this station
  const { data: comments } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("station_name", station)
    .eq("address", address)
    .order("created_at", { ascending: false });

  // Get emails
  const userIds = [...new Set((comments || []).map((c) => c.user_id))];
  const emails: Record<string, string> = {};
  for (const uid of userIds) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (u?.user?.email) emails[uid] = u.user.email.split("@")[0];
  }

  // Get current user's votes
  const token = getToken(request);
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
  }

  const result = (comments || []).map((c) => ({
    id: c.id,
    content: c.content,
    parent_id: c.parent_id,
    likes: c.likes,
    dislikes: c.dislikes,
    created_at: c.created_at,
    author: emails[c.user_id] || "Anonyme",
    user_id: c.user_id,
    my_vote: myVotes[c.id] || 0,
  }));

  return NextResponse.json(result);
}

// POST new comment or vote
export async function POST(request: NextRequest) {
  if (!rateLimit(getIP(request))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();

  // Vote action
  if (body.action === "vote") {
    const { comment_id, vote } = body;
    if (!comment_id || ![1, -1].includes(vote)) return NextResponse.json({ error: "Invalide" }, { status: 400 });

    // Check existing vote
    const { data: existing } = await supabaseAdmin
      .from("comment_votes")
      .select("vote")
      .eq("user_id", user.id)
      .eq("comment_id", comment_id)
      .single();

    if (existing) {
      if (existing.vote === vote) {
        // Remove vote (toggle off)
        await supabaseAdmin.from("comment_votes").delete().eq("user_id", user.id).eq("comment_id", comment_id);
        const col = vote === 1 ? "likes" : "dislikes";
        await supabaseAdmin.rpc("decrement", { row_id: comment_id, col_name: col });
      } else {
        // Switch vote
        await supabaseAdmin.from("comment_votes").update({ vote }).eq("user_id", user.id).eq("comment_id", comment_id);
        const addCol = vote === 1 ? "likes" : "dislikes";
        const removeCol = vote === 1 ? "dislikes" : "likes";
        await supabaseAdmin.rpc("increment", { row_id: comment_id, col_name: addCol });
        await supabaseAdmin.rpc("decrement", { row_id: comment_id, col_name: removeCol });
      }
    } else {
      // New vote
      await supabaseAdmin.from("comment_votes").insert({ user_id: user.id, comment_id, vote });
      const col = vote === 1 ? "likes" : "dislikes";
      await supabaseAdmin.rpc("increment", { row_id: comment_id, col_name: col });
    }
    return NextResponse.json({ ok: true });
  }

  // New comment
  const { station_name, address, content, parent_id } = body;
  if (!station_name || !address || !content || content.length < 1) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("comments").insert({
    user_id: user.id,
    station_name,
    address,
    content,
    parent_id: parent_id || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE comment (admin only)
export async function DELETE(request: NextRequest) {
  if (!rateLimit(getIP(request))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const user = await getUser(token);
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { comment_id } = await request.json();
  if (!comment_id) return NextResponse.json({ error: "comment_id requis" }, { status: 400 });

  // Delete child comments (replies) first, then the comment itself
  await supabaseAdmin.from("comment_votes").delete().in(
    "comment_id",
    (await supabaseAdmin.from("comments").select("id").eq("parent_id", comment_id)).data?.map((c) => c.id) || []
  );
  await supabaseAdmin.from("comments").delete().eq("parent_id", comment_id);
  await supabaseAdmin.from("comment_votes").delete().eq("comment_id", comment_id);
  const { error } = await supabaseAdmin.from("comments").delete().eq("id", comment_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
