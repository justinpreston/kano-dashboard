"use client";

import { Dock } from "@/components/shell/Dock";
import { TopBar } from "@/components/shell/TopBar";
import { StatusBar } from "@/components/shell/StatusBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="kano-shell" style={{ minHeight: "100vh" }}>
      <Dock />
      <TopBar />
      
      <main
        style={{
          marginLeft: "68px", // Width of dock
          marginTop: "48px", // Height of top bar
          marginBottom: "32px", // Height of status bar
          minHeight: "calc(100vh - 48px - 32px)",
          padding: "24px",
        }}
      >
        {children}
      </main>

      <StatusBar />
    </div>
  );
}
