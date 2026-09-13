"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Article } from "../lib/types";

interface EventCardProps {
  article: Article;
  isSelected: boolean;
  onSelect: (article: Article) => void;
}

export function EventCard({ article, isSelected, onSelect }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const primaryEntity = article.entities.find((e) => e.ticker) || article.entities[0];
  const ticker = primaryEntity?.ticker || "MACRO";

  const score = article.importance_score ?? 0.5;
  const scoreClass = score >= 0.75 ? "high" : score >= 0.55 ? "med" : "low";

  const typeClass =
    article.event_type === "breaking" ? "breaking"
    : article.event_type === "earnings" || article.event_type === "guidance" ? "earnings"
    : article.event_type === "regulatory" || article.event_type === "litigation" ? "regulatory"
    : "general";

  const formattedTime = (article.published_at || article.ingested_at)
    ? new Date(article.published_at || article.ingested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const handleClick = () => {
    onSelect(article);
    setExpanded((prev) => (isSelected ? !prev : true));
  };

  return (
    <>
      <div
        className={`event-row ${isSelected ? "selected" : ""}`}
        onClick={handleClick}
      >
        <span className="row-time">{formattedTime}</span>
        {primaryEntity?.ticker ? (
          <Link
            href={`/company/${ticker}`}
            className="row-ticker"
            onClick={(e) => e.stopPropagation()}
          >
            {ticker}
          </Link>
        ) : (
          <span className="row-ticker" style={{ opacity: 0.5 }}>MACRO</span>
        )}
        <span className="row-headline">
          <span className={`row-type-dot ${typeClass}`} />
          {article.title}
        </span>
        <span className={`row-score ${scoreClass}`}>{score.toFixed(2)}</span>
        <span className="row-source">{article.source}</span>
      </div>

      {isSelected && expanded && (
        <div className="event-expanded">
          {article.summary && (
            <div className="expanded-summary">{article.summary}</div>
          )}
          {article.why_it_matters && (
            <div className="expanded-why">{article.why_it_matters}</div>
          )}
          {article.impact_tags && article.impact_tags.length > 0 && (
            <div className="expanded-tags">
              {article.impact_tags.map((tag, idx) => {
                const chipClass =
                  tag.sentiment === "positive" ? "impact-pos"
                  : tag.sentiment === "negative" ? "impact-neg"
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
            <span style={{ color: "var(--cyan)", cursor: "pointer" }}>INSPECT →</span>
          </div>
        </div>
      )}
    </>
  );
}
