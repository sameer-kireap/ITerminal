export type EventType =
  | "breaking"
  | "earnings"
  | "guidance"
  | "m_and_a"
  | "product"
  | "partnership"
  | "regulatory"
  | "litigation"
  | "executive"
  | "rumor"
  | "general";

export interface ImpactTag {
  category: string;
  sentiment: "positive" | "negative" | "neutral" | string;
  note?: string | null;
}

export interface Entity {
  name: string;
  ticker?: string | null;
  cik?: string | null;
  type?: string;
  confidence?: number;
}

export interface Article {
  id: string;
  source: string;
  source_id?: string | null;
  url?: string | null;
  content_hash: string;
  title: string;
  body: string;
  summary?: string | null;
  why_it_matters?: string | null;
  impact_tags: ImpactTag[];
  event_type: EventType | string;
  importance_score?: number | null;
  source_reliability: "high" | "medium" | "low" | string;
  published_at?: string | null;
  ingested_at: string;
  entities: Entity[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  ticker: string;
  cik?: string | null;
  sector?: string | null;
  total_events: number;
  sentiment_distribution: Record<string, number>;
  latest_event_at?: string | null;
}

export interface TimelineItem {
  id: string;
  title: string;
  summary?: string | null;
  why_it_matters?: string | null;
  impact_tags: ImpactTag[];
  importance_score?: number | null;
  event_type: string;
  source: string;
  url?: string | null;
  timestamp: string;
}

export interface DeltaFeed {
  ticker: string;
  window_hours: number;
  new_events_count: number;
  prior_events_count: number;
  activity_delta_percent: number;
  key_developments: TimelineItem[];
  delta_summary: string;
}

export interface AlertItem {
  id: string;
  ticker?: string | null;
  company_name?: string | null;
  title: string;
  summary?: string | null;
  why_it_matters?: string | null;
  impact_tags: ImpactTag[];
  importance_score: number;
  event_type: string;
  source: string;
  source_reliability: string;
  url?: string | null;
  detected_at: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  created_at: string;
}
