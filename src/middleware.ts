import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/api/stations", "/api/mapbox"];

function blocked(): NextResponse {
  return NextResponse.json({ error: "Requête non autorisée" }, { status: 403 });
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (request.headers.get("x-app-request") !== "1") return blocked();

  // Browsers always send Accept-Language; most bot frameworks don't
  if (!request.headers.get("accept-language")) return blocked();

  // Block common non-browser HTTP clients
  const ua = request.headers.get("user-agent") ?? "";
  if (
    !ua ||
    /python-requests|python\/|curl\/|wget\/|scrapy|go-http-client|java\/|httpclient|okhttp|node-fetch|got\/|axios\/\d/i.test(ua)
  ) {
    return blocked();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/stations", "/api/mapbox"],
};
