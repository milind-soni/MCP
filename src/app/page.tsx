"use client";

import MCPClient from "./components/MCPClient/MCPClient";
import styles from "../style/page.module.css";

import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const tokens = searchParams.get("tokens")?.split(",") as string[];
  
  // http://localhost:3000/?tokens=fsh_67LUyn8q5fpZCb9MK3xpg1%2Cfsh_67LUyn8q5fpZCb9MK3xpg2%2Cfsh_67LUyn8q5fpZCb9MK3xpg3

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
