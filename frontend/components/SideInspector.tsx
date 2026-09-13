"use client";

import React from "react";
import Link from "next/link";
import { Article } from "../lib/types";

interface SideInspectorProps {
  article: Article | null;
  activeTab: string;
  onClose: () => void;
}

export function SideInspector({ article, activeTab, onClose }: SideInspectorProps) {
  if (!article) {
    return (
      <div className="inspector-panel">
        <div className="inspector-header">
          <span className="inspector-title">INTELLIGENCE INSPECTOR</span>
          <span />
        </div>
        <div className="inspector-empty">
          <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem", opacity: 0.3 }}>⬡</div>
          SELECT ANY EVENT FROM THE<br />
          INTELLIGENCE FEED TO INSPECT<br />
          SOURCE PROVENANCE, ENTITY<br />
          RESOLUTION, AND VECTOR<br />
          EMBEDDING METADATA.
          <div style={{ marginTop: "1rem", fontSize: "0.58rem", color: "var(--border-bright)" }}>
            KEYBOARD: j/k TO NAVIGATE • ENTER TO EXPAND
          </div>
        </div>
      </div>
    );
  }

  const primaryEntity = article.entities.find((e) => e.ticker) || article.entities[0];

  return (
    <div className="inspector-panel">
      <div className="inspector-header">
        <span className="inspector-title">INTELLIGENCE INSPECTOR</span>
        <button className="inspector-close" onClick={onClose} title="Close (Esc)">✕</button>
      </div>

      <div className="inspector-body">
        <div style={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.35 }}>
          {article.title}
        </div>

        {primaryEntity?.ticker && (
          <Link
            href={`/company/${primaryEntity.ticker}`}
            className="inspector-link"
            style={{ textAlign: "left", fontSize: "0.6rem" }}
          >
            VIEW {primaryEntity.ticker} PROFILE & TIMELINE →
          </Link>
        )}

        <div className="inspector-section">
          <div className="inspector-section-label">MATERIALITY SCORE</div>
          <div className="inspector-section-value">
            {article.importance_score?.toFixed(2) ?? "N/A"}
          </div>
        </div>

        <div className="inspector-section">
          <div className="inspector-section-label">RESOLVED ENTITIES ({article.entities.length})</div>
          <div style={{ marginTop: "0.2rem" }}>
            {article.entities.map((e, idx) => (
              <span key={idx} className="inspector-entity-chip">
                {e.name} {e.ticker ? `(${e.ticker})` : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="inspector-section">
          <div className="inspector-section-label">EVENT CLASSIFICATION</div>
          <div className="inspector-section-body">
            <span style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "0.65rem" }}>
              {article.event_type}
            </span>
            <span style={{ margin: "0 0.3rem", opacity: 0.3 }}>•</span>
            <span style={{ fontSize: "0.65rem" }}>{article.source.toUpperCase()}</span>
          </div>
        </div>

        <div className="inspector-section">
          <div className="inspector-section-label">DETERMINISTIC SHA-256 HASH</div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.55rem",
            color: "var(--text-muted)",
            wordBreak: "break-all",
            lineHeight: 1.4,
          }}>
            {article.content_hash}
          </div>
        </div>

        <div className="inspector-section">
          <div className="inspector-section-label">SOURCE CONTENT BODY</div>
          <div style={{
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            maxHeight: "180px",
            overflowY: "auto",
            marginTop: "0.2rem",
          }}>
            {article.body}
          </div>
        </div>

        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inspector-link"
          >
            OPEN ORIGINAL DISCLOSURE ↗
          </a>
        )}
      </div>
    </div>
  );
}
