import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const query = await req.text();
  const sessionId = req.nextUrl.searchParams.get("session_id");

  // const response = await fetch(
  //   "YOUR_EXTERNAL_API/messages/?session_id=" + sessionId,
  //   {
  //     method: "POST",
  //     body: query,
  //     headers: {
  //       "Content-Type": "application/json",
  //       // Add any required auth headers
  //     },
  //   }
  // );

  // return new Response(response.body, {
  //   headers: {
  //     "Content-Type": "text/event-stream",
  //     "Cache-Control": "no-cache",
  //     Connection: "keep-alive",
  //   },
  // });

  // Simulate streaming response (replace with your external API call)
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Simulate tool call
      controller.enqueue(
        encoder.encode(
          JSON.stringify({
            content: [
              {
                type: "tool_call",
                name: "example_tool",
                args: JSON.stringify({ param: "value" }),
              },
            ],
          }) + "\n"
        )
      );

      // Simulate message
      controller.enqueue(
        encoder.encode(
          JSON.stringify({
            content: [
              {
                type: "message",
                data: `Response to: ${query}`,
              },
            ],
          }) + "\n"
        )
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
