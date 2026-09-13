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

export interface Citation {
  source_index: number;
  source_name: string;
  source_url?: string | null;
  published_at?: string | null;
  relevant_snippet: string;
  content_hash: string;
}

export interface GroundedAnswer {
  query: string;
  answer: string;
  citations: Citation[];
  has_sufficient_context: boolean;
  contradictions_detected: string[];
  ticker?: string | null;
}

export interface ResearchReport {
  workflow_id: string;
  topic: string;
  tickers: string[];
  executive_summary: string;
  key_findings: string[];
  bull_case?: string | null;
  bear_case?: string | null;
  contradictions: string[];
  citations: Citation[];
  generated_at: string;
}

export interface WorkflowStatus {
  workflow_id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | string;
  progress: number;
  current_step?: string | null;
  report?: ResearchReport | null;
  error?: string | null;
}

export interface BullBearAnalysis {
  ticker: string;
  bull_thesis: string;
  bull_catalysts: string[];
  bear_thesis: string;
  bear_risks: string[];
  falsification_conditions: string[];
  citations: Citation[];
}

export interface ThesisItem {
  id: string;
  ticker: string;
  thesis_text: string;
  status: string;
  last_evaluation?: any;
  created_at: string;
}

export interface CompanyComparison {
  ticker_a: string;
  ticker_b: string;
  summary: string;
  metrics_comparison: Record<string, any>;
  strategic_advantages: Record<string, string[]>;
  citations: Citation[];
}

export interface FinancialStatement {
  id: string;
  ticker: string;
  fiscal_year: number;
  fiscal_period: string;
  period_type: string;
  filing_date: string;
  income_statement: {
    revenue: number;
    gross_profit: number;
    gross_margin_pct: number;
    operating_income: number;
    operating_margin_pct: number;
    net_income: number;
    diluted_eps: number;
  };
  balance_sheet: {
    cash_and_equivalents: number;
    total_current_assets: number;
    total_assets: number;
    total_debt: number;
    stockholders_equity: number;
  };
  cash_flow: {
    operating_cash_flow: number;
    capital_expenditures: number;
    free_cash_flow: number;
    stock_repurchases: number;
  };
}

export interface MetricTraceDTO {
  ticker: string;
  period: string;
  metric: string;
  value: number;
  form_type: string;
  source_url: string;
  section_name: string;
  row_index: number;
  column_name: string;
  verification_hash: string;
  filing_snippet: string;
}

export interface EarningsReleaseDTO {
  ticker: string;
  fiscal_period: string;
  reported_revenue: number;
  consensus_revenue: number;
  revenue_surprise_pct: number;
  reported_eps: number;
  consensus_eps: number;
  eps_surprise_pct: number;
  beat_or_miss: "beat" | "miss" | "in_line" | string;
  guidance_summary: string;
  segment_breakdown: Record<string, number>;
  reported_at: string;
}

export interface QAPair {
  analyst_name: string;
  institution: string;
  topic: string;
  question_summary: string;
  executive_response: string;
  management_tone: string;
  tone_score: number;
}

export interface TranscriptAnalysisDTO {
  ticker: string;
  fiscal_period: string;
  call_date: string;
  overall_sentiment_score: number;
  management_tone_summary: string;
  executive_remarks: string[];
  qa_sessions: QAPair[];
  qoq_tone_shift: string;
}

export interface FilingSummaryDTO {
  form: string;
  period: string;
  filing_date: string;
  accession_number: string;
}

export interface FilingDiffResultDTO {
  ticker: string;
  base_filing: string;
  target_filing: string;
  section_name: string;
  materiality_shift_score: number;
  executive_diff_summary: string;
  added_clauses: string[];
  removed_clauses: string[];
  key_theme_shifts: string[];
  diff_html_preview: string;
}

export interface CatalystDTO {
  id: string;
  ticker: string;
  title: string;
  catalyst_type: "earnings" | "product_launch" | "regulatory" | "investor_day" | "macro" | string;
  expected_date: string;
  days_until: number;
  confidence: number;
  potential_impact: "high" | "medium" | "low" | string;
  description?: string | null;
}

export interface DocumentThemeDTO {
  theme: string;
  evidence: string[];
  sentiment: string;
}

export interface ReportComparisonDTO {
  report_a_title: string;
  report_b_title: string;
  shared_theses: string[];
  diverging_views: string[];
  metrics_comparison: Record<string, any>;
  reconciliation_summary: string;
}

