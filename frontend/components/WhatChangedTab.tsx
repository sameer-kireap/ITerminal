"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DeltaFeed } from "../lib/types";
import { fetchCompanyDelta } from "../lib/api";

const CORE_TICKERS = ["NVDA", "AAPL", "TSLA", "GOOGL", "MSFT"];

export function WhatChangedTab() {
  const [deltas, setDeltas] = useState<Record<string, DeltaFeed>>({});
  const [loading, setLoading] = useState(true);

  const loadDeltas = async () => {
    setLoading(true);
    const results: Record<string, DeltaFeed> = {};
    for (const ticker of CORE_TICKERS) {
      try {
        const delta = await fetchCompanyDelta(ticker, 24);
        results[ticker] = delta;
      } catch (e) {
        // Ticker might have no events yet
      }
    }
    setDeltas(results);
    setLoading(false);
  };

  useEffect(() => {
    loadDeltas();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        style={{
          background: "var(--bg-card)",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>
          MARKET DELTA (PAST 24 HOURS)
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Algorithmic delta detection highlighting shifts in corporate filings, earnings disclosures, and breaking developments relative to prior 24-hour baseline.
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2rem", textAlign: "center" }}>
          COMPUTING 24-HOUR DELTAS...
        </div>
      ) : Object.keys(deltas).length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2rem", textAlign: "center" }}>
          NO ACTIVE COMPANY ACTIVITY FOUND IN CURRENT WINDOW. RUN TEST INGESTIONS ABOVE TO SIMULATE.
        </div>
      ) : (
        CORE_TICKERS.filter((t) => deltas[t]).map((ticker) => {
          const delta = deltas[ticker];
          const isUp = delta.activity_delta_percent > 0;
          return (
            <div key={ticker} className="event-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <Link href={`/company/${ticker}`} className="ticker-pill">
                  <span style={{ fontSize: "0.9rem" }}>{ticker}</span>
                  <span>↗</span>
                </Link>

                <div
                  className="delta-stat-badge"
                  style={{
                    background: isUp ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.15)",
                    color: isUp ? "var(--bull)" : "var(--text-secondary)",
                    border: `1px solid ${isUp ? "rgba(16, 185, 129, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
                  }}
                >
                  <span>{delta.new_events_count} NEW DEVELOPMENTS</span>
                  <span>({delta.activity_delta_percent >= 0 ? "+" : ""}{delta.activity_delta_percent}%)</span>
                </div>
              </div>

              <div className="ai-block" style={{ marginBottom: "0.75rem" }}>
                <div className="ai-block-title">● 24H DELTA SYNTHESIS</div>
                <div>{delta.delta_summary}</div>
              </div>

              {delta.key_developments.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    TOP DRIVING EVENTS:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {delta.key_developments.map((dev) => (
                      <div
                        key={dev.id}
                        style={{
                          fontSize: "0.82rem",
                          background: "var(--bg-base)",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{dev.title}</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan)", fontSize: "0.75rem" }}>
                          {dev.importance_score?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
