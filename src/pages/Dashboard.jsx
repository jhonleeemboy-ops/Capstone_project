import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoneyBillWave,
  faBoxOpen,
  faTriangleExclamation,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expiry, setExpiry] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("http://127.0.0.1:5000/sales"),
      axios.get("http://127.0.0.1:5000/inventory"),
      axios.get("http://127.0.0.1:5000/expiry"),
      axios.get("http://127.0.0.1:5000/forecast").catch(() => null),
    ]).then(([s, inv, exp, f]) => {
      setSales(s.data);
      setInventory(inv.data);
      setExpiry(exp.data);
      if (f) setForecast(f.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <p style={{ color: "#94a3b8", fontSize: 15 }}>Loading dashboard...</p>
    </div>
  );

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);
  const lowStockItems = inventory.filter(i => i.stock <= i.reorder_level);
  const expiredItems = expiry.filter(i => i.status === "Expired");
  const expiringSoon = expiry.filter(i => i.status === "Critical" || i.status === "Expiring soon");
  const forecastTotal = forecast ? forecast.forecast.reduce((sum, f) => sum + f.amount, 0) : null;

  const cards = [
    {
      label: "Total Sales Today",
      value: `₱ ${totalRevenue.toLocaleString()}`,
      sub: `+${sales.length} sales records`,
      subColor: "#16a34a",
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
      value: forecastTotal ? `₱ ${Math.round(forecastTotal).toLocaleString()}` : "—",
      sub: "Predicted revenue",
      subColor: "#64748b",
      icon: faChartLine,
      iconBg: "#e0f2fe",
      iconColor: "#0284c7",
    },
  ];

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: "1.5rem" }}>
        Welcome back, overview of your sales, inventory, and forecast
      </p>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: "2rem" }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: "#fff",
            borderRadius: 14,
            padding: "1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {/* Top row: label + icon */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{c.label}</p>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: c.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <FontAwesomeIcon icon={c.icon} style={{ color: c.iconColor, fontSize: 16 }} />
              </div>
            </div>

            {/* Value */}
            <p style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0 }}>{c.value}</p>

            {/* Sub badge or text */}
            <span style={{
              fontSize: 12,
              color: c.subColor,
              background: c.subBg || "transparent",
              padding: c.subBg ? "3px 10px" : 0,
              borderRadius: c.subBg ? 99 : 0,
              alignSelf: "flex-start",
            }}>
              {c.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>⚠️ Low Stock Alerts</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lowStockItems.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fafafa", borderRadius: 10, fontSize: 14 }}>
                <span style={{ fontWeight: 500 }}>{item.product}</span>
                <span style={{ display: "flex", gap: 12, color: "#888" }}>
                  <span>Stock: <b style={{ color: "#ef4444" }}>{item.stock}</b></span>
                  <span>Min: {item.reorder_level}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Alerts */}
      {(expiredItems.length + expiringSoon.length) > 0 && (
        <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>🕐 Expiry Alerts</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...expiredItems, ...expiringSoon].map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fafafa", borderRadius: 10, fontSize: 14 }}>
                <span style={{ fontWeight: 500 }}>{item.product}</span>
                <span style={{
                  background: item.status === "Expired" ? "#fee2e2" : "#ffedd5",
                  color: item.status === "Expired" ? "#ef4444" : "#f97316",
                  padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500
                }}>
                  {item.status === "Expired" ? "Expired" : `${item.days_left} days left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Summary */}
      <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>Inventory Summary</h2>
        {inventory.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 14 }}>No inventory items yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["Product", "Stock", "Reorder Level", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, i) => {
                const isLow = item.stock <= item.reorder_level;
                const isOut = item.stock === 0;
                const statusLabel = isOut ? "Out of stock" : isLow ? "Low stock" : "OK";
                const statusStyle = {
                  bg: isOut ? "#fee2e2" : isLow ? "#ffedd5" : "#dcfce7",
                  color: isOut ? "#ef4444" : isLow ? "#f97316" : "#16a34a",
                };
                return (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.product}</td>
                    <td style={{ padding: "10px 12px" }}>{item.stock}</td>
                    <td style={{ padding: "10px 12px" }}>{item.reorder_level}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Sales */}
      <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>Recent Transactions</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {["Product", "Amount", "Date"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 5).map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>{s.product}</td>
                <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 600 }}>₱ {Number(s.amount).toLocaleString()}</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>{s.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}