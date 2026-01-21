"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Topbar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid #e5e5e5",
        backgroundColor: "#fff",
      }}
    >
      <Link
        href="/app"
        style={{
          fontSize: 18,
          fontWeight: 600,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        Financeiro & Contábil
      </Link>
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
