import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
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
  urgent: { label: "URGENT", badgeBg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", accent: "#ef4444" },
  soon: { label: "SOON", badgeBg: "rgba(249, 115, 22, 0.2)", border: "#f97316", accent: "#f97316" },
  monitor: { label: "MONITOR", badgeBg: "rgba(234, 179, 8, 0.2)", border: "#eab308", accent: "#eab308" },
};

const PRIORITY_ORDER = ["urgent", "soon", "monitor"];

export default function Dashboard({ user } = {}) {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expiry, setExpiry] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredChartCard, setHoveredChartCard] = useState(null);
  const [isExportHovered, setIsExportHovered] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/sales`),
      axios.get(`${API_URL}/inventory`),
      axios.get(`${API_URL}/expiry`),
      axios.get(`${API_URL}/forecast`).catch(() => null),
      axios.get(`${API_URL}/recommendations`).catch(() => ({ data: [] })),
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", background: "#e4e7eb", width: "100%" }}>
        <p style={{ color: "#64748b", fontSize: 15 }}>Loading dashboard...</p>
      </div>
    );
  }

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
      id: "sales",
      label: "Total Sales Today",
      value: `₱${totalToday.toLocaleString()}`,
      sub:
        percentChange === null
          ? `${salesToday.length} sale${salesToday.length === 1 ? "" : "s"} today`
          : `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(0)}% from yesterday`,
      subColor: percentChange === null ? "#64748b" : percentChange >= 0 ? "#16a34a" : "#dc2626",
      icon: faMoneyBillWave,
      iconColor: "#16a34a",
      route: "/sales",
    },
    {
      id: "lowstock",
      label: "Low Stock Items",
      value: lowStockItems.length,
      sub: lowStockItems.length > 0 ? "Needs attention" : "All stocked",
      subColor: lowStockItems.length > 0 ? "#fff" : "#16a34a",
      subBg: lowStockItems.length > 0 ? "#dc2626" : "transparent",
      icon: faBoxOpen,
      iconColor: "#dc2626",
      route: "/inventory",
    },
    {
      id: "expiring",
      label: "Expiring Soon",
      value: expiredItems.length + expiringSoon.length,
      sub: "Within 7 days",
      subColor: "#fff",
      subBg: "#ea580c",
      icon: faTriangleExclamation,
      iconColor: "#ea580c",
      route: "/expiry",
    },
    {
      id: "forecast",
      label: "Last Forecast",
      value: lastForecastDate,
      sub: forecastTotal ? `₱${Math.round(forecastTotal).toLocaleString()} predicted` : "Predicted revenue",
      subColor: "#64748b",
      icon: faChartLine,
      iconColor: "#0284c7",
      route: "/forecast",
    },
  ];

  const featuredRecs = PRIORITY_ORDER.map((priority) =>
    recommendations.find((r) => r.priority === priority)
  ).filter(Boolean);

  const priorityButtonLabel = {
    urgent: "Order Now",
    soon: "Apply",
    monitor: "View",
  };

  const handleActionClick = (rec) => {
    if (rec.action.toLowerCase().includes("order") || rec.priority === "urgent") {
      navigate("/pos");
    } else if (rec.priority === "soon") {
      navigate("/inventory");
    } else {
      navigate("/recommendations");
    }
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

  const lightGlassCardStyle = (isHovered) => ({
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: isHovered ? "1px solid rgba(14, 116, 144, 0.4)" : "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: "1.25rem",
    boxShadow: isHovered
      ? "0 12px 32px rgba(14, 116, 144, 0.15), 0 2px 4px rgba(255, 255, 255, 0.5) inset"
      : "0 8px 24px 0 rgba(31, 38, 135, 0.06), 0 2px 4px 0 rgba(255, 255, 255, 0.5) inset",
    transform: isHovered ? "translateY(-3px)" : "translateY(0)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
  });

  const lightGlassIconBoxStyle = {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

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
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 4,
            letterSpacing: "-0.5px",
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: "1.5rem",
        }}
      >
        {cards.map((c) => {
          const isHovered = hoveredCard === c.id;
          return (
            <div
              key={c.id}
              onClick={() => navigate(c.route)}
              onMouseEnter={() => setHoveredCard(c.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={lightGlassCardStyle(isHovered)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontWeight: 600 }}>{c.label}</p>
                <div style={lightGlassIconBoxStyle}>
                  <FontAwesomeIcon icon={c.icon} style={{ color: c.iconColor, width: 16, height: 16 }} />
                </div>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>{c.value}</p>
              <span
                style={{
                  fontSize: 12,
                  color: c.subColor,
                  background: c.subBg || "transparent",
                  padding: c.subBg ? "3px 10px" : 0,
                  borderRadius: c.subBg ? 99 : 0,
                  display: "inline-block",
                  fontWeight: 600,
                }}
              >
                {c.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* What You Should Do Today */}
      <div
        style={{
          background: "linear-gradient(135deg, #071325 0%, #0c213f 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 24,
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 16px 48px 0 rgba(15, 23, 42, 0.25)",
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
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: 0 }}>
            What You Should Do Today
          </h2>
          <button
            onClick={handleExportCSV}
            onMouseEnter={() => setIsExportHovered(true)}
            onMouseLeave={() => setIsExportHovered(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              border: isExportHovered ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transform: isExportHovered ? "translateY(-2px)" : "translateY(0)",
              boxShadow: isExportHovered
                ? "0 6px 20px rgba(0, 0, 0, 0.3)"
                : "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <FontAwesomeIcon icon={faDownload} style={{ width: 12, height: 12 }} />
            Export CSV
          </button>
        </div>

        {featuredRecs.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, fontWeight: 500 }}>
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
              const isButtonHovered = hoveredButton === rec.inventory_id;
              return (
                <div
                  key={rec.inventory_id}
                  style={{
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(11, 15, 28, 0.95) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderLeft: `5px solid ${style.border}`,
                    borderRadius: 16,
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        background: style.badgeBg,
                        color: style.accent,
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 6,
                        letterSpacing: 0.5,
                        border: `1px solid ${style.border}50`,
                      }}
                    >
                      {style.label}
                    </span>
                    <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 800 }}>
                      {rec.action.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: "#ffffff", fontSize: 18, fontWeight: 800 }}>{rec.product}</div>
                  <div style={{ color: "#cbd5e1", fontSize: 13.5, fontWeight: 600 }}>{rec.detail}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12.5, fontWeight: 500 }}>
                    Reason: {rec.reason}
                  </div>
                  <button
                    onClick={() => handleActionClick(rec)}
                    onMouseEnter={() => setHoveredButton(rec.inventory_id)}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                      marginTop: 6,
                      background: "#ffffff",
                      color: "#0f172a",
                      border: "none",
                      borderRadius: 12,
                      padding: "11px 0",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      transform: isButtonHovered ? "translateY(-2px)" : "translateY(0)",
                      boxShadow: isButtonHovered
                        ? "0 6px 20px rgba(255, 255, 255, 0.25)"
                        : "0 4px 14px rgba(0, 0, 0, 0.2)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
          gap: 20,
        }}
      >
        {/* Sales Trend */}
        <div
          onClick={() => navigate("/forecast")}
          onMouseEnter={() => setHoveredChartCard("trend")}
          onMouseLeave={() => setHoveredChartCard(null)}
          style={lightGlassCardStyle(hoveredChartCard === "trend")}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
            Sales Trend (Last 30 Days)
          </h2>
          {sales.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>No sales recorded yet.</p>
          ) : (
            <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" style={{ overflow: "visible" }}>
              {yTicks.map((t) => {
                const y = padT + plotH - (t / yMax) * plotH;
                return (
                  <g key={t}>
                    <line
                      x1={padL}
                      x2={chartW - 10}
                      y1={y}
                      y2={y}
                      stroke="rgba(203, 213, 225, 0.6)"
                      strokeWidth="1"
                    />
                    <text x={padL - 8} y={y + 4} fontSize="10" fill="#64748b" textAnchor="end">
                      {t}
                    </text>
                  </g>
                );
              })}

              <path d={linePath} fill="none" stroke="#ec4899" strokeWidth="2.5" />

              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#ec4899" />
              ))}

              {xTickIndices.map((i) => (
                <text
                  key={i}
                  x={points[i].x}
                  y={chartH - 4}
                  fontSize="10"
                  fill="#64748b"
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
          onClick={() => navigate("/sales")}
          onMouseEnter={() => setHoveredChartCard("transactions")}
          onMouseLeave={() => setHoveredChartCard(null)}
          style={lightGlassCardStyle(hoveredChartCard === "transactions")}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
            Recent Transactions
          </h2>
          {recentTransactions.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>No sales recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.9)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.9)",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FontAwesomeIcon icon={faClock} style={{ width: 13, height: 13, color: "#64748b" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                        {t.products.join(", ")}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{t.timeLabel}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>
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