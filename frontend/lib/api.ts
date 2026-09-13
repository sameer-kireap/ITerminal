import {
  AlertItem,
  Article,
  CompanyProfile,
  DeltaFeed,
  TimelineItem,
  WatchlistItem,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/v1";

export async function fetchArticles(params?: {
  limit?: number;
  ticker?: string;
  eventType?: string;
}): Promise<Article[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.ticker) query.set("ticker", params.ticker);
  if (params?.eventType) query.set("event_type", params.eventType);

  const res = await fetch(`${API_BASE}/articles?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch articles: ${res.statusText}`);
  return res.json();
}

export async function fetchCompanyProfile(ticker: string): Promise<CompanyProfile> {
  const res = await fetch(`${API_BASE}/companies/${encodeURIComponent(ticker)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Company ${ticker} not found`);
  return res.json();
}

export async function fetchCompanyTimeline(
  ticker: string,
  limit: number = 50
): Promise<TimelineItem[]> {
  const res = await fetch(
    `${API_BASE}/companies/${encodeURIComponent(ticker)}/timeline?limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Timeline for ${ticker} failed`);
  return res.json();
}

export async function fetchCompanyDelta(ticker: string, hours: number = 24): Promise<DeltaFeed> {
  const res = await fetch(
    `${API_BASE}/companies/${encodeURIComponent(ticker)}/delta?hours=${hours}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Delta feed for ${ticker} failed`);
  return res.json();
}

export async function fetchAlerts(params?: {
  minImportance?: number;
  watchlistOnly?: boolean;
}): Promise<AlertItem[]> {
  const query = new URLSearchParams();
  if (params?.minImportance !== undefined)
    query.set("min_importance", params.minImportance.toString());
  if (params?.watchlistOnly) query.set("watchlist_only", "true");

  const res = await fetch(`${API_BASE}/alerts?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch alerts`);
  return res.json();
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const res = await fetch(`${API_BASE}/alerts/watchlist`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch watchlist`);
  return res.json();
}

export async function addToWatchlist(ticker: string): Promise<WatchlistItem> {
  const res = await fetch(`${API_BASE}/alerts/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  });
  if (!res.ok) throw new Error(`Failed to add ${ticker} to watchlist`);
  return res.json();
}

export async function removeFromWatchlist(ticker: string): Promise<void> {
  const res = await fetch(`${API_BASE}/alerts/watchlist/${encodeURIComponent(ticker)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete ${ticker} from watchlist`);
}

export async function simulateScenario(scenario: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ingestion/simulate/${encodeURIComponent(scenario)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Simulation ${scenario} failed`);
  return res.json();
}
