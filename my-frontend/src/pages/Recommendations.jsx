import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb, faCircleCheck } from "@fortawesome/free-solid-svg-icons";

const PRIORITY_STYLES = {
  urgent: { badge: "URGENT", badgeBg: "#ef4444", border: "#ef4444", btnColor: "#ef4444" },
  soon: { badge: "SOON", badgeBg: "#f59e0b", border: "#f59e0b", btnColor: "#f59e0b" },
  monitor: { badge: "MONITOR", badgeBg: "#eab308", border: "#eab308", btnColor: "#0f172a" },
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
    axios.get("http://127.0.0.1:5000/recommendations")
      .then(res => setRecs(res.data))
      .catch(() => setError("Couldn't load recommendations. Is the server running?"))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Recommendations</h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: "1.5rem" }}>
        Rule-based suggestions generated from your real sales speed, stock levels, and expiry dates.
      </p>

      {loading ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "3rem 0" }}>Analyzing your data...</p>
      ) : error ? (
        <p style={{ color: "#ef4444", textAlign: "center", padding: "3rem 0" }}>{error}</p>
      ) : recs.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 14, padding: "3rem", textAlign: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#16a34a", width: 32, height: 32, marginBottom: 12 }} />
          <p style={{ color: "#0f172a", fontWeight: 600, margin: 0 }}>Nothing needs attention right now</p>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            All products are stocked, fresh, and selling at a healthy pace.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16
        }}>
          {recs.map((r, i) => {
            const style = PRIORITY_STYLES[r.priority];
            return (
              <div key={`${r.inventory_id}-${i}`} style={{
                background: "#0f172a",
                borderLeft: `4px solid ${style.border}`,
                borderRadius: 12,
                padding: "1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    background: style.badgeBg, color: "#fff", fontSize: 11, fontWeight: 700,
                    padding: "3px 8px", borderRadius: 5, letterSpacing: 0.5
                  }}>
                    {style.badge}
                  </span>
                  <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                    {r.action}
                  </span>
                </div>

                <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>
                  {r.product}
                </p>
                <p style={{ color: "#cbd5e1", fontSize: 13, margin: "0 0 2px" }}>{r.detail}</p>
                <p style={{ color: "#94a3b8", fontSize: 12.5, margin: "0 0 16px" }}>Reason: {r.reason}</p>

                <button style={{
                  width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                  background: "#fff", color: style.btnColor, fontWeight: 700, fontSize: 13,
                  cursor: "pointer"
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
