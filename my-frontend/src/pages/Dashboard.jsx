import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoneyBillWave,
  faBoxOpen,
  faTriangleExclamation,
  faChartLine,
  faDownload,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

const PRIORITY_STYLES = {
  urgent: { label: "URGENT", badgeBg: "#ef4444", border: "#ef4444", accent: "#ef4444" },
  soon: { label: "SOON", badgeBg: "#f97316", border: "#f97316", accent: "#f97316" },
  monitor: { label: "MONITOR", badgeBg: "#eab308", border: "#eab308", accent: "#eab308" },
};

const PRIORITY_ORDER = ["urgent", "soon", "monitor"];

export default function Dashboard({ user } = {}) {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expiry, setExpiry] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("http://127.0.0.1:5000/sales"),
      axios.get("http://127.0.0.1:5000/inventory"),
      axios.get("http://127.0.0.1:5000/expiry"),
      axios.get("http://127.0.0.1:5000/forecast").catch(() => null),
      axios.get("http://127.0.0.1:5000/recommendations").catch(() => ({ data: [] })),
    ]).then(([s, inv, exp, f, rec]) => {
      setSales(s.data);
      setInventory(inv.data);
      setExpiry(exp.data);
      if (f) setForecast(f.data);
      setRecommendations(rec.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "#94a3b8", fontSize: 15 }}>Loading dashboard...</p>
      </div>
    );
  }

  // ---------------------------------
  // KPI CARDS (unchanged logic)
  // ---------------------------------

  const toDateKey = (d) => new Date(d).toISOString().slice(0, 10);
  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const salesToday = sales.filter((s) => toDateKey(s.date) === todayKey);
  const salesYesterday = sales.filter((s) => toDateKey(s.date) === yesterdayKey);

  const totalToday = salesToday.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalYesterday = salesYesterday.reduce((sum, s) => sum + Number(s.amount), 0);

  let percentChange = null;
  if (totalYesterday > 0) {
    percentChange = ((totalToday - totalYesterday) / totalYesterday) * 100;
  } else if (totalToday > 0) {
    percentChange = 100;
  }

  const lowStockItems = inventory.filter((i) => i.stock <= i.reorder_level);
  const expiredItems = expiry.filter((i) => i.status === "Expired");
  const expiringSoon = expiry.filter(
    (i) => i.status === "Critical" || i.status === "Expiring soon"
  );
  const forecastTotal = forecast
    ? forecast.forecast.reduce((sum, f) => sum + f.amount, 0)
    : null;
  const lastForecastDate =
    forecast && forecast.forecast.length > 0
      ? new Date(forecast.forecast[0].date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—";

  const cards = [
    {
      label: "Total Sales Today",
      value: `₱${totalToday.toLocaleString()}`,
      sub:
        percentChange === null
          ? `${salesToday.length} sale${salesToday.length === 1 ? "" : "s"} today`
          : `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(0)}% from yesterday`,
      subColor: percentChange === null ? "#64748b" : percentChange >= 0 ? "#16a34a" : "#ef4444",
      icon: faMoneyBillWave,
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
    },
    {
      label: "Low Stock Items",
      value: lowStockItems.length,
      sub: lowStockItems.length > 0 ? "Needs attention" : "All stocked",
      subColor: lowStockItems.length > 0 ? "#fff" : "#16a34a",
      subBg: lowStockItems.length > 0 ? "#ef4444" : "transparent",
      icon: faBoxOpen,
      iconBg: "#fee2e2",
      iconColor: "#ef4444",
    },
    {
      label: "Expiring Soon",
      value: expiredItems.length + expiringSoon.length,
      sub: "Within 7 days",
      subColor: "#fff",
      subBg: "#f97316",
      icon: faTriangleExclamation,
      iconBg: "#ffedd5",
      iconColor: "#f97316",
    },
    {
      label: "Last Forecast",
      value: lastForecastDate,
      sub: forecastTotal ? `₱${Math.round(forecastTotal).toLocaleString()} predicted` : "Predicted revenue",
      subColor: "#64748b",
      icon: faChartLine,
      iconBg: "#e0f2fe",
      iconColor: "#0284c7",
    },
  ];

  // ---------------------------------
  // RECOMMENDATIONS PANEL
  // top item per priority bucket, matching the 3-card layout
  // ---------------------------------

  const featuredRecs = PRIORITY_ORDER.map((priority) =>
    recommendations.find((r) => r.priority === priority)
  ).filter(Boolean);

  const priorityButtonLabel = {
    urgent: "Order Now",
    soon: "Apply",
    monitor: "View",
  };

  const handleExportCSV = () => {
    if (recommendations.length === 0) return;
    const header = "Priority,Action,Product,Reason,Detail,Suggested Quantity\n";
    const rows = recommendations
      .map((r) =>
        [r.priority, r.action, r.product, r.reason, r.detail, r.suggested_quantity ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recommendations-${todayKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------
  // SALES TREND (last 30 days)
  // ---------------------------------

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const dailyTotals = days.map((d) => {
    const key = toDateKey(d);
    const total = sales
      .filter((s) => toDateKey(s.date) === key)
      .reduce((sum, s) => sum + Number(s.amount), 0);
    return { date: d, total };
  });

  const maxTotal = Math.max(...dailyTotals.map((d) => d.total), 1);
  const yMax = Math.ceil((maxTotal * 1.15) / 1000) * 1000 || 1000;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((yMax * f) / 100) * 100);

  const chartW = 640;
  const chartH = 220;
  const padL = 50;
  const padB = 24;
  const padT = 10;
  const plotW = chartW - padL - 10;
  const plotH = chartH - padT - padB;

  const points = dailyTotals.map((d, i) => {
    const x = padL + (i / (dailyTotals.length - 1)) * plotW;
    const y = padT + plotH - (d.total / yMax) * plotH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const xTickIndices = [0, 5, 10, 15, 20, 25, 29].filter((i) => i < points.length);

  // ---------------------------------
  // RECENT TRANSACTIONS (grouped)
  // ---------------------------------

  const groupsMap = {};
  sales.forEach((s) => {
    const key = s.transaction_id ? `t-${s.transaction_id}` : `s-${s.id}`;
    if (!groupsMap[key]) {
      groupsMap[key] = { id: key, products: [], amount: 0, date: s.date };
    }
    groupsMap[key].products.push(s.product);
    groupsMap[key].amount += Number(s.amount);
  });

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const hasTimeComponent =
      typeof dateStr === "string" && (dateStr.includes("T") || dateStr.includes(":"));
    if (!hasTimeComponent) return null;
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const recentTransactions = Object.values(groupsMap)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((g) => ({
      ...g,
      timeLabel:
        formatTime(g.date) ||
        new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

  return (
    <div style={{ maxWidth: 1180 }}>
      {/* Header */}
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
        Dashboard
      </h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: "1.5rem" }}>
        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
      </p>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: "1.5rem",
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "1.25rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{c.label}</p>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: c.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon icon={c.icon} style={{ color: c.iconColor, width: 16, height: 16 }} />
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0 }}>{c.value}</p>
            <span
              style={{
                fontSize: 12,
                color: c.subColor,
                background: c.subBg || "transparent",
                padding: c.subBg ? "3px 10px" : 0,
                borderRadius: c.subBg ? 99 : 0,
                alignSelf: "flex-start",
              }}
            >
              {c.sub}
            </span>
          </div>
        ))}
      </div>

      {/* What You Should Do Today */}
      <div
        style={{
          background: "linear-gradient(135deg, #0b3a5c 0%, #0e4a72 100%)",
          borderRadius: 16,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
            What You Should Do Today
          </h2>
          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faDownload} style={{ width: 12, height: 12 }} />
            Export CSV
          </button>
        </div>

        {featuredRecs.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>
            No recommendations right now — you're all caught up.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${featuredRecs.length}, 1fr)`,
              gap: 16,
            }}
          >
            {featuredRecs.map((rec) => {
              const style = PRIORITY_STYLES[rec.priority];
              return (
                <div
                  key={rec.inventory_id}
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    borderLeft: `4px solid ${style.border}`,
                    borderRadius: 10,
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        background: style.badgeBg,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 5,
                        letterSpacing: 0.3,
                      }}
                    >
                      {style.label}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>
                      {rec.action.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: "#fff", fontSize: 19, fontWeight: 700 }}>{rec.product}</div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{rec.detail}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    Reason: {rec.reason}
                  </div>
                  <button
                    style={{
                      marginTop: 6,
                      background: "#fff",
                      color: style.accent,
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 0",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {priorityButtonLabel[rec.priority]}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sales Trend + Recent Transactions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 16,
        }}
      >
        {/* Sales Trend */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
            Sales Trend (Last 30 Days)
          </h2>
          {sales.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 14 }}>No sales recorded yet.</p>
          ) : (
            <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" style={{ overflow: "visible" }}>
              {/* Y gridlines + labels */}
              {yTicks.map((t) => {
                const y = padT + plotH - (t / yMax) * plotH;
                return (
                  <g key={t}>
                    <line
                      x1={padL}
                      x2={chartW - 10}
                      y1={y}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text x={padL - 8} y={y + 4} fontSize="10" fill="#94a3b8" textAnchor="end">
                      {t}
                    </text>
                  </g>
                );
              })}

              {/* Line */}
              <path d={linePath} fill="none" stroke="#0e5a86" strokeWidth="2.5" />

              {/* Dots */}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#0e5a86" />
              ))}

              {/* X labels */}
              {xTickIndices.map((i) => (
                <text
                  key={i}
                  x={points[i].x}
                  y={chartH - 4}
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {points[i].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </text>
              ))}
            </svg>
          )}
        </div>

        {/* Recent Transactions */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
            Recent Transactions
          </h2>
          {recentTransactions.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 14 }}>No sales recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 4px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#eef2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FontAwesomeIcon icon={faClock} style={{ width: 13, height: 13, color: "#64748b" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#0f172a" }}>
                        {t.products.join(", ")}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.timeLabel}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    ₱{t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
