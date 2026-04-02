import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    "https://api.github.com/repos/Maaattqc/regie-essence-quebec/commits?per_page=50",
    { headers, next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = await res.json();

  const commits = data.map((c: { sha: string; commit: { message: string; author: { date: string } } }) => ({
    sha: c.sha,
    date: c.commit.author.date,
    message: c.commit.message.split("\n")[0],
    author: "Mathieu Fournier",
  }));

  return NextResponse.json(commits);
}
