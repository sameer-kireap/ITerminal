"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CompanyProfile, DeltaFeed, TimelineItem } from "../../../lib/types";
import {
  addToWatchlist,
  fetchCompanyDelta,
  fetchCompanyProfile,
  fetchCompanyTimeline,
  fetchWatchlist,
  removeFromWatchlist,
} from "../../../lib/api";

export default function CompanyDetailPage() {
  const params = useParams();
  const ticker = typeof params?.ticker === "string" ? params.ticker.toUpperCase() : "";

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [delta, setDelta] = useState<DeltaFeed | null>(null);
  const [isWatched, setIsWatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profData, tlData, deltaData, wlData] = await Promise.allSettled([
          fetchCompanyProfile(ticker),
          fetchCompanyTimeline(ticker),
          fetchCompanyDelta(ticker, 24),
          fetchWatchlist(),
        ]);

        if (profData.status === "fulfilled") {
          setProfile(profData.value);
        } else {
          setError(`Company profile for ${ticker} not found.`);
        }

        if (tlData.status === "fulfilled") {
          setTimeline(tlData.value);
        }

        if (deltaData.status === "fulfilled") {
          setDelta(deltaData.value);
        }

        if (wlData.status === "fulfilled") {
          const watched = wlData.value.some((item) => item.ticker.toUpperCase() === ticker);
          setIsWatched(watched);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ticker]);

  const toggleWatchlist = async () => {
    if (!ticker) return;
    try {
      if (isWatched) {
        await removeFromWatchlist(ticker);
        setIsWatched(false);
      } else {
        await addToWatchlist(ticker);
        setIsWatched(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
        INITIALIZING {ticker} INTELLIGENCE DOSSIER...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2 style={{ marginBottom: "1rem" }}>{error || "Company not found"}</h2>
        <Link href="/" className="sim-btn" style={{ color: "var(--cyan)" }}>
          &larr; RETURN TO TERMINAL
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Link href="/" className="sim-btn" style={{ color: "var(--text-secondary)" }}>
          &larr; TERMINAL HOME
        </Link>
        <button
          onClick={toggleWatchlist}
          className="sim-btn"
          style={{
            background: isWatched ? "rgba(16, 185, 129, 0.15)" : "var(--bg-card)",
            color: isWatched ? "var(--bull)" : "var(--cyan)",
            borderColor: isWatched ? "var(--bull)" : "var(--border-bright)",
          }}
        >
          {isWatched ? "★ WATCHING" : "+ ADD TO WATCHLIST"}
        </button>
      </div>

      {/* Company Profile Hero */}
      <div className="company-hero">
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <h1 className="company-title">{profile.name}</h1>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--cyan)",
              }}
            >
              [{profile.ticker}]
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", gap: "1rem" }}>
            <span>CIK: {profile.cik || "N/A"}</span>
            <span>SECTOR: {profile.sector || "TECHNOLOGY"}</span>
            <span>TOTAL INTELLIGENCE EVENTS: {profile.total_events}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ background: "var(--bg-base)", padding: "0.5rem 0.85rem", borderRadius: "6px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--bull)" }}>POSITIVE</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{profile.sentiment_distribution["positive"] || 0}</div>
          </div>
          <div style={{ background: "var(--bg-base)", padding: "0.5rem 0.85rem", borderRadius: "6px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--bear)" }}>NEGATIVE</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{profile.sentiment_distribution["negative"] || 0}</div>
          </div>
          <div style={{ background: "var(--bg-base)", padding: "0.5rem 0.85rem", borderRadius: "6px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>NEUTRAL</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{profile.sentiment_distribution["neutral"] || 0}</div>
          </div>
        </div>
      </div>

      {/* 24H Delta Section */}
      {delta && (
        <div className="event-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "var(--amber)" }}>
              ⚡ 24-HOUR DELTA INTELLIGENCE
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              ACTIVITY SHIFT: {delta.activity_delta_percent >= 0 ? "+" : ""}{delta.activity_delta_percent}%
            </span>
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
            {delta.delta_summary}
          </p>
        </div>
      )}

      {/* Chronological Event Timeline */}
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          CHRONOLOGICAL EVENT TIMELINE ({timeline.length})
        </h2>
        <div className="timeline-list">
          {timeline.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "1.5rem" }}>
              NO TIMELINE EVENTS RECORDED FOR {ticker}.
            </div>
          ) : (
            timeline.map((item) => (
              <div key={item.id} className="timeline-node">
                <div className="event-card">
                  <div className="card-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="type-pill type-breaking">{item.event_type}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {item.source.toUpperCase()}
                      </span>
                    </div>
                    <div className="importance-meter">
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>MATERIALITY</span>
                      <span className="meter-val meter-high">
                        {item.importance_score?.toFixed(2) ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <h3 className="card-title" style={{ fontSize: "0.95rem" }}>
                    {item.title}
                  </h3>

                  {item.summary && (
                    <div className="ai-block">
                      <div className="ai-block-title">● WHAT HAPPENED</div>
                      <div>{item.summary}</div>
                    </div>
                  )}

                  {item.why_it_matters && (
                    <div className="ai-block ai-why-block">
                      <div className="ai-block-title">⚡ WHY IT MATTERS</div>
                      <div>{item.why_it_matters}</div>
                    </div>
                  )}

                  {item.impact_tags && item.impact_tags.length > 0 && (
                    <div className="impact-tags-row">
                      {item.impact_tags.map((tag, idx) => (
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
                    <span>RECORDED: {new Date(item.timestamp).toLocaleString()}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--cyan)" }}
                      >
                        VIEW SOURCE ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
