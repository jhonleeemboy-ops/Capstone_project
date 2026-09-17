import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Expiry() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/expiry")
      .then(res => {
        setItems(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatus = (status) => {
    const styles = {
      "Expired":       { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "rgba(239, 68, 68, 0.25)" },
      "Critical":      { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "rgba(239, 68, 68, 0.25)" },
      "Expiring soon": { bg: "rgba(249, 115, 22, 0.1)", color: "#ea580c", border: "rgba(249, 115, 22, 0.25)" },
      "OK":            { bg: "rgba(34, 197, 94, 0.1)", color: "#16a34a", border: "rgba(34, 197, 94, 0.25)" },
    };
    return styles[status] || styles["OK"];
  };

  const expiredCount = items.filter(i => i.status === "Expired").length;
  const criticalCount = items.filter(i => i.status === "Critical").length;
  const soonCount = items.filter(i => i.status === "Expiring soon").length;

  const lightGlassPanelStyle = {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: "1.5rem",
    boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.08), 0 2px 4px 0 rgba(255, 255, 255, 0.5) inset",
  };

  if (loading) {
    return (
      <div style={{ width: "100%", padding: "3rem", textAlign: "center", color: "#64748b", background: "#e4e7eb", minHeight: "100vh" }}>
        Loading...
      </div>
    );
  }

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
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 6,
            letterSpacing: "-0.5px",
          }}
        >
          Expiry Tracking
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
          Monitor product freshness and receive alerts for items nearing expiration
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: "1.5rem" }}>
        <div style={{ ...lightGlassPanelStyle, background: "linear-gradient(135deg, rgba(254, 226, 226, 0.8) 0%, rgba(254, 202, 202, 0.9) 100%)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 4, fontWeight: 700 }}>Expired</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", margin: 0 }}>{expiredCount}</p>
        </div>
        <div style={{ ...lightGlassPanelStyle, background: "linear-gradient(135deg, rgba(254, 243, 199, 0.8) 0%, rgba(254, 215, 170, 0.9) 100%)", border: "1px solid rgba(249, 115, 22, 0.3)" }}>
          <p style={{ fontSize: 13, color: "#ea580c", marginBottom: 4, fontWeight: 700 }}>Expiring within 7 days</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#ea580c", margin: 0 }}>{criticalCount + soonCount}</p>
        </div>
        <div style={{ ...lightGlassPanelStyle, background: "linear-gradient(135deg, rgba(220, 252, 231, 0.8) 0%, rgba(187, 247, 208, 0.9) 100%)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
          <p style={{ fontSize: 13, color: "#16a34a", marginBottom: 4, fontWeight: 700 }}>OK</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", margin: 0 }}>{items.filter(i => i.status === "OK").length}</p>
        </div>
      </div>

      {/* Alert banner */}
      {(expiredCount + criticalCount) > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#dc2626",
          padding: "12px 16px",
          borderRadius: 14,
          marginBottom: "1.5rem",
          fontSize: 14,
          fontWeight: 600,
          backdropFilter: "blur(10px)",
        }}>
          {expiredCount > 0 && <span>🚨 {expiredCount} item(s) already expired. </span>}
          {criticalCount > 0 && <span>⚠️ {criticalCount} item(s) expiring within 3 days!</span>}
        </div>
      )}

      {/* Expiry Table Container */}
      <div style={{ ...lightGlassPanelStyle, overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.6)", borderBottom: "1px solid rgba(203, 213, 225, 0.8)" }}>
                {["Product", "Stock", "Expiry Date", "Days Left", "Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2.5rem", color: "#64748b", textAlign: "center" }}>
                    No items with expiry dates. Add expiry dates in the Inventory page!
                  </td>
                </tr>
              ) : (
                items.map((item, i) => {
                  const s = getStatus(item.status);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: i % 2 === 0 ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)",
                        borderBottom: "1px solid rgba(203, 213, 225, 0.5)",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{item.product}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{item.stock}</td>
                      <td style={{ padding: "12px 16px" }}>{item.expiry_date}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: item.days_left < 0 ? "#ef4444" : "#1e293b" }}>
                        {item.days_left < 0 ? "Expired" : `${item.days_left} days`}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: s.bg,
                          color: s.color,
                          border: `1px solid ${s.border}`,
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: "inline-block",
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}