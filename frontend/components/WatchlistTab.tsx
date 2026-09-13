"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WatchlistItem } from "../lib/types";
import { addToWatchlist, fetchWatchlist, removeFromWatchlist } from "../lib/api";

export function WatchlistTab() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [tickerInput, setTickerInput] = useState("");
  const [loading, setLoading] = useState(true);

  const loadList = async () => {
    try {
      const data = await fetchWatchlist();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tickerInput.trim().toUpperCase();
    if (!clean) return;
    try {
      await addToWatchlist(clean);
      setTickerInput("");
      await loadList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (ticker: string) => {
    try {
      await removeFromWatchlist(ticker);
      await loadList();
    } catch (err) {
      console.error(err);
    }
  };

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
          PERSONALIZED WATCHLIST &amp; INTELLIGENCE
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
          Pin tickers to receive priority alerts, real-time audio/visual notifications, and custom delta reports.
        </p>

        <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            className="cmd-input"
            style={{ width: "240px", padding: "0.5rem 0.75rem" }}
            placeholder="Add ticker (e.g. MSFT)..."
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
          />
          <button type="submit" className="sim-btn" style={{ padding: "0.5rem 1rem", color: "var(--cyan)" }}>
            + ADD TICKER
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2rem", textAlign: "center" }}>
          LOADING WATCHLIST...
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2rem", textAlign: "center" }}>
          YOUR WATCHLIST IS CURRENTLY EMPTY. ADD A TICKER ABOVE OR CLICK ANY TICKER PILL TO MONITOR.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="event-card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <Link href={`/company/${item.ticker}`} className="ticker-pill">
                  <span style={{ fontSize: "1rem" }}>{item.ticker}</span>
                  <span>↗</span>
                </Link>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.4rem", fontFamily: "var(--font-mono)" }}>
                  TRACKED SINCE: {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link
                  href={`/company/${item.ticker}`}
                  className="sim-btn"
                  style={{ fontSize: "0.72rem", color: "var(--cyan)" }}
                >
                  PROFILE
                </Link>
                <button
                  className="sim-btn"
                  style={{ fontSize: "0.72rem", color: "var(--bear)" }}
                  onClick={() => handleRemove(item.ticker)}
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
