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

export async function queryCopilot(query: string, ticker?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/research/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, ticker: ticker || undefined }),
  });
  if (!res.ok) throw new Error("Copilot query failed");
  return res.json();
}

export async function startDeepResearch(topic: string, tickers: string[]): Promise<{ workflow_id: string }> {
  const res = await fetch(`${API_BASE}/research/deep-dive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, tickers, depth: "deep" }),
  });
  if (!res.ok) throw new Error("Failed to dispatch research workflow");
  return res.json();
}

export async function pollResearchTask(taskId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/research/tasks/${encodeURIComponent(taskId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Task ${taskId} not found`);
  return res.json();
}

export async function generateBullBear(ticker: string): Promise<any> {
  const res = await fetch(`${API_BASE}/research/bull-bear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  });
  if (!res.ok) throw new Error(`Bull/Bear generation for ${ticker} failed`);
  return res.json();
}

export async function compareCompanies(tickerA: string, tickerB: string): Promise<any> {
  const res = await fetch(`${API_BASE}/research/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker_a: tickerA, ticker_b: tickerB }),
  });
  if (!res.ok) throw new Error(`Comparison failed`);
  return res.json();
}

export async function fetchTheses(ticker?: string): Promise<any[]> {
  const url = ticker
    ? `${API_BASE}/research/theses?ticker=${encodeURIComponent(ticker)}`
    : `${API_BASE}/research/theses`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch theses");
  return res.json();
}

export async function createThesis(ticker: string, thesisText: string): Promise<any> {
  const res = await fetch(`${API_BASE}/research/theses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, thesis_text: thesisText }),
  });
  if (!res.ok) throw new Error("Failed to create thesis");
  return res.json();
}

export async function evaluateThesis(thesisId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/research/theses/${encodeURIComponent(thesisId)}/evaluate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to evaluate thesis");
  return res.json();
}

export async function deleteThesis(thesisId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/research/theses/${encodeURIComponent(thesisId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete thesis");
}

export async function fetchFinancialStatements(
  ticker: string,
  limit: number = 8
): Promise<any[]> {
  const res = await fetch(
    `${API_BASE}/financials/${encodeURIComponent(ticker)}/statements?limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Financials for ${ticker} failed`);
  return res.json();
}

export async function fetchFinancialMetricsTrend(ticker: string): Promise<any> {
  const res = await fetch(
    `${API_BASE}/financials/${encodeURIComponent(ticker)}/metrics`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Metrics trend for ${ticker} failed`);
  return res.json();
}

export async function fetchMetricTrace(
  ticker: string,
  period: string = "Q4 2024",
  metric: string = "revenue"
): Promise<any> {
  const query = new URLSearchParams({ period, metric });
  const res = await fetch(
    `${API_BASE}/financials/${encodeURIComponent(ticker)}/trace?${query.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Metric trace for ${ticker} ${metric} failed`);
  return res.json();
}

export async function fetchEarningsReport(ticker: string): Promise<any> {
  const res = await fetch(
    `${API_BASE}/earnings/${encodeURIComponent(ticker)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Earnings report for ${ticker} failed`);
  return res.json();
}

export async function fetchTranscriptIntelligence(ticker: string): Promise<any> {
  const res = await fetch(
    `${API_BASE}/earnings/${encodeURIComponent(ticker)}/transcript`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Transcript intelligence for ${ticker} failed`);
  return res.json();
}

export async function fetchCompanyFilings(ticker: string): Promise<any[]> {
  const res = await fetch(
    `${API_BASE}/filings/${encodeURIComponent(ticker)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Filings for ${ticker} failed`);
  return res.json();
}

export async function fetchFilingDiff(
  ticker: string,
  basePeriod: string = "Q1 2024",
  targetPeriod: string = "Q2 2024",
  section: string = "Item 1A. Risk Factors"
): Promise<any> {
  const query = new URLSearchParams({
    base_period: basePeriod,
    target_period: targetPeriod,
    section,
  });
  const res = await fetch(
    `${API_BASE}/filings/${encodeURIComponent(ticker)}/diff?${query.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Filing diff for ${ticker} failed`);
  return res.json();
}

export async function fetchInvestmentCalendar(ticker?: string): Promise<any[]> {
  const query = ticker ? `?ticker=${encodeURIComponent(ticker)}` : "";
  const res = await fetch(`${API_BASE}/calendar${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch investment calendar");
  return res.json();
}

export async function createCatalyst(data: {
  ticker: string;
  title: string;
  catalyst_type: string;
  expected_date: string;
  confidence?: number;
  potential_impact?: string;
  description?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create catalyst");
  return res.json();
}

export async function compareDocuments(
  docAText: string,
  docBText: string,
  docATitle: string = "Analyst Report A",
  docBTitle: string = "Analyst Report B"
): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      report_a_title: docATitle,
      report_a_text: docAText,
      report_b_title: docBTitle,
      report_b_text: docBText,
    }),
  });
  if (!res.ok) throw new Error("Document comparison failed");
  return res.json();
}

