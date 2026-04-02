import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://api.github.com/repos/Maaattqc/regie-essence-quebec/commits?per_page=50",
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = await res.json();

  const commits = data.map((c: { sha: string; commit: { message: string; author: { date: string } } }) => ({
    sha: c.sha,
    date: c.commit.author.date,
    message: c.commit.message.split("\n")[0],
  }));

  return NextResponse.json(commits);
}
