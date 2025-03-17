import MCPClient from "@/utils/MCP";
import { SseError } from "@/utils/SSEClient";
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

export async function getSession(udf_tokens: string[], regenerate = false) {
  const session = cookies().get("session")?.value;

  if (!session || regenerate) {
    const options = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ udf_tokens }),
    };

    try {
      const response = await fetch(ENDPOINTS.create, options);
      const data = (await response.json()) as Session;
      console.log("Data :", data);
      console.log("Session :", session);
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
  async function connectClient(sessionId: string, udf_tokens: string[]) {
    let client = new MCPClient(
      ENDPOINTS.sse.replace("{session_id}", sessionId)
    );
    try {
      await client.connectToServer();
      return client;
    } catch (error: unknown) {
      if (
        (error as SseError).event.code === 503 ||
        (error as SseError).event.code === 404
      ) {
        const session = await getSession(udf_tokens, true);
        if (!session) {
          return null;
        }
        client = new MCPClient(
          ENDPOINTS.sse.replace("{session_id}", session.id)
        );
        try {
          await client.connectToServer();
          return client;
        } catch (error: unknown) {
          return null;
        }
      }
      return null;
    }
  }

  function createStream(client: MCPClient, query: string) {
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of client.processQuery(query)) {
            const data = JSON.stringify(chunk) + "\n";
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });
  }

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

    let session = await getSession(udf_tokens);
    if (!session) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const client = await connectClient(session.id, udf_tokens);
    if (!client) {
      return NextResponse.json(
        { error: "Failed to connect to server" },
        { status: 500 }
      );
    }

    const stream = createStream(client, query);
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
