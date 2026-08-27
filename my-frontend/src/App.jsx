import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Forecast from "./pages/Forecast";
import Expiry from "./pages/Expiry";
import POS from "./pages/POS";
import Recommendations from "./pages/Recommendations";


// Placeholder pages
// const Recommendations = () => (
//   <div style={{ padding: "2rem" }}>
//     <h1>Recommendations — Coming Soon</h1>
//   </div>
// );


export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });


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
          background: "#f1f5f9",
          minHeight: "100vh"
        }}
      >
        <Sidebar user={user} onLogout={handleLogout} />

        <div
          style={{
            flex: 1,
            padding: "2rem",
            overflowY: "auto"
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
    </BrowserRouter>
  );
}