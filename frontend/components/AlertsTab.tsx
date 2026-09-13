"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertItem } from "../lib/types";
import { fetchAlerts } from "../lib/api";

export function AlertsTab() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [minImportance, setMinImportance] = useState<number>(0.70);
  const [watchlistOnly, setWatchlistOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts({ minImportance, watchlistOnly });
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [minImportance, watchlistOnly]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-card)",
          padding: "0.85rem 1.25rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700 }}>
            MATERIALITY THRESHOLD:
          </span>
          {[0.60, 0.70, 0.80, 0.90].map((val) => (
            <button
              key={val}
              className={`cmd-chip ${minImportance === val ? "active" : ""}`}
              style={{
                background: minImportance === val ? "var(--cyan)" : undefined,
                color: minImportance === val ? "#030712" : undefined,
                fontWeight: 700,
              }}
              onClick={() => setMinImportance(val)}
            >
              &ge; {val.toFixed(2)}
            </button>
          ))}
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={watchlistOnly}
            onChange={(e) => setWatchlistOnly(e.target.checked)}
          />
          <span>WATCHLIST ONLY</span>
        </label>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2rem", textAlign: "center" }}>
          SCANNING MATERIAL EVENTS...
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "3rem", textAlign: "center" }}>
          NO MATERIAL EVENTS DETECTED ABOVE THRESHOLD {minImportance.toFixed(2)}.
        </div>
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} className="event-card highlight">
            <div className="card-top">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {alert.ticker && (
                  <Link href={`/company/${alert.ticker}`} className="ticker-pill">
                    <span>{alert.ticker}</span>
                    <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>↗</span>
                  </Link>
                )}
                <span className="type-pill type-breaking">{alert.event_type}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {alert.source.toUpperCase()}
                </span>
              </div>
              <div className="importance-meter">
                <span style={{ color: "var(--bear)", fontSize: "0.7rem", fontWeight: 700 }}>MATERIAL ALERT</span>
                <span className="meter-val meter-high">{alert.importance_score.toFixed(2)}</span>
              </div>
            </div>

            <h3 className="card-title">{alert.title}</h3>

            {alert.summary && (
              <div className="ai-block">
                <div className="ai-block-title">● WHAT HAPPENED</div>
                <div>{alert.summary}</div>
              </div>
            )}

            {alert.why_it_matters && (
              <div className="ai-block ai-why-block">
                <div className="ai-block-title">⚡ WHY IT MATTERS</div>
                <div>{alert.why_it_matters}</div>
              </div>
            )}

            {alert.impact_tags && alert.impact_tags.length > 0 && (
              <div className="impact-tags-row">
                {alert.impact_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`impact-chip ${
                      tag.sentiment === "positive"
                        ? "impact-pos"
                        : tag.sentiment === "negative"
                        ? "impact-neg"
                        : "impact-neu"
                    }`}
                  >
                    {tag.category}: {tag.sentiment.toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            <div className="card-footer">
              <span>DETECTED: {new Date(alert.detected_at).toLocaleString()}</span>
              <span>RELIABILITY: {alert.source_reliability.toUpperCase()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
