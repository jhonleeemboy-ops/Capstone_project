import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

const HEALTH_COLORS = {
  OK: "#14b881",
  "Low Stock": "#f0a84e",
  Critical: "#ef4444",
  Expired: "#9ca3af",
};

const HEALTH_ORDER = ["OK", "Low Stock", "Critical", "Expired"];

function buildConicGradient(health) {
  let cumulative = 0;
  const stops = [];
  HEALTH_ORDER.forEach((key) => {
    const val = health[key] || 0;
    const start = cumulative;
    cumulative += val;
    stops.push(`${HEALTH_COLORS[key]} ${start}% ${cumulative}%`);
  });
  if (cumulative < 100) {
    stops.push(`#e5e7eb ${cumulative}% 100%`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}

function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil((value * 1.15) / magnitude) * magnitude;
}

export default function Sales() {
  const [period, setPeriod] = useState("this_month");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const fetchReport = (p) => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_URL}/reports?period=${p}`)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  };

  const lightGlassPanelStyle = {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: "1.5rem",
    boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.08), 0 2px 4px 0 rgba(255, 255, 255, 0.5) inset",
  };

  const renderDelta = (pct) => {
    if (pct === null || pct === undefined) return null;
    const positive = pct >= 0;
    return (
      <div
        style={{
          fontSize: 12.5,
          marginTop: 6,
          fontWeight: 600,
          color: positive ? "#16a34a" : "#ef4444",
        }}
      >
        {positive ? "+" : ""}
        {pct}% from last period
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ width: "100%", padding: "3rem", textAlign: "center", color: "#64748b", background: "#e4e7eb", minHeight: "100vh" }}>
        Loading reports…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100%", padding: "1.5rem", background: "#e4e7eb", minHeight: "100vh", boxSizing: "border-box" }}>
        <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "1rem", borderRadius: 14, fontWeight: 600, textAlign: "center" }}>
          Couldn't load reports: {error}
          <div>
            <button
              onClick={() => fetchReport(period)}
              style={{
                marginTop: 10,
                padding: "8px 16px",
                border: "1px solid rgba(203, 213, 225, 0.8)",
                borderRadius: 10,
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const maxUnits = Math.max(0, ...report.top_products.map((p) => p.units_sold));
  const barMax = niceMax(maxUnits);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(barMax * f));

  return (
    <div style={{
      width: "100%",
      color: "#1e293b",
      fontFamily: "inherit",
      padding: "1.5rem",
      background: "#e4e7eb",
      minHeight: "100vh",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.5px" }}>
            Reports &amp; Summary
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Analyze your business performance and inventory health
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            border: "1px solid rgba(203, 213, 225, 0.8)",
            fontSize: 14,
            fontWeight: 600,
            background: "rgba(255, 255, 255, 0.8)",
            color: "#0f172a",
            outline: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            cursor: "pointer",
          }}
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
        </select>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: "1.5rem",
        }}
      >
        <div style={lightGlassPanelStyle}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Sales</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#0f172a" }}>
            ₱{report.total_sales.toLocaleString()}
          </div>
          {renderDelta(report.total_sales_change_pct)}
        </div>

        <div style={lightGlassPanelStyle}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Transactions</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#0f172a" }}>
            {report.total_transactions.toLocaleString()}
          </div>
          {renderDelta(report.total_transactions_change_pct)}
        </div>

        <div style={lightGlassPanelStyle}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Average Daily Sales</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#0f172a" }}>
            ₱{report.avg_daily_sales.toLocaleString()}
          </div>
          <div style={{ fontSize: 12.5, marginTop: 6, color: "#16a34a", fontWeight: 600 }}>
            Up from ₱{report.avg_daily_sales_prev.toLocaleString()}
          </div>
        </div>

        <div style={lightGlassPanelStyle}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Best Selling Product</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: "#0f172a" }}>
            {report.best_selling_product
              ? report.best_selling_product.product
              : "—"}
          </div>
          <div style={{ fontSize: 12.5, marginTop: 6, color: "#64748b", fontWeight: 600 }}>
            {report.best_selling_product
              ? `${report.best_selling_product.units_sold} units sold`
              : "No sales yet"}
          </div>
        </div>
      </div>

      {/* Bar chart + Donut chart */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 20,
          marginBottom: "1.5rem",
        }}
      >
        {/* Bar chart */}
        <div style={lightGlassPanelStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem 0" }}>
            Top 5 Best Selling Products
          </h3>
          {report.top_products.length === 0 ? (
            <div style={{ color: "#64748b", fontSize: 13.5 }}>No sales data yet.</div>
          ) : (
            <>
              {report.top_products.map((p) => (
                <div key={p.product} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, marginBottom: 4, color: "#334155", fontWeight: 600 }}>
                    {p.product}
                  </div>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      borderRadius: 6,
                      height: 20,
                      position: "relative",
                      border: "1px solid rgba(203, 213, 225, 0.6)",
                    }}
                  >
                    <div
                      style={{
                        width: `${(p.units_sold / barMax) * 100}%`,
                        background: "#0284c7",
                        height: "100%",
                        borderRadius: 5,
                        boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  color: "#64748b",
                  fontWeight: 600,
                  borderTop: "1px solid rgba(203, 213, 225, 0.8)",
                  paddingTop: 8,
                  marginTop: 8,
                }}
              >
                {ticks.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Donut chart */}
        <div style={lightGlassPanelStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem 0" }}>Inventory Health</h3>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: buildConicGradient(report.inventory_health),
                position: "relative",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "58%",
                  height: "58%",
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)",
                }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", justifyContent: "center" }}>
              {HEALTH_ORDER.map((key) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: HEALTH_COLORS[key],
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: HEALTH_COLORS[key], fontWeight: 700 }}>
                    {key}: {report.inventory_health[key] || 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast accuracy table */}
      <div style={{ ...lightGlassPanelStyle, marginBottom: "1.5rem", overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(203, 213, 225, 0.8)", background: "rgba(255, 255, 255, 0.6)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>Forecast Accuracy Summary</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Track how accurate your sales forecasts are over time
          </p>
        </div>

        {report.forecast_accuracy.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 13.5, padding: "2.5rem", textAlign: "center" }}>
            Not enough sales history yet to measure forecast accuracy. Each product needs at least 4 days of recorded sales.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(203, 213, 225, 0.8)" }}>
                  {["Product", "MAE (units)", "RMSE (units)", "Accuracy Trend"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        color: "#475569",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.forecast_accuracy.map((row) => (
                  <tr key={row.product} style={{ borderBottom: "1px solid rgba(203, 213, 225, 0.5)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                      {row.product}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {row.mae}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {row.rmse}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          color: row.trend === "Improving" ? "#16a34a" : "#ef4444",
                          fontWeight: 700,
                        }}
                      >
                        {row.trend === "Improving" ? "↗ " : "↘ "}
                        {row.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insight banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(20, 184, 166, 0.15) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderLeft: "5px solid #16a34a",
          borderRadius: 16,
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
        }}
      >
        <h4 style={{ margin: "0 0 6px 0", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Performance Insight</h4>
        <p style={{ margin: 0, fontSize: 13.5, color: "#334155", lineHeight: 1.5, fontWeight: 500 }}>
          {report.insight}
        </p>
      </div>
    </div>
  );
}