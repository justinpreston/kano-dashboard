"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const typeConfig: Record<
  Notification["type"],
  {
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    colorVar: string;
    bgVar: string;
  }
> = {
  info: {
    icon: Info,
    colorVar: "#60a5fa",
    bgVar: "rgba(59, 130, 246, 0.12)",
  },
  success: {
    icon: CheckCircle,
    colorVar: "#4ade80",
    bgVar: "rgba(74, 222, 128, 0.12)",
  },
  warning: {
    icon: AlertTriangle,
    colorVar: "#fbbf24",
    bgVar: "rgba(251, 191, 36, 0.12)",
  },
  error: {
    icon: XCircle,
    colorVar: "#f87171",
    bgVar: "rgba(248, 113, 113, 0.12)",
  },
};

function statusToType(status?: string): Notification["type"] {
  if (!status) return "info";
  if (status.toLowerCase() === "success") return "success";
  if (status.toLowerCase() === "error") return "error";
  return "info";
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/activity");
      const data = await res.json();
      const items: Notification[] = (data || []).slice(0, 8).map((a: any) => ({
        id: String(a.id),
        timestamp: a.timestamp,
        title: a.type || "Activity",
        message: a.description || "",
        type: statusToType(a.status),
      }));
      setNotifications(items);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: isOpen ? "var(--surface-elevated)" : "transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = "var(--surface-hover, rgba(255,255,255,0.05))";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Bell size={18} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "420px",
            maxHeight: "600px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              backgroundColor: "var(--surface-elevated)",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "2px",
                }}
              >
                Recent Activity
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Last {notifications.length} events
              </p>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                <Bell size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                <p style={{ fontSize: "14px" }}>No activity yet</p>
              </div>
            )}

            {notifications.map((notification, index) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "16px 20px",
                    borderBottom: index < notifications.length - 1 ? "1px solid var(--border)" : "none",
                    backgroundColor: "transparent",
                  }}
                >
                  {/* Type Icon */}
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      backgroundColor: config.bgVar,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "fit-content",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} style={{ color: config.colorVar }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                      <h4
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: "2px",
                        }}
                      >
                        {notification.title}
                      </h4>
                    </div>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        marginBottom: "6px",
                      }}
                    >
                      {notification.message}
                    </p>

                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
