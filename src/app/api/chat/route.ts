import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const query = await req.text();
  const sessionId = req.nextUrl.searchParams.get("session_id");
}
