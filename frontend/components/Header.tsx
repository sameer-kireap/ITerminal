"use client";

import React from "react";

type TabId = "feed" | "alerts" | "delta" | "watchlist" | "copilot" | "fundamentals" | "calendar";

interface HeaderProps {
  activeTab: TabId;
  isConnected: boolean;
  eventCount: number;
  showDevToolbar: boolean;
  onToggleDevToolbar: () => void;
}

const TAB_LABELS: Record<TabId, string> = {
  feed: "LIVE INTELLIGENCE FEED",
  copilot: "AI RESEARCH COPILOT",
  fundamentals: "FUNDAMENTALS & FILINGS",
  calendar: "CALENDAR & CATALYSTS",
  alerts: "MATERIALITY ALERTS",
  delta: "WHAT CHANGED (24H)",
  watchlist: "PERSONALIZED WATCHLIST",
};

export function Header({
  activeTab,
  isConnected,
  eventCount,
  showDevToolbar,
  onToggleDevToolbar,
}: HeaderProps) {
  return (
    <header className="term-header">
      <div className="header-left">
        <span className="header-tab-label">{TAB_LABELS[activeTab]}</span>
        <div className="header-separator" />
        <div className={`live-badge ${isConnected ? "" : "disconnected"}`}>
          <span className={`pulse-dot ${isConnected ? "" : "disconnected"}`} />
          <span>{isConnected ? "LIVE" : "OFFLINE"}</span>
          <span style={{ opacity: 0.5 }}>• {eventCount}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="header-search-trigger" title="Focus command bar (/)">
          <span>⌕ COMMAND</span>
          <kbd>/</kbd>
        </div>
        <button
          className="dev-toggle-btn"
          onClick={onToggleDevToolbar}
          title="Toggle dev toolbar (⌘⇧D)"
        >
          {showDevToolbar ? "▾ DEV" : "▸ DEV"}
        </button>
      </div>
    </header>
  );
}
