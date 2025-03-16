'use client'
import MCPClient from "./components/MCPClient/MCPClient";
import styles from "../style/page.module.css";
 
import { useParams } from 'next/navigation'
export default function Home() {
  const params = useParams()

  return (
    <div className={styles.page}>
      <MCPClient />
    </div>
  );
}
