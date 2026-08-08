import { useState } from "react";
import axios from "axios";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    axios.post("http://127.0.0.1:5000/login", { email, password })
      .then(res => {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLogin(res.data.user);
      })
      .catch(err => {
        setError(err.response?.data?.error || "Login failed.");
        setLoading(false);
      });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f5",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: 16,
        padding: "2.5rem",
        width: 380,
        border: "1px solid #eee"
      }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Welcome back</h1>
        <p style={{ color: "#888", fontSize: 13, marginBottom: "2rem" }}>
          Sign in to your Sales DSS
        </p>

        {error && (
          <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            placeholder="admin@brewandbean.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px",
            background: "#378ADD",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: "1.5rem" }}>
          Default: admin@brewandbean.com / admin123
        </p>
      </div>
    </div>
  );
}