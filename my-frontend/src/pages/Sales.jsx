import { useState, useEffect } from "react";
import axios from "axios";

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
      .get(`http://127.0.0.1:5000/reports?period=${p}`)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: "1.25rem",
  };

  const renderDelta = (pct) => {
    if (pct === null || pct === undefined) return null;
    const positive = pct >= 0;
    return (
      <div
        style={{
          fontSize: 12.5,
          marginTop: 4,
          color: positive ? "#3B6D11" : "#c00",
        }}
      >
        {positive ? "+" : ""}
        {pct}% from last period
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#aaa" }}>
        Loading reports…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#c00" }}>
        Couldn't load reports: {error}
        <div>
          <button
            onClick={() => fetchReport(period)}
            style={{
              marginTop: 10,
              padding: "6px 16px",
              border: "1px solid #ddd",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const maxUnits = Math.max(0, ...report.top_products.map((p) => p.units_sold));
  const barMax = niceMax(maxUnits);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(barMax * f));

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Reports &amp; Summary</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Analyze your business performance
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
            background: "#fff",
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
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: "#888" }}>Total Sales</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
            ₱{report.total_sales.toLocaleString()}
          </div>
          {renderDelta(report.total_sales_change_pct)}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: "#888" }}>Total Transactions</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
            {report.total_transactions.toLocaleString()}
          </div>
          {renderDelta(report.total_transactions_change_pct)}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: "#888" }}>Average Daily Sales</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
            ₱{report.avg_daily_sales.toLocaleString()}
          </div>
          <div style={{ fontSize: 12.5, marginTop: 4, color: "#3B6D11" }}>
            Up from ₱{report.avg_daily_sales_prev.toLocaleString()}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: "#888" }}>Best Selling Product</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
            {report.best_selling_product
              ? report.best_selling_product.product
              : "—"}
          </div>
          <div style={{ fontSize: 12.5, marginTop: 4, color: "#888" }}>
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
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Bar chart */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, margin: "0 0 1.25rem 0" }}>
            Top 5 Best Selling Products
          </h3>
          {report.top_products.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 13.5 }}>No sales data yet.</div>
          ) : (
            <>
              {report.top_products.map((p) => (
                <div key={p.product} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, marginBottom: 4, color: "#374151" }}>
                    {p.product}
                  </div>
                  <div
                    style={{
                      background: "#f1f3f5",
                      borderRadius: 4,
                      height: 20,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${(p.units_sold / barMax) * 100}%`,
                        background: "#0e5a86",
                        height: "100%",
                        borderRadius: 4,
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
                  color: "#aaa",
                  borderTop: "1px solid #eee",
                  paddingTop: 6,
                  marginTop: 6,
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
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, margin: "0 0 1.25rem 0" }}>Inventory Health</h3>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: buildConicGradient(report.inventory_health),
                position: "relative",
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
                  background: "#fff",
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
                  <span style={{ color: HEALTH_COLORS[key], fontWeight: 600 }}>
                    {key}: {report.inventory_health[key] || 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast accuracy table */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, margin: "0 0 4px 0" }}>Forecast Accuracy Summary</h3>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 1rem 0" }}>
          Track how accurate your sales forecasts are over time
        </p>

        {report.forecast_accuracy.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 13.5, padding: "1rem 0" }}>
            Not enough sales history yet to measure forecast accuracy. Each product
            needs at least 4 days of recorded sales.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#f9f9f9" }}>
              <tr>
                {["Product", "MAE (units)", "RMSE (units)", "Accuracy Trend"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderBottom: "1px solid #eee",
                      color: "#374151",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.forecast_accuracy.map((row) => (
                <tr key={row.product}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                    {row.product}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                    {row.mae}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                    {row.rmse}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                    <span
                      style={{
                        color: row.trend === "Improving" ? "#14b881" : "#ef4444",
                        fontWeight: 600,
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
        )}
      </div>

      {/* Insight banner */}
      <div
        style={{
          background: "#e8f3ee",
          borderLeft: "4px solid #14b881",
          borderRadius: 10,
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
        }}
      >
        <h4 style={{ margin: "0 0 6px 0", fontSize: 15 }}>Performance Insight</h4>
        <p style={{ margin: 0, fontSize: 13.5, color: "#333", lineHeight: 1.5 }}>
          {report.insight}
        </p>
      </div>
    </div>
  );
}
