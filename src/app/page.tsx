"use client";

import MCPClient from "./components/MCPClient/MCPClient";
import styles from "../style/page.module.css";

import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const tokens = searchParams.get("tokens")?.split(",") as string[];
  console.log("Tokens :", tokens);

  return (
    <div className={styles.page}>
      {tokens &&
      tokens.length > 0 &&
      tokens.every((token) => token.length > 0) ? (
        <MCPClient tokens={tokens} />
      ) : (
        <div className={styles.error}>
          <h1>Error</h1>
          <p>Missing tokens</p>
        </div>
      )}
    </div>
  );
}
