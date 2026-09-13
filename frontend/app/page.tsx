"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertsTab } from "../components/AlertsTab";
import CalendarTab from "../components/CalendarTab";
import { CommandBar } from "../components/CommandBar";
import { CopilotTab } from "../components/CopilotTab";
import { EventCard } from "../components/EventCard";
import FundamentalsTab from "../components/FundamentalsTab";
import { Header } from "../components/Header";
import { SideInspector } from "../components/SideInspector";
import { WatchlistTab } from "../components/WatchlistTab";
import { WhatChangedTab } from "../components/WhatChangedTab";
import { fetchArticles, simulateScenario } from "../lib/api";
import { Article } from "../lib/types";

export default function TerminalDashboard() {
  const [activeTab, setActiveTab] = useState<
    "feed" | "alerts" | "delta" | "watchlist" | "copilot" | "fundamentals" | "calendar"
  >("feed");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Filters
  const [tickerFilter, setTickerFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minImportance, setMinImportance] = useState<number>(0.0);

  const loadInitialArticles = useCallback(async () => {
    try {
      const data = await fetchArticles({ limit: 100 });
      setArticles(data);
      if (data.length > 0 && !selectedArticle) {
        setSelectedArticle(data[0]);
      }
    } catch (err) {
      console.error("Failed to load articles:", err);
    }
  }, [selectedArticle]);

  useEffect(() => {
    loadInitialArticles();
  }, [loadInitialArticles]);

  // Real-time WebSocket connection to FastAPI live feed
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/live-feed";
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (evt) => {
          try {
            const rawData = JSON.parse(evt.data);
            const incoming: Article = {
              id: rawData.id,
              source: rawData.source,
              url: rawData.url,
              content_hash: rawData.content_hash,
              title: rawData.title,
              body: rawData.body,
              summary: rawData.summary,
              why_it_matters: rawData.why_it_matters,
              impact_tags: rawData.impact_tags || [],
              event_type: rawData.event_type,
              importance_score: rawData.importance_score,
              source_reliability: rawData.reliability || "medium",
              published_at: rawData.published_at,
              ingested_at: rawData.ingested_at,
              entities: rawData.entities || [],
            };

            setArticles((prev) => {
              const exists = prev.some((a) => a.id === incoming.id || a.content_hash === incoming.content_hash);
              if (exists) return prev;
              return [incoming, ...prev];
            });
          } catch (e) {
            console.error("Failed to parse live event:", e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 2500);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws?.close();
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWS, 2500);
      }
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const handleSimulate = async (scenario: string) => {
    await simulateScenario(scenario);
    // Give pipeline 300ms to persist then refresh feed
    setTimeout(loadInitialArticles, 300);
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (tickerFilter) {
        const matchesTicker = art.entities.some(
          (e) => e.ticker?.toUpperCase() === tickerFilter.toUpperCase()
        );
        if (!matchesTicker && !art.title.toUpperCase().includes(tickerFilter.toUpperCase())) {
          return false;
        }
      }

      if (minImportance > 0 && (art.importance_score ?? 0) < minImportance) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          art.title.toLowerCase().includes(q) ||
          art.body.toLowerCase().includes(q) ||
          (art.summary && art.summary.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      return true;
    });
  }, [articles, tickerFilter, minImportance, searchQuery]);

  return (
    <div>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        eventCount={articles.length}
        onSimulate={handleSimulate}
      />

      <div className="terminal-container">
        <main className="main-stream">
          <CommandBar
            onSearch={(q) => setSearchQuery(q)}
            onFilterTicker={(t) => setTickerFilter(t)}
            currentTicker={tickerFilter}
            onSetMinImportance={(v) => setMinImportance(v)}
          />

          {activeTab === "feed" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredArticles.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "3rem", textAlign: "center" }}>
                  NO INTELLIGENCE EVENTS MATCH THE CURRENT FILTER. USE TEST INGESTION BUTTONS ABOVE TO DISPATCH EVENTS.
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <EventCard
                    key={article.id}
                    article={article}
                    isSelected={selectedArticle?.id === article.id}
                    onSelect={(a) => setSelectedArticle(a)}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "copilot" && <CopilotTab />}
          {activeTab === "fundamentals" && (
            <FundamentalsTab ticker={tickerFilter || "NVDA"} />
          )}
          {activeTab === "calendar" && (
            <CalendarTab ticker={tickerFilter || "NVDA"} />
          )}
          {activeTab === "alerts" && <AlertsTab />}
          {activeTab === "delta" && <WhatChangedTab />}
          {activeTab === "watchlist" && <WatchlistTab />}
        </main>

        {activeTab === "feed" && (
          <SideInspector
            article={selectedArticle}
            onClose={() => setSelectedArticle(null)}
          />
        )}
      </div>
    </div>
  );
}
