"use client";

import React from "react";
import Link from "next/link";
import { Article } from "../lib/types";

interface EventCardProps {
  article: Article;
  isSelected: boolean;
  onSelect: (article: Article) => void;
}

export function EventCard({ article, isSelected, onSelect }: EventCardProps) {
  const primaryEntity = article.entities.find((e) => e.ticker) || article.entities[0];
  const ticker = primaryEntity?.ticker;

  const score = article.importance_score ?? 0.5;
  const scoreClass = score >= 0.75 ? "meter-high" : score >= 0.55 ? "meter-med" : "meter-low";

  const typeClass =
    article.event_type === "breaking"
      ? "type-breaking"
      : article.event_type === "earnings" || article.event_type === "guidance"
      ? "type-earnings"
      : article.event_type === "regulatory" || article.event_type === "litigation"
      ? "type-regulatory"
      : "type-general";

  const formattedTime = article.published_at
    ? new Date(article.published_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : new Date(article.ingested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`event-card ${isSelected ? "highlight" : ""}`}
      onClick={() => onSelect(article)}
    >
      <div className="card-top">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {ticker ? (
            <Link
              href={`/company/${ticker}`}
              className="ticker-pill"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{ticker}</span>
              <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>↗</span>
            </Link>
          ) : (
            <span className="ticker-pill" style={{ opacity: 0.6 }}>
              MACRO
            </span>
          )}
          <span className={`type-pill ${typeClass}`}>{article.event_type}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {article.source.toUpperCase()}
          </span>
        </div>

        <div className="importance-meter">
          <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>IMPORTANCE</span>
          <span className={`meter-val ${scoreClass}`}>{score.toFixed(2)}</span>
        </div>
      </div>

      <h3 className="card-title">{article.title}</h3>

      {article.summary && (
        <div className="ai-block">
          <div className="ai-block-title">
            <span>● WHAT HAPPENED</span>
          </div>
          <div>{article.summary}</div>
        </div>
      )}

      {article.why_it_matters && (
        <div className="ai-block ai-why-block">
          <div className="ai-block-title">
            <span>⚡ WHY IT MATTERS</span>
          </div>
          <div>{article.why_it_matters}</div>
        </div>
      )}

      {article.impact_tags && article.impact_tags.length > 0 && (
        <div className="impact-tags-row">
          {article.impact_tags.map((tag, idx) => {
            const chipClass =
              tag.sentiment === "positive"
                ? "impact-pos"
                : tag.sentiment === "negative"
                ? "impact-neg"
                : "impact-neu";
            return (
              <span key={idx} className={`impact-chip ${chipClass}`}>
                {tag.category}: {tag.sentiment.toUpperCase()}
                {tag.note ? ` (${tag.note})` : ""}
              </span>
            );
          })}
        </div>
      )}

      <div className="card-footer">
        <span>DETECTED: {formattedTime}</span>
        <span>RELIABILITY: {article.source_reliability?.toUpperCase()}</span>
        <span style={{ color: "var(--cyan)", cursor: "pointer" }}>INSPECT DETAILS &gt;</span>
      </div>
    </div>
  );
}
