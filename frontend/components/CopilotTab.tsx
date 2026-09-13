"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BullBearAnalysis,
  CompanyComparison,
  GroundedAnswer,
  ResearchReport,
  ThesisItem,
} from "../lib/types";
import {
  compareCompanies,
  createThesis,
  deleteThesis,
  evaluateThesis,
  fetchTheses,
  generateBullBear,
  pollResearchTask,
  queryCopilot,
  startDeepResearch,
} from "../lib/api";

export function CopilotTab() {
  const [mode, setMode] = useState<"qa" | "deep" | "bullbear" | "compare" | "theses">("qa");

  // Q&A State
  const [qaQuery, setQaQuery] = useState("");
  const [qaTicker, setQaTicker] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<GroundedAnswer | null>(null);

  // Deep Research State
  const [deepTopic, setDeepTopic] = useState("");
  const [deepTickers, setDeepTickers] = useState("NVDA");
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepProgress, setDeepProgress] = useState<{ step: string; pct: number } | null>(null);
  const [deepReport, setDeepReport] = useState<ResearchReport | null>(null);

  // Bull/Bear State
  const [bbTicker, setBbTicker] = useState("NVDA");
  const [bbLoading, setBbLoading] = useState(false);
  const [bbResult, setBbResult] = useState<BullBearAnalysis | null>(null);

  // Compare State
  const [cmpA, setCmpA] = useState("NVDA");
  const [cmpB, setCmpB] = useState("AMD");
  const [cmpLoading, setCmpLoading] = useState(false);
  const [cmpResult, setCmpResult] = useState<CompanyComparison | null>(null);

  // Theses State
  const [theses, setTheses] = useState<ThesisItem[]>([]);
  const [newThesisTicker, setNewThesisTicker] = useState("NVDA");
  const [newThesisText, setNewThesisText] = useState("");
  const [thesesLoading, setThesesLoading] = useState(false);

  // Q&A Execution
  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuery.trim()) return;
    setQaLoading(true);
    try {
      const res = await queryCopilot(qaQuery.trim(), qaTicker.trim() || undefined);
      setQaResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setQaLoading(false);
    }
  };

  // Deep Research Execution
  const handleDeepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deepTopic.trim()) return;
    setDeepLoading(true);
    setDeepReport(null);
    setDeepProgress({ step: "Initializing research workflow...", pct: 10 });

    try {
      const tickersArr = deepTickers
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
      const { workflow_id } = await startDeepResearch(deepTopic.trim(), tickersArr);

      // Poll task status
      const interval = setInterval(async () => {
        try {
          const status = await pollResearchTask(workflow_id);
          setDeepProgress({
            step: status.current_step || status.status,
            pct: Math.round(status.progress * 100),
          });

          if (status.status === "COMPLETED" && status.report) {
            clearInterval(interval);
            setDeepReport(status.report);
            setDeepLoading(false);
          } else if (status.status === "FAILED") {
            clearInterval(interval);
            setDeepLoading(false);
          }
        } catch (e) {
          clearInterval(interval);
          setDeepLoading(false);
        }
      }, 700);
    } catch (err) {
      console.error(err);
      setDeepLoading(false);
    }
  };

  // Bull / Bear Execution
  const handleBbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bbTicker.trim()) return;
    setBbLoading(true);
    try {
      const res = await generateBullBear(bbTicker.trim().toUpperCase());
      setBbResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBbLoading(false);
    }
  };

  // Compare Execution
  const handleCmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpA.trim() || !cmpB.trim()) return;
    setCmpLoading(true);
    try {
      const res = await compareCompanies(cmpA.trim().toUpperCase(), cmpB.trim().toUpperCase());
      setCmpResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCmpLoading(false);
    }
  };

  // Theses Handlers
  const loadTheses = async () => {
    setThesesLoading(true);
    try {
      const res = await fetchTheses();
      setTheses(res);
    } catch (err) {
      console.error(err);
    } finally {
      setThesesLoading(false);
    }
  };

  const handleCreateThesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThesisTicker.trim() || !newThesisText.trim()) return;
    try {
      await createThesis(newThesisTicker.trim().toUpperCase(), newThesisText.trim());
      setNewThesisText("");
      await loadTheses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvaluateThesis = async (id: string) => {
    try {
      await evaluateThesis(id);
      await loadTheses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteThesis = async (id: string) => {
    try {
      await deleteThesis(id);
      await loadTheses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Sub-mode Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-card)",
          padding: "0.85rem 1.25rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`cmd-chip ${mode === "qa" ? "active" : ""}`}
            style={{ background: mode === "qa" ? "var(--cyan)" : undefined, color: mode === "qa" ? "#030712" : undefined, fontWeight: 700 }}
            onClick={() => setMode("qa")}
          >
            1. EVIDENCE Q&amp;A
          </button>
          <button
            className={`cmd-chip ${mode === "deep" ? "active" : ""}`}
            style={{ background: mode === "deep" ? "var(--cyan)" : undefined, color: mode === "deep" ? "#030712" : undefined, fontWeight: 700 }}
            onClick={() => setMode("deep")}
          >
            2. AGENTIC DEEP RESEARCH
          </button>
          <button
            className={`cmd-chip ${mode === "bullbear" ? "active" : ""}`}
            style={{ background: mode === "bullbear" ? "var(--cyan)" : undefined, color: mode === "bullbear" ? "#030712" : undefined, fontWeight: 700 }}
            onClick={() => setMode("bullbear")}
          >
            3. BULL / BEAR ANALYSIS
          </button>
          <button
            className={`cmd-chip ${mode === "compare" ? "active" : ""}`}
            style={{ background: mode === "compare" ? "var(--cyan)" : undefined, color: mode === "compare" ? "#030712" : undefined, fontWeight: 700 }}
            onClick={() => setMode("compare")}
          >
            4. COMPANY COMPARISON
          </button>
          <button
            className={`cmd-chip ${mode === "theses" ? "active" : ""}`}
            style={{ background: mode === "theses" ? "var(--cyan)" : undefined, color: mode === "theses" ? "#030712" : undefined, fontWeight: 700 }}
            onClick={() => {
              setMode("theses");
              loadTheses();
            }}
          >
            5. THESIS TRACKER
          </button>
        </div>
      </div>

      {/* 1. Evidence-Backed Q&A */}
      {mode === "qa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <form onSubmit={handleQASubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="cmd-input"
              style={{ flex: 1 }}
              placeholder="Ask an investment research question with verifiable citations (e.g. What was Nvidia Q4 datacenter revenue?)..."
              value={qaQuery}
              onChange={(e) => setQaQuery(e.target.value)}
            />
            <input
              type="text"
              className="cmd-input"
              style={{ width: "120px" }}
              placeholder="Ticker (opt)"
              value={qaTicker}
              onChange={(e) => setQaTicker(e.target.value)}
            />
            <button type="submit" className="sim-btn" disabled={qaLoading} style={{ color: "var(--cyan)", fontWeight: 700 }}>
              {qaLoading ? "ANALYZING..." : "QUERY COPILOT"}
            </button>
          </form>

          {qaResult && (
            <div className="event-card highlight">
              <div className="card-top">
                <span className="ticker-pill">
                  {qaResult.ticker || "CORPUS"}
                </span>
                <span style={{ fontSize: "0.75rem", color: qaResult.has_sufficient_context ? "var(--bull)" : "var(--bear)", fontFamily: "var(--font-mono)" }}>
                  {qaResult.has_sufficient_context ? "VERIFIED CITATION BACKING" : "INSUFFICIENT CONTEXT"}
                </span>
              </div>

              <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                {qaResult.answer}
              </div>

              {qaResult.contradictions_detected.length > 0 && (
                <div className="ai-block" style={{ borderColor: "var(--bear)", background: "rgba(244, 63, 94, 0.05)", marginTop: "0.75rem" }}>
                  <div className="ai-block-title" style={{ color: "var(--bear)" }}>⚠️ CONTRADICTION DETECTED</div>
                  {qaResult.contradictions_detected.map((c, i) => (
                    <div key={i} style={{ fontSize: "0.82rem" }}>{c}</div>
                  ))}
                </div>
              )}

              {qaResult.citations.length > 0 && (
                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    EVIDENCE CITATIONS:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {qaResult.citations.map((cit) => (
                      <div
                        key={cit.source_index}
                        style={{
                          fontSize: "0.78rem",
                          background: "var(--bg-base)",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--cyan)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                          <span>[Source {cit.source_index}] {cit.source_name}</span>
                          {cit.source_url && (
                            <a href={cit.source_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                              VIEW SOURCE ↗
                            </a>
                          )}
                        </div>
                        <div style={{ marginTop: "0.25rem", color: "var(--text-secondary)" }}>
                          {cit.relevant_snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Agentic Deep Research */}
      {mode === "deep" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <form onSubmit={handleDeepSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="cmd-input"
              style={{ flex: 1 }}
              placeholder="Multi-step deep research topic (e.g. Evaluate sustainability of AI datacenter margins and pricing power)..."
              value={deepTopic}
              onChange={(e) => setDeepTopic(e.target.value)}
            />
            <input
              type="text"
              className="cmd-input"
              style={{ width: "150px" }}
              placeholder="Tickers (NVDA, MSFT)"
              value={deepTickers}
              onChange={(e) => setDeepTickers(e.target.value)}
            />
            <button type="submit" className="sim-btn" disabled={deepLoading} style={{ color: "var(--cyan)", fontWeight: 700 }}>
              {deepLoading ? "EXECUTING..." : "DISPATCH WORKFLOW"}
            </button>
          </form>

          {deepLoading && deepProgress && (
            <div className="event-card">
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                <span style={{ color: "var(--cyan)" }}>TEMPORAL ORCHESTRATION IN PROGRESS</span>
                <span>{deepProgress.pct}%</span>
              </div>
              <div style={{ background: "var(--bg-base)", height: "8px", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <div style={{ width: `${deepProgress.pct}%`, height: "100%", background: "var(--cyan)", transition: "width 0.3s ease" }} />
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                Current Activity: {deepProgress.step}
              </div>
            </div>
          )}

          {deepReport && (
            <div className="event-card highlight">
              <div className="card-top">
                <span className="ticker-pill">{deepReport.tickers.join(", ")}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  WORKFLOW ID: {deepReport.workflow_id}
                </span>
              </div>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                {deepReport.topic}
              </h3>

              <div className="ai-block" style={{ marginBottom: "0.75rem" }}>
                <div className="ai-block-title">● EXECUTIVE SUMMARY</div>
                <div style={{ lineHeight: "1.6" }}>{deepReport.executive_summary}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="ai-block" style={{ borderLeft: "2px solid var(--bull)", background: "rgba(16, 185, 129, 0.04)" }}>
                  <div className="ai-block-title" style={{ color: "var(--bull)" }}>▲ BULL CATALYST THESIS</div>
                  <div>{deepReport.bull_case}</div>
                </div>
                <div className="ai-block" style={{ borderLeft: "2px solid var(--bear)", background: "rgba(244, 63, 94, 0.04)" }}>
                  <div className="ai-block-title" style={{ color: "var(--bear)" }}>▼ BEAR RISK THESIS</div>
                  <div>{deepReport.bear_case}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  KEY FINDINGS &amp; AUDIT CITATIONS:
                </div>
                <ul style={{ paddingLeft: "1.2rem", fontSize: "0.85rem", lineHeight: "1.5", color: "var(--text-secondary)" }}>
                  {deepReport.key_findings.map((f, i) => (
                    <li key={i} style={{ marginBottom: "0.3rem" }}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Bull vs Bear Analysis */}
      {mode === "bullbear" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <form onSubmit={handleBbSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="cmd-input"
              style={{ width: "200px" }}
              placeholder="Ticker (e.g. NVDA)"
              value={bbTicker}
              onChange={(e) => setBbTicker(e.target.value)}
            />
            <button type="submit" className="sim-btn" disabled={bbLoading} style={{ color: "var(--cyan)", fontWeight: 700 }}>
              {bbLoading ? "ANALYZING..." : "GENERATE BULL / BEAR CASE"}
            </button>
          </form>

          {bbResult && (
            <div className="event-card">
              <div className="card-top">
                <Link href={`/company/${bbResult.ticker}`} className="ticker-pill">
                  <span>{bbResult.ticker}</span>
                  <span>↗</span>
                </Link>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  DUAL-CASE INVESTMENT THESIS
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                <div className="ai-block" style={{ borderLeft: "3px solid var(--bull)", background: "rgba(16, 185, 129, 0.05)" }}>
                  <div className="ai-block-title" style={{ color: "var(--bull)" }}>▲ BULL THESIS</div>
                  <p style={{ marginBottom: "0.6rem", lineHeight: "1.5" }}>{bbResult.bull_thesis}</p>
                  <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--bull)", marginBottom: "0.3rem" }}>
                    KEY CATALYSTS:
                  </div>
                  <ul style={{ paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                    {bbResult.bull_catalysts.map((cat, i) => (
                      <li key={i} style={{ marginBottom: "0.25rem" }}>{cat}</li>
                    ))}
                  </ul>
                </div>

                <div className="ai-block" style={{ borderLeft: "3px solid var(--bear)", background: "rgba(244, 63, 94, 0.05)" }}>
                  <div className="ai-block-title" style={{ color: "var(--bear)" }}>▼ BEAR THESIS</div>
                  <p style={{ marginBottom: "0.6rem", lineHeight: "1.5" }}>{bbResult.bear_thesis}</p>
                  <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--bear)", marginBottom: "0.3rem" }}>
                    STRUCTURAL RISKS:
                  </div>
                  <ul style={{ paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                    {bbResult.bear_risks.map((risk, i) => (
                      <li key={i} style={{ marginBottom: "0.25rem" }}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="ai-block" style={{ marginTop: "1rem", borderColor: "var(--amber)", background: "rgba(245, 158, 11, 0.04)" }}>
                <div className="ai-block-title" style={{ color: "var(--amber)" }}>⚡ FALSIFICATION CONDITIONS</div>
                <ul style={{ paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                  {bbResult.falsification_conditions.map((fc, i) => (
                    <li key={i} style={{ marginBottom: "0.25rem" }}>{fc}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Company Comparison */}
      {mode === "compare" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <form onSubmit={handleCmpSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="cmd-input"
              style={{ width: "160px" }}
              placeholder="Ticker A (NVDA)"
              value={cmpA}
              onChange={(e) => setCmpA(e.target.value)}
            />
            <span style={{ alignSelf: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>VS</span>
            <input
              type="text"
              className="cmd-input"
              style={{ width: "160px" }}
              placeholder="Ticker B (AMD)"
              value={cmpB}
              onChange={(e) => setCmpB(e.target.value)}
            />
            <button type="submit" className="sim-btn" disabled={cmpLoading} style={{ color: "var(--cyan)", fontWeight: 700 }}>
              {cmpLoading ? "COMPARING..." : "COMPARE ENTITIES"}
            </button>
          </form>

          {cmpResult && (
            <div className="event-card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                {cmpResult.ticker_a} VS {cmpResult.ticker_b} COMPARISON
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: "1.5" }}>
                {cmpResult.summary}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="ai-block">
                  <div className="ai-block-title">● {cmpResult.ticker_a} ADVANTAGES</div>
                  <ul style={{ paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                    {cmpResult.strategic_advantages[cmpResult.ticker_a]?.map((adv, i) => (
                      <li key={i} style={{ marginBottom: "0.25rem" }}>{adv}</li>
                    ))}
                  </ul>
                </div>
                <div className="ai-block">
                  <div className="ai-block-title">● {cmpResult.ticker_b} ADVANTAGES</div>
                  <ul style={{ paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                    {cmpResult.strategic_advantages[cmpResult.ticker_b]?.map((adv, i) => (
                      <li key={i} style={{ marginBottom: "0.25rem" }}>{adv}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Thesis Tracker */}
      {mode === "theses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <form onSubmit={handleCreateThesis} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="cmd-input"
              style={{ width: "120px" }}
              placeholder="Ticker (NVDA)"
              value={newThesisTicker}
              onChange={(e) => setNewThesisTicker(e.target.value)}
            />
            <input
              type="text"
              className="cmd-input"
              style={{ flex: 1 }}
              placeholder="Enter an investment thesis hypothesis to continuously monitor against news disclosures..."
              value={newThesisText}
              onChange={(e) => setNewThesisText(e.target.value)}
            />
            <button type="submit" className="sim-btn" style={{ color: "var(--cyan)", fontWeight: 700 }}>
              + TRACK THESIS
            </button>
          </form>

          {thesesLoading ? (
            <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2rem", textAlign: "center" }}>
              LOADING ACTIVE THESES...
            </div>
          ) : theses.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2rem", textAlign: "center" }}>
              NO ACTIVE THESES TRACKED. ADD A HYPOTHESIS ABOVE TO COMMENCE CONTINUOUS VERIFICATION.
            </div>
          ) : (
            theses.map((th) => {
              const evalData = th.last_evaluation;
              const evalStatus = evalData?.status || "neutral";
              const statusColor =
                evalStatus === "supports"
                  ? "var(--bull)"
                  : evalStatus === "contradicts"
                  ? "var(--bear)"
                  : "var(--amber)";

              return (
                <div key={th.id} className="event-card">
                  <div className="card-top">
                    <Link href={`/company/${th.ticker}`} className="ticker-pill">
                      <span>{th.ticker}</span>
                      <span>↗</span>
                    </Link>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: statusColor,
                      }}
                    >
                      EVALUATION: {evalStatus.toUpperCase()}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                    &ldquo;{th.thesis_text}&rdquo;
                  </h4>

                  {evalData?.rationale && (
                    <div className="ai-block" style={{ marginBottom: "0.75rem" }}>
                      <div className="ai-block-title">● ANALYSIS RATIONALE</div>
                      <div>{evalData.rationale}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      CREATED: {new Date(th.created_at).toLocaleDateString()}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="sim-btn"
                        style={{ fontSize: "0.7rem", color: "var(--cyan)" }}
                        onClick={() => handleEvaluateThesis(th.id)}
                      >
                        RE-EVALUATE
                      </button>
                      <button
                        className="sim-btn"
                        style={{ fontSize: "0.7rem", color: "var(--bear)" }}
                        onClick={() => handleDeleteThesis(th.id)}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
