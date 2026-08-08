import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function Forecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/forecast")
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || "Failed to load forecast.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ color: "#888" }}>Generating forecast...</p>;
  if (error) return (
    <div style={{ background: "#FAEEDA", color: "#854F0B", padding: "1rem", borderRadius: 8 }}>
      {error}
    </div>
  );

  // Combine historical + forecast for chart
  const chartData = [
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
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Sales Forecast</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: "1.5rem" }}>
        Method: {data.method}
      </p>

      {/* Accuracy Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "2rem" }}>
        <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Method</p>
          <p style={{ fontSize: 14, fontWeight: 500 }}>Exp. Smoothing</p>
        </div>
        <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>MAE</p>
          <p style={{ fontSize: 22, fontWeight: 500 }}>₱ {data.mae}</p>
        </div>
        <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>RMSE</p>
          <p style={{ fontSize: 22, fontWeight: 500 }}>₱ {data.rmse}</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ border: "1px solid #eee", borderRadius: 10, padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 15, marginBottom: "1rem" }}>Actual vs Forecasted Sales</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => val ? `₱ ${val.toLocaleString()}` : "—"} />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#378ADD"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
              name="Actual"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#3B6D11"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              connectNulls={false}
              name="Forecast"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              {["Date", "Forecasted Amount (₱)"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #eee", color: "#888", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.forecast.map((row, i) => (
              <tr key={row.date} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ padding: "10px 14px" }}>{row.date}</td>
                <td style={{ padding: "10px 14px" }}>₱ {row.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}