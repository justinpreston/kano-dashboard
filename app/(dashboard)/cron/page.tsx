"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CronRow } from "@/components/ui/CronRow";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";

interface CronItem {
  id: string;
  label: string;
  schedule: string;
  nextRun: string;
  status: string;
}

export default function CronPage() {
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crons")
      .then((res) => res.json())
      .then((data) => setCrons(Array.isArray(data) ? data : []))
      .catch(() => setCrons([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          ⏱️ Cron Jobs
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Read-only schedule overview</p>
      </div>

      <div className="mb-6">
        <SectionHeader label="Weekly Calendar" />
        <div className="mt-4">
          <WeeklyCalendar />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Upcoming Jobs
          </div>
        </div>
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : crons.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No cron jobs found</div>
          ) : (
            crons.map((job) => (
              <CronRow
                key={job.id}
                name={job.label || "Cron job"}
                nextRun={new Date(job.nextRun).toLocaleString()}
                status={job.status === "active" ? "OK" : "WARN"}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
