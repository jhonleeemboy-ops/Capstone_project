import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

const PRIORITY_STYLES = {
  urgent: { badge: "URGENT", badgeBg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", accent: "#ef4444" },
  soon: { badge: "SOON", badgeBg: "rgba(249, 115, 22, 0.1)", border: "#f97316", accent: "#ea580c" },
  monitor: { badge: "MONITOR", badgeBg: "rgba(234, 179, 8, 0.1)", border: "#eab308", accent: "#0f172a" },
};

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = () => {
    setLoading(true);
    setError("");
    axios.get(`${API_URL}/recommendations`)
      .then(res => setRecs(res.data))
      .catch(() => setError("Couldn't load recommendations. Is the server running?"))
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
          Recommendations
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
          Rule-based suggestions generated from your real sales speed, stock levels, and expiry dates.
        </p>
      </div>

      {loading ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: "3rem 0" }}>Analyzing your data...</p>
      ) : error ? (
        <p style={{ color: "#ef4444", textAlign: "center", padding: "3rem 0" }}>{error}</p>
      ) : recs.length === 0 ? (
        <div style={{
          ...lightGlassPanelStyle,
          textAlign: "center",
          padding: "3rem",
          maxWidth: 600,
          margin: "0 auto",
        }}>
          <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#16a34a", width: 36, height: 36, marginBottom: 12 }} />
          <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, margin: 0 }}>Nothing needs attention right now</p>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            All products are stocked, fresh, and selling at a healthy pace.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {recs.map((r, i) => {
            const style = PRIORITY_STYLES[r.priority];
            return (
              <div key={`${r.inventory_id}-${i}`} style={{
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.9)",
                borderLeft: `5px solid ${style.border}`,
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(255, 255, 255, 0.8) inset",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    background: style.badgeBg,
                    color: style.accent,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 6,
                    letterSpacing: 0.5,
                    border: `1px solid ${style.border}40`,
                  }}>
                    {style.badge}
                  </span>
                  <span style={{ color: "#475569", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                    {r.action}
                  </span>
                </div>

                <p style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>
                  {r.product}
                </p>
                <p style={{ color: "#334155", fontSize: 13.5, fontWeight: 600, margin: "0 0 2px" }}>{r.detail}</p>
                <p style={{ color: "#64748b", fontSize: 12.5, fontWeight: 500, margin: "0 0 12px" }}>Reason: {r.reason}</p>

                <button style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: style.accent,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                  boxShadow: `0 4px 12px ${style.accent}40`,
                  transition: "all 0.2s",
                }}>
                  {r.action === "Order Now" ? "Order Now" : r.action === "Apply Discount" ? "Apply" : "View"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}