"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

interface MemoryFile {
  name: string;
  path: string;
  lastModified: string;
  size: number;
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selected, setSelected] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memory")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setFiles(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/memory?file=${encodeURIComponent(selected.path)}`)
      .then((res) => res.json())
      .then((data) => setContent(data.content || ""))
      .catch(() => setContent(""));
  }, [selected]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          🧠 Memory Viewer
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Read-only memory file browser</p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Memory Files
          </div>
        </div>
        <div className="flex" style={{ minHeight: "480px" }}>
          {/* File list */}
          <div style={{ width: "240px", borderRight: "1px solid var(--border)" }}>
            {loading ? (
              <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
            ) : files.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>No memory files</div>
            ) : (
              files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelected(file)}
                  className="w-full text-left px-4 py-2 text-sm"
                  style={{
                    backgroundColor: selected?.path === file.path ? "var(--accent-soft)" : "transparent",
                    color: selected?.path === file.path ? "var(--accent)" : "var(--text-secondary)",
                    borderLeft: selected?.path === file.path ? "3px solid var(--accent)" : "3px solid transparent",
                  }}
                >
                  {file.name}
                </button>
              ))
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4" style={{ backgroundColor: "var(--bg)" }}>
            {selected ? (
              <pre
                className="whitespace-pre-wrap text-sm"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
              >
                {content || "(empty file)"}
              </pre>
            ) : (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>Select a file to view</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
