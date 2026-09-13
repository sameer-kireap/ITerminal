"use client";

import { useEffect, useState } from "react";
import {
  compareDocuments,
  createCatalyst,
  fetchInvestmentCalendar,
} from "../lib/api";
import { CatalystDTO, ReportComparisonDTO } from "../lib/types";

interface CalendarTabProps {
  ticker?: string;
}

export default function CalendarTab({ ticker }: CalendarTabProps) {
  const [subTab, setSubTab] = useState<"calendar" | "reports">("calendar");
  const [catalysts, setCatalysts] = useState<CatalystDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTicker, setFilterTicker] = useState<string>(ticker || "");

  // Add Catalyst Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("earnings");
  const [newDate, setNewDate] = useState("2026-10-15");
  const [newImpact, setNewImpact] = useState("high");
  const [newConfidence, setNewConfidence] = useState("0.90");
  const [newDesc, setNewDesc] = useState("");

  // Document Comparison State
  const [docATitle, setDocATitle] = useState("Morgan Stanley Equity Research — Overweight NVDA");
  const [docBTitle, setDocBTitle] = useState("Goldman Sachs Equity Research — Neutral NVDA");
  const [docAText, setDocAText] = useState("");
  const [docBText, setDocBText] = useState("");
  const [comparisonResult, setComparisonResult] = useState<ReportComparisonDTO | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadCalendar();
  }, [filterTicker]);

  async function loadCalendar() {
    setLoading(true);
    try {
      const data = await fetchInvestmentCalendar(filterTicker || undefined);
      setCatalysts(data);
    } catch (err: any) {
      console.error("Calendar load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCatalyst(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCatalyst({
        ticker: filterTicker || "NVDA",
        title: newTitle,
        catalyst_type: newType,
        expected_date: newDate,
        potential_impact: newImpact,
        confidence: parseFloat(newConfidence),
        description: newDesc,
      });
      setShowAddModal(false);
      setNewTitle("");
      setNewDesc("");
      loadCalendar();
    } catch (err: any) {
      alert("Failed to create catalyst: " + err.message);
    }
  }

  function loadSampleReports() {
    setDocATitle("Morgan Stanley Equity Research — Overweight NVDA (PT $160)");
    setDocBTitle("Goldman Sachs Global Investment Research — Neutral NVDA (PT $125)");
    setDocAText(`Morgan Stanley Research | September 2026
Recommendation: OVERWEIGHT | Target Price: $160 (from $145)

We raise our 12-month target price on NVIDIA to $160 based on accelerating demand for the Blackwell B200 architecture. Hyperscaler capital expenditure trajectories from Microsoft, Google, Meta, and Amazon indicate strong 2026 commitments with minimal risk of air pockets in orders.

Gross margin outlook remains robust at 76.5% as packaging yields on TSMC CoWoS-L have matured ahead of schedule. Enterprise AI adoption is transitioning from training models into full-scale token inference workloads, expanding addressable market beyond core cloud hyperscalers into sovereign AI nations and Tier-2 neocloud providers. Valuation represents 28x our revised FY26 EPS estimate of $5.70, which we view as compelling given 42% structural EPS CAGR.`);

    setDocBText(`Goldman Sachs Global Investment Research | September 2026
Recommendation: NEUTRAL | Target Price: $125

While NVIDIA continues to demonstrate peerless technical leadership in compute density with NVLink 5 and Blackwell clusters, we maintain a Neutral rating on valuation multiples and prospective 2027 digestion risks.

Primary points of caution:
1. Hyperscaler Return on Invested Capital (ROIC) scrutiny has reached board-level focus, potentially gating hardware deployment cadences in 2H 2027.
2. In-house custom silicon (Google TPU v6, Amazon Trainium2, Microsoft Maia) is expected to capture 22% of internal inference workloads, dampening merchant silicon pricing power.
3. Power and electrical grid infrastructure interconnect queues in Northern Virginia and Frankfurt pose physical delivery bottlenecks regardless of chip supply.
We value NVDA at 22x FY26 EPS ($5.10), recommending investors await a more constructive entry point.`);
  }

  async function handleCompare() {
    if (!docAText.trim() || !docBText.trim()) {
      alert("Please provide text for both analyst reports or click 'Load Sample Memos'.");
      return;
    }
    setComparing(true);
    try {
      const result = await compareDocuments(docAText, docBText, docATitle, docBTitle);
      setComparisonResult(result);
    } catch (err: any) {
      alert("Comparison failed: " + err.message);
    } finally {
      setComparing(false);
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
            id="tab-investment-calendar"
            onClick={() => setSubTab("calendar")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              borderRadius: "4px",
              cursor: "pointer",
              border: subTab === "calendar" ? "1px solid var(--accent-cyan)" : "1px solid transparent",
              backgroundColor: subTab === "calendar" ? "var(--bg-tertiary)" : "transparent",
              color: subTab === "calendar" ? "var(--accent-cyan)" : "var(--text-secondary)",
            }}
          >
            INVESTMENT CALENDAR & CATALYST ENGINE
          </button>
          <button
            id="tab-document-intelligence"
            onClick={() => setSubTab("reports")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              borderRadius: "4px",
              cursor: "pointer",
              border: subTab === "reports" ? "1px solid var(--accent-cyan)" : "1px solid transparent",
              backgroundColor: subTab === "reports" ? "var(--bg-tertiary)" : "transparent",
              color: subTab === "reports" ? "var(--accent-cyan)" : "var(--text-secondary)",
            }}
          >
            DOCUMENT & ANALYST REPORT COMPARISON
          </button>
        </div>

        {subTab === "calendar" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Filter by Ticker (e.g. NVDA)"
              value={filterTicker}
              onChange={(e) => setFilterTicker(e.target.value.toUpperCase())}
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "11px",
                color: "var(--text-primary)",
                width: "140px",
              }}
            />
            <button
              id="btn-add-catalyst"
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "6px 12px",
                backgroundColor: "var(--accent-cyan)",
                color: "#000",
                fontWeight: 700,
                fontSize: "11px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              + SCHEDULE CATALYST
            </button>
          </div>
        )}
      </div>

      {/* SUBTAB 1: INVESTMENT CALENDAR & CATALYSTS */}
      {subTab === "calendar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {showAddModal && (
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--accent-cyan)",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "12px" }}>
                SCHEDULE NEW CORPORATE CATALYST EVENT
              </h4>
              <form onSubmit={handleCreateCatalyst} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>EVENT TITLE</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q3 Earnings or AI Keynote"
                    style={{ width: "100%", padding: "6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-primary)", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>CATALYST TYPE</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{ width: "100%", padding: "6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-primary)", fontSize: "12px" }}
                  >
                    <option value="earnings">Earnings Release</option>
                    <option value="product_launch">Product Launch</option>
                    <option value="investor_day">Investor Day / Conference</option>
                    <option value="regulatory">Regulatory / Legal</option>
                    <option value="macro">Macro / Monetary</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>EXPECTED DATE</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{ width: "100%", padding: "6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-primary)", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>POTENTIAL IMPACT</label>
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value)}
                    style={{ width: "100%", padding: "6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-primary)", fontSize: "12px" }}
                  >
                    <option value="high">High Impact</option>
                    <option value="medium">Medium Impact</option>
                    <option value="low">Low Impact</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>CONFIDENCE SCORE</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(e.target.value)}
                    style={{ width: "100%", padding: "6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-primary)", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>DESCRIPTION / THESIS</label>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Key metrics to monitor"
                    style={{ width: "100%", padding: "6px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-primary)", fontSize: "12px" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ padding: "6px 14px", backgroundColor: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "6px 14px", backgroundColor: "var(--accent-cyan)", color: "#000", fontWeight: 700, borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "11px" }}
                  >
                    SAVE EVENT
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              Scanning investment calendar and corporate catalyst schedule...
            </div>
          ) : catalysts.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              No catalyst events scheduled for this filter.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "12px" }}>
              {catalysts.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "var(--bg-tertiary)",
                          color: "var(--accent-cyan)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {cat.ticker}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                        }}
                      >
                        {cat.catalyst_type.replace("_", " ")}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: cat.days_until === 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(0, 240, 255, 0.12)",
                        color: cat.days_until === 0 ? "var(--bull)" : "var(--accent-cyan)",
                      }}
                    >
                      {cat.days_until === 0 ? "TODAY" : cat.days_until < 0 ? `${Math.abs(cat.days_until)}d AGO` : `IN ${cat.days_until} DAYS`}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {cat.title}
                  </div>

                  {cat.description && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {cat.description}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "8px", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Date: {cat.expected_date}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span
                        style={{
                          color: cat.potential_impact === "high" ? "var(--bear)" : "var(--accent-cyan)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {cat.potential_impact} IMPACT
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>•</span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {(cat.confidence * 100).toFixed(0)}% Conf
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: DOCUMENT & ANALYST REPORT COMPARISON */}
      {subTab === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Action Bar */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                SIDE-BY-SIDE ANALYST REPORT RECONCILIATION
              </h4>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                Extract consensus points, valuation multiples divergence, and thematic disagreements
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                id="btn-load-sample-reports"
                onClick={loadSampleReports}
                style={{
                  padding: "6px 14px",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--accent-cyan)",
                  border: "1px solid var(--accent-cyan)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                LOAD SAMPLE INSTITUTIONAL MEMOS (MS vs GS)
              </button>
              <button
                id="btn-run-document-compare"
                onClick={handleCompare}
                disabled={comparing}
                style={{
                  padding: "6px 16px",
                  backgroundColor: "var(--accent-cyan)",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {comparing ? "RECONCILING..." : "RECONCILE REPORTS"}
              </button>
            </div>
          </div>

          {/* Side-by-Side Document Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Document A */}
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <input
                value={docATitle}
                onChange={(e) => setDocATitle(e.target.value)}
                placeholder="Report A Title / Source"
                style={{
                  padding: "6px 10px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  color: "var(--accent-cyan)",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              />
              <textarea
                rows={12}
                value={docAText}
                onChange={(e) => setDocAText(e.target.value)}
                placeholder="Paste primary research note, investment bank memo, or initiation report A..."
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  lineHeight: "1.4",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Document B */}
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <input
                value={docBTitle}
                onChange={(e) => setDocBTitle(e.target.value)}
                placeholder="Report B Title / Source"
                style={{
                  padding: "6px 10px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  color: "var(--bear)",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              />
              <textarea
                rows={12}
                value={docBText}
                onChange={(e) => setDocBText(e.target.value)}
                placeholder="Paste competing analyst note, downgrade memo, or report B..."
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  lineHeight: "1.4",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Comparison Output */}
          {comparisonResult && (
            <div
              id="report-reconciliation-panel"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--accent-cyan)",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-cyan)" }}>
                  {comparisonResult.report_a_title} vs {comparisonResult.report_b_title}
                </h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  AI INSTITUTIONAL RECONCILIATION
                </span>
              </div>

              {/* Synthesized Takeaway Banner */}
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "rgba(0, 240, 255, 0.05)",
                  borderLeft: "3px solid var(--accent-cyan)",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", marginBottom: "4px" }}>
                  PORTFOLIO MANAGER SYNTHESIS
                </div>
                {comparisonResult.reconciliation_summary}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Consensus / Shared Theses */}
                <div style={{ backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", padding: "12px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--bull)", marginBottom: "8px" }}>
                    AREAS OF CONSENSUS / SHARED THESES ({comparisonResult.shared_theses?.length || 0})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(comparisonResult.shared_theses || []).map((area, i) => (
                      <div key={i} style={{ fontSize: "11px", color: "var(--text-primary)", lineHeight: "1.4" }}>
                        • {area}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diverging Views */}
                <div style={{ backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", padding: "12px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--bear)", marginBottom: "8px" }}>
                    DIVERGING VIEWS & FRICTION POINTS ({comparisonResult.diverging_views?.length || 0})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(comparisonResult.diverging_views || []).map((dis, i) => (
                      <div key={i} style={{ fontSize: "11px", color: "var(--text-primary)", lineHeight: "1.4" }}>
                        • {dis}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
