"use client";

import React from "react";

interface DevToolbarProps {
  onSimulate: (scenario: string) => Promise<void>;
  isSimulating: boolean;
}

const SCENARIOS = [
  { id: "nvda-beat", label: "+ NVDA 8-K", title: "Simulate SEC 8-K NVDA Earnings Beat" },
  { id: "reuters-syndicate", label: "+ Reuters", title: "Simulate Reuters breaking story" },
  { id: "apple-ai-partnership", label: "+ AAPL/GOOGL", title: "Simulate Apple / Google Gemini deal" },
  { id: "tesla-fcf", label: "+ TSLA 10-Q", title: "Simulate Tesla 10-Q filing" },
];

export function DevToolbar({ onSimulate, isSimulating }: DevToolbarProps) {
  return (
    <div className="dev-toolbar">
      <span className="dev-toolbar-label">▸ TEST INGESTION</span>
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          className="sim-btn"
          disabled={isSimulating}
          onClick={() => onSimulate(s.id)}
          title={s.title}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
