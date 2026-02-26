"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ActivityRow } from "@/components/ui/ActivityRow";

interface ActivityItem {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => res.json())
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          📈 Activity Feed
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Latest agent activity (read-only)</p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Recent Activity
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No activity found</div>
          ) : (
            activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                time={new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                agent={activity.type}
                description={activity.description}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
