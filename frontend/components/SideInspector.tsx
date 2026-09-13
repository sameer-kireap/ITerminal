"use client";

import React from "react";
import Link from "next/link";
import { Article } from "../lib/types";

interface SideInspectorProps {
  article: Article | null;
  onClose: () => void;
}

export function SideInspector({ article, onClose }: SideInspectorProps) {
  if (!article) {
    return (
      <div className="side-panel">
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "2rem", textAlign: "center" }}>
          Select an event from the intelligence feed to view vector embeddings, entity graphs, and full source attribution.
        </div>
      </div>
    );
  }

  const primaryEntity = article.entities.find((e) => e.ticker) || article.entities[0];

  return (
    <div className="side-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--cyan)", fontWeight: 700 }}>
          INTELLIGENCE INSPECTOR
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          ✕
        </button>
      </div>

      <div>
        <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {article.title}
        </h4>
        {primaryEntity?.ticker && (
          <Link
            href={`/company/${primaryEntity.ticker}`}
            style={{
              display: "inline-block",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
              color: "var(--cyan)",
              marginBottom: "1rem",
            }}
          >
            VIEW FULL {primaryEntity.ticker} PROFILE &amp; TIMELINE &rarr;
          </Link>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
            MATERIALITY SCORE
          </div>
          <div style={{ fontSize: "1.2rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cyan)" }}>
            {article.importance_score?.toFixed(2) ?? "N/A"}
          </div>
        </div>

        <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
            RESOLVED ENTITIES ({article.entities.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {article.entities.map((e, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  background: "var(--bg-card)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border-bright)",
                }}
              >
                {e.name} {e.ticker ? `(${e.ticker})` : ""}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
            DETERMINISTIC SHA-256 HASH
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
            {article.content_hash}
          </div>
        </div>

        <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
            SOURCE CONTENT BODY
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5", maxHeight: "220px", overflowY: "auto" }}>
            {article.body}
          </div>
        </div>

        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--cyan)",
              textAlign: "center",
              padding: "0.5rem",
              background: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              borderRadius: "6px",
            }}
          >
            OPEN ORIGINAL DISCLOSURE ↗
          </a>
        )}
      </div>
    </div>
  );
}
