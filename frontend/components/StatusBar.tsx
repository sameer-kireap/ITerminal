"use client";

import React, { useEffect, useState } from "react";

interface StatusBarProps {
  isConnected: boolean;
  eventCount: number;
  activeFilter: string | null;
  activeTab: string;
}

export function StatusBar({ isConnected, eventCount, activeFilter, activeTab }: StatusBarProps) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " UTC" + (now.getTimezoneOffset() > 0 ? "-" : "+") +
        String(Math.abs(Math.floor(now.getTimezoneOffset() / 60))).padStart(2, "0")
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const TAB_LABELS: Record<string, string> = {
    feed: "LIVE FEED",
    copilot: "AI RESEARCH COPILOT",
    fundamentals: "FUNDAMENTALS & FILINGS",
    calendar: "CALENDAR & CATALYSTS",
    alerts: "MATERIALITY ALERTS",
    delta: "WHAT CHANGED (24H)",
    watchlist: "WATCHLIST",
  };

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className="status-segment">
          <span className="label">STATUS:</span>
          <span className={`value ${isConnected ? "ok" : "err"}`}>
            {isConnected ? "WS CONNECTED" : "DISCONNECTED"}
          </span>
        </div>

        <div className="status-segment">
          <span className="label">EVENTS:</span>
          <span className="value">{eventCount}</span>
        </div>

        <div className="status-segment">
          <span className="label">PIPELINE:</span>
          <span className="value ok">HEALTHY</span>
        </div>

        {activeFilter && (
          <div className="status-segment">
            <span className="label">FILTER:</span>
            <span className="value" style={{ color: "var(--cyan)" }}>{activeFilter}</span>
          </div>
        )}
      </div>

      <div className="status-bar-right">
        <div className="status-segment">
          <span className="label">VIEW:</span>
          <span className="value">{TAB_LABELS[activeTab] || activeTab.toUpperCase()}</span>
        </div>

        <div className="status-segment">
          <span className="value">{clock}</span>
        </div>
      </div>
    </div>
  );
}
