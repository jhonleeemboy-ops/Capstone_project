import { useState, useEffect } from "react";
import axios from "axios";

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
      "Expired":       { bg: "#FCEBEB", color: "#A32D2D" },
      "Critical":      { bg: "#FCEBEB", color: "#A32D2D" },
      "Expiring soon": { bg: "#FAEEDA", color: "#854F0B" },
      "OK":            { bg: "#EAF3DE", color: "#3B6D11" },
    };
    return styles[status] || styles["OK"];
  };

  const expiredCount = items.filter(i => i.status === "Expired").length;
  const criticalCount = items.filter(i => i.status === "Critical").length;
  const soonCount = items.filter(i => i.status === "Expiring soon").length;

  if (loading) return <p style={{ color: "#888" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, marginBottom: "1.5rem" }}>Expiry Tracking</h1>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <div style={{ background: "#FCEBEB", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 12, color: "#A32D2D", marginBottom: 4 }}>Expired</p>
          <p style={{ fontSize: 26, fontWeight: 500, color: "#A32D2D" }}>{expiredCount}</p>
        </div>
        <div style={{ background: "#FAEEDA", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 12, color: "#854F0B", marginBottom: 4 }}>Expiring within 7 days</p>
          <p style={{ fontSize: 26, fontWeight: 500, color: "#854F0B" }}>{criticalCount + soonCount}</p>
        </div>
        <div style={{ background: "#EAF3DE", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 12, color: "#3B6D11", marginBottom: 4 }}>OK</p>
          <p style={{ fontSize: 26, fontWeight: 500, color: "#3B6D11" }}>{items.filter(i => i.status === "OK").length}</p>
        </div>
      </div>

      {/* Alert banner */}
      {(expiredCount + criticalCount) > 0 && (
        <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: 8, marginBottom: "1.5rem", fontSize: 14 }}>
          {expiredCount > 0 && <span>{expiredCount} item(s) already expired. </span>}
          {criticalCount > 0 && <span>{criticalCount} item(s) expiring within 3 days!</span>}
        </div>
      )}

      {/* Expiry Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              {["Product", "Stock", "Expiry Date", "Days Left", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #eee", color: "#888", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "1rem", color: "#aaa", textAlign: "center" }}>No items with expiry dates. Add expiry dates in the Inventory page!</td></tr>
            ) : (
              items.map((item, i) => {
                const s = getStatus(item.status);
                return (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px" }}>{item.product}</td>
                    <td style={{ padding: "10px 14px" }}>{item.stock}</td>
                    <td style={{ padding: "10px 14px" }}>{item.expiry_date}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {item.days_left < 0 ? "Expired" : `${item.days_left} days`}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 99, fontSize: 12 }}>
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
  );
}