"use client";

import { useState, useCallback, useRef } from "react";

interface Message {
  id: string;
  type: "tool_call" | "message";
  content: {
    name?: string;
    args?: string;
    data?: string;
  };
  timestamp: Date;
}

interface UseChatStreamOptions {
  apiRoute?: string;
  initialTokens?: string[];
}

export function useChat({
  apiRoute = "/api/chat",
  initialTokens = [],
}: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<string[]>(initialTokens);
  const abortControllerRef = useRef<AbortController | null>(null);

  const appendMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          ...message,
        },
      ]);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;

      setIsLoading(true);
      const userMessage = {
        type: "message" as const,
        content: { data: input },
      };
      appendMessage(userMessage);
      setInput("");

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch(
          `${apiRoute}?session_id=${crypto.randomUUID()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(tokens.length > 0 && {
                Authorization: `Bearer ${tokens.join(",")}`,
              }),
            },
            body: JSON.stringify(input),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) throw new Error("Network response was not ok");
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.content) {
                parsed.content.forEach((item: any) => {
                  appendMessage({
                    type: item.type,
                    content:
                      item.type === "tool_call"
                        ? { name: item.name, args: item.args }
                        : { data: item.data },
                  });
                });
              }
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          appendMessage({
            type: "message",
            content: { data: `Error: ${error.message}` },
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, apiRoute, tokens, appendMessage]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    stop,
    setTokens,
  };
}
