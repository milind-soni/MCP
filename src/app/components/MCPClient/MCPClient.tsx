"use client";

import { useState } from "react";
import styles from "./MCPClient.module.css";

export default function MCPClient() {
  const [inputValue, setInputValue] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {messages.map((message, i) => (
          <div key={i} className={styles.message + " " + styles[message.role]}>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form
        className={styles.chatInput}
        onSubmit={async (e: React.FormEvent) => {
          e.preventDefault();
          setIsLoading(true);

          setMessages((prev) => [
            ...prev,
            { role: "user", content: inputValue },
          ]);
          setInputValue("");

          try {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                udf_tokens: ["fsh_67LUyn8q5fpZCb9MK3xpg1"],
                query: inputValue,
              }),
            });

            const data = await res.json();

            setMessages((prev) => [
              ...prev,
              { role: "bot", content: data.response },
            ]);

            console.log(data);
          } catch (error) {
            console.error("Error:", error);
          } finally {
            setIsLoading(false);
          }
        }}
        method="POST"
      >
        <input
          id="query"
          value={inputValue}
          placeholder="Type a message..."
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
