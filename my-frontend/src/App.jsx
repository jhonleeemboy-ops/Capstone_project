import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Forecast from "./pages/Forecast";
import Expiry from "./pages/Expiry";
import POS from "./pages/POS";
import Recommendations from "./pages/Recommendations";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [collapsed, setCollapsed] = useState(false);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <div
        style={{
          display: "flex",
          fontFamily: "sans-serif",
          background: "#ffffff", // Changed background to white
          minHeight: "100vh",
          color: "#0f172a", // Adjusted text color for readability on white background if needed
        }}
      >
        <Sidebar user={user} onLogout={handleLogout} collapsed={collapsed} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            background: "#ffffff", // Ensures scroll area stays white
          }}
        >
          <Header onToggleSidebar={() => setCollapsed((prev) => !prev)} />

          <div style={{ flex: 1, padding: "0" }}>
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/expiry" element={<Expiry />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
