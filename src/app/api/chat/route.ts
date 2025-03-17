import MCPClient from "@/utils/MCP";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ENDPOINTS = {
  create: "https://unstable.fused.io/server/v1/udf_chat/create",
  sse: "https://unstable.udf.ai/chat/{session_id}/sse",
  message:
    "https://unstable.udf.ai/chat/{session_id}/messages/?session_id={session_id}",
};

interface Session {
  id: string;
  udf_tokens: string[];
  owning_user_id: string | null;
  created_at: string;
  last_updated: string;
  status: string;
}

export async function getMessageEndpoint(session_id: string) {
  const response = await fetch(
    ENDPOINTS.sse.replace("{session_id}", session_id)
  );
}

export async function getSession(udf_tokens: string[]) {
  const session = cookies().get("session")?.value;

  // if there is no session id in the cookies, create a new session
  if (!session) {
    const options = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ udf_tokens }),
    };

    try {
      const response = await fetch(ENDPOINTS.create, options);
      const data = (await response.json()) as Session;
      cookies().set("session", JSON.stringify(data), {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
      });

      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  } else {
    return JSON.parse(session) as Session;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { udf_tokens, query } = body as {
      udf_tokens: string[];
      query: string;
    };

    if (!udf_tokens || !Array.isArray(udf_tokens)) {
      return NextResponse.json(
        { error: "udf_tokens must be an array" },
        { status: 400 }
      );
    }

    const session = await getSession(udf_tokens);

    if (!session) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const client = new MCPClient(
      ENDPOINTS.sse.replace("{session_id}", session.id)
    );

    return NextResponse.json({ response: await client.processQuery(query) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
