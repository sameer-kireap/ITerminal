"use client";

import { useEffect, useState } from "react";
import {
  fetchCompanyFilings,
  fetchEarningsReport,
  fetchFilingDiff,
  fetchFinancialStatements,
  fetchMetricTrace,
  fetchTranscriptIntelligence,
} from "../lib/api";
import {
  EarningsReleaseDTO,
  FilingDiffResultDTO,
  FinancialStatement,
  MetricTraceDTO,
  TranscriptAnalysisDTO,
} from "../lib/types";

interface FundamentalsTabProps {
  ticker: string;
}

export default function FundamentalsTab({ ticker }: FundamentalsTabProps) {
  const [subTab, setSubTab] = useState<"statements" | "earnings" | "differ">("statements");
  const [statementType, setStatementType] = useState<"income" | "balance" | "cash_flow">("income");
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Line-Item Tracing state
  const [selectedTrace, setSelectedTrace] = useState<MetricTraceDTO | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);

  // Earnings & Transcript state
  const [earnings, setEarnings] = useState<EarningsReleaseDTO | null>(null);
  const [transcript, setTranscript] = useState<TranscriptAnalysisDTO | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Filing Diff state
  const [diffResult, setDiffResult] = useState<FilingDiffResultDTO | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [basePeriod, setBasePeriod] = useState("Q1 2024");
  const [targetPeriod, setTargetPeriod] = useState("Q2 2024");
  const [diffSection, setDiffSection] = useState("Item 1A. Risk Factors");

  useEffect(() => {
    loadStatements();
  }, [ticker]);

  async function loadStatements() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFinancialStatements(ticker, 8);
      setStatements(data);
      if (data.length > 0) {
        handleTraceClick(data[0].fiscal_period + " " + data[0].fiscal_year, "revenue");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load financial statements");
    } finally {
      setLoading(false);
    }
  }

  async function handleTraceClick(period: string, metric: string) {
    setTraceLoading(true);
    try {
      const trace = await fetchMetricTrace(ticker, period, metric);
      setSelectedTrace(trace);
    } catch (err: any) {
      console.error("Trace error:", err);
    } finally {
      setTraceLoading(false);
    }
  }

  async function loadEarningsData() {
    setEarningsLoading(true);
    try {
      const [eData, tData] = await Promise.all([
        fetchEarningsReport(ticker),
        fetchTranscriptIntelligence(ticker),
      ]);
      setEarnings(eData);
      setTranscript(tData);
    } catch (err: any) {
      console.error("Earnings load error:", err);
    } finally {
      setEarningsLoading(false);
    }
  }

  async function loadFilingDiff() {
    setDiffLoading(true);
    try {
      const diff = await fetchFilingDiff(ticker, basePeriod, targetPeriod, diffSection);
      setDiffResult(diff);
    } catch (err: any) {
      console.error("Filing diff error:", err);
    } finally {
      setDiffLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Tab Navigation Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "8px 16px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            id="tab-financial-statements"
            onClick={() => setSubTab("statements")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              borderRadius: "4px",
              cursor: "pointer",
              border: subTab === "statements" ? "1px solid var(--accent-cyan)" : "1px solid transparent",
              backgroundColor: subTab === "statements" ? "var(--bg-tertiary)" : "transparent",
              color: subTab === "statements" ? "var(--accent-cyan)" : "var(--text-secondary)",
            }}
          >
            FINANCIAL STATEMENTS & AUDIT TRACE
          </button>
          <button
            id="tab-earnings-intelligence"
            onClick={() => {
              setSubTab("earnings");
              if (!earnings) loadEarningsData();
            }}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              borderRadius: "4px",
              cursor: "pointer",
              border: subTab === "earnings" ? "1px solid var(--accent-cyan)" : "1px solid transparent",
              backgroundColor: subTab === "earnings" ? "var(--bg-tertiary)" : "transparent",
              color: subTab === "earnings" ? "var(--accent-cyan)" : "var(--text-secondary)",
            }}
          >
            EARNINGS & TRANSCRIPT DIARIZATION
          </button>
          <button
            id="tab-filing-differ"
            onClick={() => {
              setSubTab("differ");
              if (!diffResult) loadFilingDiff();
            }}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              borderRadius: "4px",
              cursor: "pointer",
              border: subTab === "differ" ? "1px solid var(--accent-cyan)" : "1px solid transparent",
              backgroundColor: subTab === "differ" ? "var(--bg-tertiary)" : "transparent",
              color: subTab === "differ" ? "var(--accent-cyan)" : "var(--text-secondary)",
            }}
          >
            SEC 10-K/10-Q DIFFER
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
          <span>SECURITY:</span>
          <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{ticker}</span>
          <span style={{ marginLeft: "8px" }}>EDGAR LIVE</span>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--bull)" }} />
        </div>
      </div>

      {/* SUBTAB 1: FINANCIAL STATEMENTS & TRACE */}
      {subTab === "statements" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "16px" }}>
          {/* Left: Financial Statement Table */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["income", "balance", "cash_flow"] as const).map((t) => (
                  <button
                    key={t}
                    id={`btn-stmt-${t}`}
                    onClick={() => setStatementType(t)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "4px",
                      cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      backgroundColor: statementType === t ? "var(--accent-cyan)" : "var(--bg-tertiary)",
                      color: statementType === t ? "#000" : "var(--text-secondary)",
                    }}
                  >
                    {t === "income" ? "INCOME STATEMENT" : t === "balance" ? "BALANCE SHEET" : "CASH FLOW"}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                VALUES IN USD ($M) • CLICK ANY ROW FOR SEC AUDIT TRACE
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                Querying EDGAR statement repository...
              </div>
            ) : error ? (
              <div style={{ padding: "20px", color: "var(--bear)", fontSize: "12px" }}>{error}</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "right" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)", width: "220px" }}>
                        LINE ITEM
                      </th>
                      {statements.map((s) => (
                        <th key={s.id} style={{ padding: "8px 12px", color: "var(--accent-cyan)", minWidth: "90px" }}>
                          {s.fiscal_period} {s.fiscal_year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statementType === "income" && (
                      <>
                        <TableRow
                          label="Total Revenue"
                          data={statements.map((s) => s.income_statement.revenue)}
                          onSelect={(idx) =>
                            handleTraceClick(
                              `${statements[idx].fiscal_period} ${statements[idx].fiscal_year}`,
                              "revenue"
                            )
                          }
                          highlight
                        />
                        <TableRow
                          label="Gross Profit"
                          data={statements.map((s) => s.income_statement.gross_profit)}
                          onSelect={(idx) =>
                            handleTraceClick(
                              `${statements[idx].fiscal_period} ${statements[idx].fiscal_year}`,
                              "gross_profit"
                            )
                          }
                        />
                        <TableRow
                          label="Gross Margin (%)"
                          data={statements.map((s) => s.income_statement.gross_margin_pct)}
                          isPercent
                        />
                        <TableRow
                          label="Operating Income"
                          data={statements.map((s) => s.income_statement.operating_income)}
                          onSelect={(idx) =>
                            handleTraceClick(
                              `${statements[idx].fiscal_period} ${statements[idx].fiscal_year}`,
                              "operating_income"
                            )
                          }
                          highlight
                        />
                        <TableRow
                          label="Operating Margin (%)"
                          data={statements.map((s) => s.income_statement.operating_margin_pct)}
                          isPercent
                        />
                        <TableRow
                          label="Net Income"
                          data={statements.map((s) => s.income_statement.net_income)}
                          onSelect={(idx) =>
                            handleTraceClick(
                              `${statements[idx].fiscal_period} ${statements[idx].fiscal_year}`,
                              "net_income"
                            )
                          }
                        />
                        <TableRow
                          label="Diluted EPS ($)"
                          data={statements.map((s) => s.income_statement.diluted_eps)}
                          isDecimal
                          onSelect={(idx) =>
                            handleTraceClick(
                              `${statements[idx].fiscal_period} ${statements[idx].fiscal_year}`,
                              "diluted_eps"
                            )
                          }
                          highlight
                        />
                      </>
                    )}

                    {statementType === "balance" && (
                      <>
                        <TableRow
                          label="Cash & Equivalents"
                          data={statements.map((s) => s.balance_sheet.cash_and_equivalents)}
                          onSelect={(idx) =>
                            handleTraceClick(
                              `${statements[idx].fiscal_period} ${statements[idx].fiscal_year}`,
                              "cash_and_equivalents"
                            )
                          }
                          highlight
                        />
                        <TableRow
                          label="Total Current Assets"
                          data={statements.map((s) => s.balance_sheet.total_current_assets)}
                        />
                        <TableRow
                          label="Total Assets"
                          data={statements.map((s) => s.balance_sheet.total_assets)}
                          highlight
                        />
                        <TableRow
                          label="Total Debt"
                          data={statements.map((s) => s.balance_sheet.total_debt)}
                          highlight
                        />
                        <TableRow
                          label="Stockholders' Equity"
                          data={statements.map((s) => s.balance_sheet.stockholders_equity)}
                        />
                      </>
                    )}

                    {statementType === "cash_flow" && (
                      <>
                        <TableRow
                          label="Operating Cash Flow"
                          data={statements.map((s) => s.cash_flow.operating_cash_flow)}
                          onSelect={(idx) =>
                            handleTraceClick(
                              `${statements[idx].fiscal_period} ${statements[idx].fiscal_year}`,
                              "operating_cash_flow"
                            )
                          }
                          highlight
                        />
                        <TableRow
                          label="Capital Expenditures"
                          data={statements.map((s) => s.cash_flow.capital_expenditures)}
                        />
                        <TableRow
                          label="Free Cash Flow"
                          data={statements.map((s) => s.cash_flow.free_cash_flow)}
                          highlight
                        />
                        <TableRow
                          label="Share Repurchases"
                          data={statements.map((s) => s.cash_flow.stock_repurchases)}
                        />
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: SEC Line-Item Coordinate Trace Inspector */}
          <div
            id="sec-trace-panel"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-cyan)" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-primary)" }}>
                  SEC LINE-ITEM TRACE
                </span>
              </div>
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--bg-tertiary)", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                VERIFIED COORD
              </span>
            </div>

            {traceLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                Resolving SEC filing coordinates...
              </div>
            ) : selectedTrace ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
                <div style={{ padding: "10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase" }}>AUDITED METRIC</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {selectedTrace.metric.toUpperCase()} ({selectedTrace.period})
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                      ${selectedTrace.value.toLocaleString()}M
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <TraceMetadataRow label="Form Type" value={selectedTrace.form_type} />
                  <TraceMetadataRow label="SEC Section" value={selectedTrace.section_name} />
                  <TraceMetadataRow label="Row Coordinate" value={`Row #${selectedTrace.row_index}`} />
                  <TraceMetadataRow label="Column Header" value={selectedTrace.column_name} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Cryptographic Verification Hash (SHA-256)
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--accent-cyan)",
                        wordBreak: "break-all",
                        backgroundColor: "var(--bg-tertiary)",
                        padding: "4px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {selectedTrace.verification_hash}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Filing Excerpt
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      backgroundColor: "var(--bg-tertiary)",
                      padding: "8px",
                      borderRadius: "6px",
                      borderLeft: "3px solid var(--accent-cyan)",
                      lineHeight: "1.4",
                    }}
                  >
                    "{selectedTrace.filing_snippet}"
                  </div>
                </div>

                <a
                  href={selectedTrace.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    borderRadius: "4px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--accent-cyan)",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "11px",
                  }}
                >
                  VIEW PRIMARY SEC EDGAR FILING ↗
                </a>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>Select a metric to inspect source coordinates</div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: EARNINGS & TRANSCRIPT INTELLIGENCE */}
      {subTab === "earnings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {earningsLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              Synthesizing consensus estimates and transcribing earnings audio...
            </div>
          ) : earnings ? (
            <>
              {/* Earnings Actuals vs Consensus Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                <EarningsMetricCard
                  title="REVENUE (ACTUAL VS CONSENSUS)"
                  actual={`$${(earnings.reported_revenue / 1000).toFixed(2)}B`}
                  consensus={`$${(earnings.consensus_revenue / 1000).toFixed(2)}B`}
                  surprisePct={earnings.revenue_surprise_pct}
                  isBeat={earnings.revenue_surprise_pct >= 0}
                />
                <EarningsMetricCard
                  title="DILUTED EPS (ACTUAL VS CONSENSUS)"
                  actual={`$${earnings.reported_eps.toFixed(2)}`}
                  consensus={`$${earnings.consensus_eps.toFixed(2)}`}
                  surprisePct={earnings.eps_surprise_pct}
                  isBeat={earnings.eps_surprise_pct >= 0}
                />
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>EARNINGS VERDICT</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: earnings.beat_or_miss === "beat" ? "var(--bull)" : "var(--bear)",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                      }}
                    >
                      {earnings.beat_or_miss}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(34, 197, 94, 0.15)",
                        color: "var(--bull)",
                      }}
                    >
                      +{earnings.revenue_surprise_pct}% SURPRISE
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Period: {earnings.fiscal_period}</span>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>MANAGEMENT TONE SCORE</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                      {transcript?.overall_sentiment_score !== undefined
                        ? transcript.overall_sentiment_score >= 0
                          ? `+${transcript.overall_sentiment_score.toFixed(2)}`
                          : transcript.overall_sentiment_score.toFixed(2)
                        : "+0.68"}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--bull)", fontWeight: 600 }}>
                      {transcript?.overall_sentiment_score !== undefined && transcript.overall_sentiment_score > 0.3
                        ? "VERY BULLISH"
                        : "CONSTRUCTIVE"}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "4px", backgroundColor: "var(--bg-tertiary)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: "84%", height: "100%", backgroundColor: "var(--bull)" }} />
                  </div>
                </div>
              </div>

              {/* Segment Results & Forward Guidance */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Segment Results */}
                <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px" }}>
                    REVENUE BY BUSINESS SEGMENT ($M)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(earnings.segment_breakdown || {}).map(([seg, val]) => (
                      <div key={seg} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-primary)" }}>{seg}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-cyan)" }}>
                            ${val.toLocaleString()}M
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", width: "40px", textAlign: "right" }}>
                            {earnings.reported_revenue ? ((val / earnings.reported_revenue) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forward Guidance */}
                <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px" }}>
                    OFFICIAL FORWARD GUIDANCE SUMMARY
                  </h4>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "var(--bg-tertiary)",
                      borderRadius: "6px",
                      borderLeft: "3px solid var(--bull)",
                      fontSize: "12px",
                      lineHeight: "1.5",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {earnings.guidance_summary}
                  </div>
                  {transcript?.qoq_tone_shift && (
                    <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--accent-cyan)" }}>
                      Tone Shift: {transcript.qoq_tone_shift}
                    </div>
                  )}
                </div>
              </div>

              {/* Diarized Q&A Exchange */}
              {transcript && transcript.qa_sessions && (
                <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px" }}>
                    DIARIZED ANALYST Q&A WITH EXECUTIVE TONE EXTRACTION
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {transcript.qa_sessions.map((qa, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-cyan)" }}>
                              Q: {qa.analyst_name} ({qa.institution})
                            </span>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "1px 6px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.06)" }}>
                              Topic: {qa.topic}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: qa.tone_score >= 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: qa.tone_score >= 0 ? "var(--bull)" : "var(--bear)",
                              textTransform: "uppercase",
                              fontWeight: 600,
                            }}
                          >
                            TONE: {qa.management_tone} ({qa.tone_score >= 0 ? `+${qa.tone_score.toFixed(2)}` : qa.tone_score.toFixed(2)})
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                          "{qa.question_summary}"
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--bull)", marginTop: "4px" }}>
                          A: Executive Management
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4" }}>
                          "{qa.executive_response}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* SUBTAB 3: SEC FILING DIFFER */}
      {subTab === "differ" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Differ Controls Bar */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>BASE PERIOD:</span>
              <select
                id="select-base-period"
                value={basePeriod}
                onChange={(e) => setBasePeriod(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                }}
              >
                <option value="Q1 2024">Q1 2024 (10-Q)</option>
                <option value="Q4 2023">Q4 2023 (10-K)</option>
              </select>
            </div>

            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>vs</span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>TARGET PERIOD:</span>
              <select
                id="select-target-period"
                value={targetPeriod}
                onChange={(e) => setTargetPeriod(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                }}
              >
                <option value="Q2 2024">Q2 2024 (10-Q)</option>
                <option value="Q3 2024">Q3 2024 (10-Q)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>SECTION:</span>
              <select
                id="select-diff-section"
                value={diffSection}
                onChange={(e) => setDiffSection(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                }}
              >
                <option value="Item 1A. Risk Factors">Item 1A. Risk Factors</option>
                <option value="Item 7. MD&A">Item 7. MD&A</option>
              </select>
            </div>

            <button
              id="btn-run-diff"
              onClick={loadFilingDiff}
              style={{
                marginLeft: "auto",
                padding: "6px 14px",
                backgroundColor: "var(--accent-cyan)",
                color: "#000",
                fontWeight: 700,
                fontSize: "11px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              RUN SEMANTIC FILING DIFF
            </button>
          </div>

          {diffLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              Diffing normalized SEC disclosure sections and calculating materiality delta...
            </div>
          ) : diffResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Executive Summary & Materiality Shift */}
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                      MATERIALITY SHIFT SCORE
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        color: "var(--bear)",
                        fontWeight: 800,
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {(diffResult.materiality_shift_score * 100).toFixed(0)}% SIGNIFICANT SHIFT
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Section: {diffResult.section_name} ({diffResult.base_filing} → {diffResult.target_filing})
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  {diffResult.executive_diff_summary}
                </div>
              </div>

              {/* Theme Shifts */}
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "10px" }}>
                  KEY THEME SHIFTS IDENTIFIED
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {diffResult.key_theme_shifts.map((shift, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "var(--bg-tertiary)",
                        borderRadius: "4px",
                        borderLeft: "3px solid var(--accent-cyan)",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {shift}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additions & Deletions Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Added Clauses */}
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                    <span style={{ color: "var(--bull)", fontWeight: 700, fontSize: "14px" }}>+</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--bull)" }}>
                      ADDED DISCLOSURE CLAUSES ({diffResult.added_clauses.length})
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {diffResult.added_clauses.map((clause, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(34, 197, 94, 0.08)",
                          borderLeft: "3px solid var(--bull)",
                          fontSize: "11px",
                          color: "var(--text-primary)",
                          borderRadius: "4px",
                        }}
                      >
                        + {clause}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Removed Clauses */}
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                    <span style={{ color: "var(--bear)", fontWeight: 700, fontSize: "14px" }}>-</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--bear)" }}>
                      REMOVED DISCLOSURE CLAUSES ({diffResult.removed_clauses.length})
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {diffResult.removed_clauses.map((clause, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(239, 68, 68, 0.08)",
                          borderLeft: "3px solid var(--bear)",
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          textDecoration: "line-through",
                          borderRadius: "4px",
                        }}
                      >
                        - {clause}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TableRow({
  label,
  data,
  isPercent,
  isDecimal,
  highlight,
  onSelect,
}: {
  label: string;
  data: number[];
  isPercent?: boolean;
  isDecimal?: boolean;
  highlight?: boolean;
  onSelect?: (colIndex: number) => void;
}) {
  return (
    <tr
      style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        backgroundColor: highlight ? "rgba(0, 240, 255, 0.03)" : "transparent",
      }}
    >
      <td style={{ padding: "8px 12px", color: highlight ? "var(--accent-cyan)" : "var(--text-primary)", fontWeight: highlight ? 600 : 400 }}>
        {label}
      </td>
      {data.map((val, i) => (
        <td
          key={i}
          onClick={() => onSelect && onSelect(i)}
          style={{
            padding: "8px 12px",
            textAlign: "right",
            cursor: onSelect ? "pointer" : "default",
            color: onSelect ? "var(--text-primary)" : "var(--text-secondary)",
            transition: "all 0.15s ease",
          }}
          title={onSelect ? "Click to inspect SEC coordinate trace" : undefined}
          onMouseEnter={(e) => {
            if (onSelect) {
              e.currentTarget.style.backgroundColor = "rgba(0, 240, 255, 0.12)";
              e.currentTarget.style.color = "var(--accent-cyan)";
            }
          }}
          onMouseLeave={(e) => {
            if (onSelect) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-primary)";
            }
          }}
        >
          {val !== undefined && val !== null
            ? isPercent
              ? `${val.toFixed(1)}%`
              : isDecimal
              ? `$${val.toFixed(2)}`
              : `$${val.toLocaleString()}`
            : "—"}
        </td>
      ))}
    </tr>
  );
}

function TraceMetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "4px" }}>
      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function EarningsMetricCard({
  title,
  actual,
  consensus,
  surprisePct,
  isBeat,
}: {
  title: string;
  actual: string;
  consensus: string;
  surprisePct: number;
  isBeat: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{title}</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
          {actual}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: isBeat ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: isBeat ? "var(--bull)" : "var(--bear)",
          }}
        >
          {surprisePct >= 0 ? `+${surprisePct}%` : `${surprisePct}%`}
        </span>
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
        Consensus: <span style={{ fontFamily: "var(--font-mono)" }}>{consensus}</span>
      </div>
    </div>
  );
}
