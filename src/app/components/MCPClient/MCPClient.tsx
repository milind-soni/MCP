"use client";

import { useState } from "react";
import styles from "./MCPClient.module.css";

type Message = {
  role: "user" | "bot";
  type: "text" | "tool_use";
  content: string;
  toolData?: { toolName: string; toolArgs: any; result: any };
};

export default function MCPClient({ tokens }: { tokens: string[] }) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      { role: "user", type: "text", content: inputValue },
    ]);
    const query = inputValue;
    setInputValue("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          udf_tokens: tokens,
          query,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let botTextMessage = "";
      const decoder = new TextDecoder();

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          const data = JSON.parse(line);

          if (data.type === "text") {
            botTextMessage += data.text;

            // Update or add text message
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage?.role === "bot" && lastMessage.type === "text") {
                lastMessage.content = botTextMessage;
              } else {
                newMessages.push({
                  role: "bot",
                  type: "text",
                  content: botTextMessage,
                });
              }
              return newMessages;
            });
          } else if (data.type === "tool_use") {
            // Add tool_use message as a separate bubble
            setMessages((prev) => [
              ...prev,
              {
                role: "bot",
                type: "tool_use",
                content: JSON.stringify(
                  {
                    toolName: data.toolName,
                    toolArgs: data.toolArgs,
                    result: data.result,
                  },
                  null,
                  2
                ),
                toolData: {
                  toolName: data.toolName,
                  toolArgs: data.toolArgs,
                  result: data.result,
                },
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", type: "text", content: "An error occurred." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {messages.map((message, i) => (
          <div
            key={i}
            className={`${styles.message} ${styles[message.role]} ${
              message.type === "tool_use" ? styles.toolMessage : ""
            }`}
          >
            {message.type === "text" ? (
              <p>{message.content}</p>
            ) : (
              <pre>{message.content}</pre>
            )}
          </div>
        ))}
      </div>
      <form className={styles.chatInput} onSubmit={handleSubmit} method="POST">
        <input
          id="query"
          value={inputValue}
          placeholder="Type a message..."
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
        <span>Fused + Claude Sonnet</span>
      </form>
    </div>
  );
}
