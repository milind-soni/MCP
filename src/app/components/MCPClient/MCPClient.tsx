"use client";

import styles from "./MCPClient.module.css";
import { useChat } from "@/hooks/useChat";

export default function MCPClient() {
  const { messages, input, setInput, isLoading, handleSubmit, setTokens } =
    useChat({
      apiRoute: "/api/chat",
      initialTokens: ["token1", "token2"], // Optional tokens
    });

  return (
    <div className={styles.container}>
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div key={message.id} className={styles.message}>
            {message.type === "tool_call" ? (
              <div className={styles.messageContent}>
                <span className={styles.toolCall}>Tool Call:</span>{" "}
                {message.content.name}
                <br />
                <span>Args: {message.content.args}</span>
              </div>
            ) : (
              <div className={styles.messageContent}>
                {message.content.data}
              </div>
            )}
            {/* <span className={styles.timestamp}>
              {message.timestamp.toLocaleTimeString()}
            </span> */}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Type your message..."
          className={styles.input}
        />
        <button type="submit" disabled={isLoading} className={styles.button}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
