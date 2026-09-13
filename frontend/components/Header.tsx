"use client";

import React from "react";
import Link from "next/link";
import { simulateScenario } from "../lib/api";

interface HeaderProps {
  activeTab: "feed" | "alerts" | "delta" | "watchlist" | "copilot" | "fundamentals" | "calendar";
  setActiveTab: (tab: "feed" | "alerts" | "delta" | "watchlist" | "copilot" | "fundamentals" | "calendar") => void;
  isConnected: boolean;
  eventCount: number;
  onSimulate: (scenario: string) => Promise<void>;
}

export function Header({
  activeTab,
  setActiveTab,
  isConnected,
  eventCount,
  onSimulate,
}: HeaderProps) {
  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleSim = async (scenario: string) => {
    setIsSimulating(true);
    try {
      await onSimulate(scenario);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <header className="term-header">
      <div className="brand-section">
        <Link href="/" className="brand-logo">
          <span>i<span className="accent">Terminal</span></span>
        </Link>
        <div className="live-badge">
          <span className={`pulse-dot ${isConnected ? "" : "disconnected"}`} />
          <span>{isConnected ? "WS LIVE" : "POLLING"}</span>
          <span style={{ opacity: 0.6 }}>• {eventCount} EVTS</span>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          id="nav-btn-feed"
          className={`tab-btn ${activeTab === "feed" ? "active" : ""}`}
          onClick={() => setActiveTab("feed")}
        >
          LIVE FEED
        </button>
        <button
          id="nav-btn-copilot"
          className={`tab-btn ${activeTab === "copilot" ? "active" : ""}`}
          onClick={() => setActiveTab("copilot")}
        >
          AI RESEARCH COPILOT
        </button>
        <button
          id="nav-btn-fundamentals"
          className={`tab-btn ${activeTab === "fundamentals" ? "active" : ""}`}
          onClick={() => setActiveTab("fundamentals")}
        >
          FUNDAMENTALS & FILINGS
        </button>
        <button
          id="nav-btn-calendar"
          className={`tab-btn ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          CALENDAR & CATALYSTS
        </button>
        <button
          id="nav-btn-alerts"
          className={`tab-btn ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          MATERIALITY ALERTS
        </button>
        <button
          id="nav-btn-delta"
          className={`tab-btn ${activeTab === "delta" ? "active" : ""}`}
          onClick={() => setActiveTab("delta")}
        >
          WHAT CHANGED (24H)
        </button>
        <button
          id="nav-btn-watchlist"
          className={`tab-btn ${activeTab === "watchlist" ? "active" : ""}`}
          onClick={() => setActiveTab("watchlist")}
        >
          WATCHLIST
        </button>
      </nav>

      <div className="sim-controls">
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          TEST INGESTION:
        </span>
        <button
          className="sim-btn"
          disabled={isSimulating}
          onClick={() => handleSim("nvda-beat")}
          title="Simulate SEC 8-K NVDA Earnings Beat"
        >
          + NVDA 8-K
        </button>
        <button
          className="sim-btn"
          disabled={isSimulating}
          onClick={() => handleSim("reuters-syndicate")}
          title="Simulate Reuters breaking story"
        >
          + Reuters News
        </button>
        <button
          className="sim-btn"
          disabled={isSimulating}
          onClick={() => handleSim("apple-ai-partnership")}
          title="Simulate Apple / Google Gemini deal"
        >
          + AAPL/GOOGL
        </button>
        <button
          className="sim-btn"
          disabled={isSimulating}
          onClick={() => handleSim("tesla-fcf")}
          title="Simulate Tesla 10-Q filing"
        >
          + TSLA 10-Q
        </button>
      </div>
    </header>
  );
}
