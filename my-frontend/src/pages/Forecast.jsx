import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function Forecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // New controls matching the design reference
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [productsList, setProductsList] = useState([]);
  const [method, setMethod] = useState("Exp Smoothing");
  const [forecastPeriod, setForecastPeriod] = useState("7 days");

  useEffect(() => {
    // Load products list for the selector
    axios.get(`${API_URL}/inventory`)
      .then(res => setProductsList(res.data))
      .catch(() => {});

    loadForecast();
  }, [method, forecastPeriod, selectedProduct]);

  const loadForecast = () => {
    setLoading(true);
    axios.get(`${API_URL}/forecast`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || "Failed to load forecast.");
        setLoading(false);
      });
  };

  const lightGlassPanelStyle = {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: "1.5rem",
    boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.08), 0 2px 4px 0 rgba(255, 255, 255, 0.5) inset",
    marginBottom: "1.5rem",
  };

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(203, 213, 225, 0.8)",
    background: "rgba(255, 255, 255, 0.8)",
    color: "#0f172a",
    fontSize: 14,
    outline: "none",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
  };

  if (loading && !data) {
    return (
      <div style={{ width: "100%", padding: "3rem", textAlign: "center", color: "#64748b", background: "#e4e7eb", minHeight: "100vh" }}>
        Generating forecast...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100%", padding: "1.5rem", background: "#e4e7eb", minHeight: "100vh", boxSizing: "border-box" }}>
        <div style={{ background: "rgba(249, 115, 22, 0.12)", border: "1px solid rgba(249, 115, 22, 0.3)", color: "#c2410c", padding: "1rem", borderRadius: 14, fontWeight: 600 }}>
          {error}
        </div>
      </div>
    );
  }

  const chartData = data ? [
    ...data.historical.map(d => ({
      date: d.date,
      actual: d.amount,
      forecast: null
    })),
    ...data.forecast.map(d => ({
      date: d.date,
      actual: null,
      forecast: d.amount
    }))
  ] : [];

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
      {/* Header matching the reference */}
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
          Sales Forecasting
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
          Predict future sales to make smarter decisions
        </p>
      </div>

      {/* Generate Forecast Control Panel */}
      <div style={lightGlassPanelStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Generate Forecast</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            >
              <option value="all">All Products (Overall Store)</option>
              {productsList.map(p => (
                <option key={p.id} value={p.product}>{p.product}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Method</label>
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.7)", borderRadius: 12, padding: 4, border: "1px solid rgba(203, 213, 225, 0.8)" }}>
              <button
                onClick={() => setMethod("Moving Avg")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: method === "Moving Avg" ? "#0f172a" : "transparent",
                  color: method === "Moving Avg" ? "#fff" : "#334155",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Moving Avg
              </button>
              <button
                onClick={() => setMethod("Exp Smoothing")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: method === "Exp Smoothing" ? "#0f172a" : "transparent",
                  color: method === "Exp Smoothing" ? "#fff" : "#334155",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Exp Smoothing
              </button>
            </div>
          </div>

          <div style={{ width: 160 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Forecast Period</label>
            <select
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            >
              <option value="7 days">7 days</option>
              <option value="14 days">14 days</option>
              <option value="30 days">30 days</option>
            </select>
          </div>

          <button
            onClick={loadForecast}
            style={{
              padding: "11px 24px",
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13.5,
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.25)",
            }}
          >
            Generate Forecast
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Accuracy Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: "1.5rem" }}>
            <div style={lightGlassPanelStyle}>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Method</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>{method}</p>
            </div>
            <div style={lightGlassPanelStyle}>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>MAE</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#0284c7", margin: 0 }}>₱ {data.mae}</p>
            </div>
            <div style={lightGlassPanelStyle}>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>RMSE</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#0284c7", margin: 0 }}>₱ {data.rmse}</p>
            </div>
          </div>

          {/* Chart Container */}
          <div style={lightGlassPanelStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Actual vs Forecasted Sales</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.6)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(val) => val ? `₱ ${val.toLocaleString()}` : "—"}
                  contentStyle={{ background: "rgba(255, 255, 255, 0.9)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 1)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#0284c7" }}
                  connectNulls={false}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#16a34a" }}
                  connectNulls={false}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Table Container */}
          <div style={{ ...lightGlassPanelStyle, overflow: "hidden", padding: 0 }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(203, 213, 225, 0.8)", background: "rgba(255, 255, 255, 0.6)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Upcoming Projections</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.4)", borderBottom: "1px solid rgba(203, 213, 225, 0.8)" }}>
                    {["Date", "Forecasted Amount (₱)"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.forecast.map((row, i) => (
                    <tr
                      key={row.date}
                      style={{
                        background: i % 2 === 0 ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)",
                        borderBottom: "1px solid rgba(203, 213, 225, 0.5)",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{row.date}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#16a34a" }}>₱ {row.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}