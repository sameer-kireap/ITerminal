"use client";

import React from "react";

type TabId = "feed" | "alerts" | "delta" | "watchlist" | "copilot" | "fundamentals" | "calendar";

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const NAV_ITEMS: { id: TabId; icon: string; label: string; shortcut: string }[] = [
  { id: "feed", icon: "◉", label: "LIVE FEED", shortcut: "1" },
  { id: "copilot", icon: "⌘", label: "AI RESEARCH", shortcut: "2" },
  { id: "fundamentals", icon: "▤", label: "FUNDAMENTALS", shortcut: "3" },
  { id: "calendar", icon: "▦", label: "CALENDAR", shortcut: "4" },
  { id: "alerts", icon: "△", label: "ALERTS", shortcut: "5" },
  { id: "delta", icon: "Δ", label: "WHAT CHANGED", shortcut: "6" },
  { id: "watchlist", icon: "☆", label: "WATCHLIST", shortcut: "7" },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">iT</div>

      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`sidebar-nav-btn ${activeTab === item.id ? "active" : ""}`}
          onClick={() => setActiveTab(item.id)}
          title={item.label}
        >
          <span>{item.icon}</span>
          <span className="btn-tooltip">
            {item.label} <kbd style={{ marginLeft: "0.3rem", opacity: 0.5 }}>{item.shortcut}</kbd>
          </span>
        </button>
      ))}

      <div className="sidebar-spacer" />

      <div className="sidebar-shortcut-hint" title="Press ? for keyboard shortcuts">
        ?
      </div>
    </nav>
  );
}
