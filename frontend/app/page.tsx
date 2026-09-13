"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertsTab } from "../components/AlertsTab";
import CalendarTab from "../components/CalendarTab";
import { CommandBar } from "../components/CommandBar";
import { CopilotTab } from "../components/CopilotTab";
import { DevToolbar } from "../components/DevToolbar";
import { EventCard } from "../components/EventCard";
import FundamentalsTab from "../components/FundamentalsTab";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SideInspector } from "../components/SideInspector";
import { StatusBar } from "../components/StatusBar";
import { TickerStrip } from "../components/TickerStrip";
import { WatchlistTab } from "../components/WatchlistTab";
import { WhatChangedTab } from "../components/WhatChangedTab";
import { fetchArticles, simulateScenario } from "../lib/api";
import { useKeyboardNav } from "../lib/useKeyboardNav";
import { Article } from "../lib/types";

type TabId = "feed" | "alerts" | "delta" | "watchlist" | "copilot" | "fundamentals" | "calendar";

export default function TerminalDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showDevToolbar, setShowDevToolbar] = useState<boolean>(true);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [tickerFilter, setTickerFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minImportance, setMinImportance] = useState<number>(0.0);

  const loadInitialArticles = useCallback(async () => {
    try {
      const data = await fetchArticles({ limit: 100 });
      setArticles(data);
      if (data.length > 0 && !selectedArticle) {
        setSelectedArticle(data[0]);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error("Failed to load articles:", err);
    }
  }, [selectedArticle]);

  useEffect(() => {
    loadInitialArticles();
  }, [loadInitialArticles]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/live-feed";
        ws = new WebSocket(wsUrl);

        ws.onopen = () => setIsConnected(true);

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
      } catch {
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
    setIsSimulating(true);
    try {
      await simulateScenario(scenario);
      setTimeout(loadInitialArticles, 300);
    } finally {
      setIsSimulating(false);
    }
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
      if (minImportance > 0 && (art.importance_score ?? 0) < minImportance) return false;
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

  const navigateDown = useCallback(() => {
    if (filteredArticles.length === 0) return;
    const nextIdx = Math.min(selectedIndex + 1, filteredArticles.length - 1);
    setSelectedIndex(nextIdx);
    setSelectedArticle(filteredArticles[nextIdx]);
  }, [filteredArticles, selectedIndex]);

  const navigateUp = useCallback(() => {
    if (filteredArticles.length === 0) return;
    const prevIdx = Math.max(selectedIndex - 1, 0);
    setSelectedIndex(prevIdx);
    setSelectedArticle(filteredArticles[prevIdx]);
  }, [filteredArticles, selectedIndex]);

  const handleEscape = useCallback(() => {
    if (tickerFilter) {
      setTickerFilter(null);
    } else if (searchQuery) {
      setSearchQuery("");
    } else {
      setSelectedArticle(null);
    }
  }, [tickerFilter, searchQuery]);

  useKeyboardNav({
    setActiveTab,
    onNavigateUp: navigateUp,
    onNavigateDown: navigateDown,
    onEscape: handleEscape,
    onToggleDevToolbar: () => setShowDevToolbar((v) => !v),
    showShortcuts,
    setShowShortcuts,
  });

  const handleTickerClick = (symbol: string) => {
    setTickerFilter(symbol);
    setActiveTab("feed");
  };

  return (
    <div className="terminal-shell">
      <TickerStrip onTickerClick={handleTickerClick} />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <Header
        activeTab={activeTab}
        isConnected={isConnected}
        eventCount={articles.length}
        showDevToolbar={showDevToolbar}
        onToggleDevToolbar={() => setShowDevToolbar((v) => !v)}
      />

      <main className="main-content">
        {showDevToolbar && (
          <DevToolbar onSimulate={handleSimulate} isSimulating={isSimulating} />
        )}

        {(activeTab === "feed" || activeTab === "alerts") && (
          <CommandBar
            onSearch={(q) => setSearchQuery(q)}
            onFilterTicker={(t) => setTickerFilter(t)}
            currentTicker={tickerFilter}
            onSetMinImportance={(v) => setMinImportance(v)}
          />
        )}

        <div className="content-scroll">
          {activeTab === "feed" && (
            <>
              <div className="feed-column-header">
                <span>TIME</span>
                <span>TICKER</span>
                <span>EVENT</span>
                <span>MAT</span>
                <span style={{ textAlign: "right" }}>SOURCE</span>
              </div>
              {filteredArticles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">◇</div>
                  NO INTELLIGENCE EVENTS MATCH FILTER.
                  <br />
                  USE ▸ DEV TOOLBAR TO DISPATCH TEST EVENTS.
                </div>
              ) : (
                filteredArticles.map((article, idx) => (
                  <EventCard
                    key={article.id}
                    article={article}
                    isSelected={selectedArticle?.id === article.id}
                    onSelect={(a) => {
                      setSelectedArticle(a);
                      setSelectedIndex(idx);
                    }}
                  />
                ))
              )}
            </>
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
        </div>
      </main>

      <SideInspector
        article={selectedArticle}
        activeTab={activeTab}
        onClose={() => setSelectedArticle(null)}
      />

      <StatusBar
        isConnected={isConnected}
        eventCount={articles.length}
        activeFilter={tickerFilter}
        activeTab={activeTab}
      />

      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⌨ KEYBOARD SHORTCUTS</h3>
            {[
              ["/", "Focus command bar"],
              ["1-7", "Switch tabs (Feed, Research, Fundamentals, Calendar, Alerts, Delta, Watchlist)"],
              ["j / ↓", "Navigate to next event"],
              ["k / ↑", "Navigate to previous event"],
              ["Esc", "Clear filter / Close inspector"],
              ["?", "Toggle this shortcuts panel"],
              ["⌘⇧D", "Toggle dev toolbar"],
            ].map(([key, desc]) => (
              <div key={key} className="shortcut-row">
                <span className="shortcut-desc">{desc}</span>
                <span className="shortcut-key">{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
