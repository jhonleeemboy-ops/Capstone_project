import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faCartShopping,
  faBoxesStacked,
  faChartLine,
  faLightbulb,
  faChartBar,
  faClock,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

const links = [
  { to: "/", label: "Dashboard", icon: faGauge },
  { to: "/pos", label: "POS", icon: faCartShopping },
  { to: "/inventory", label: "Inventory", icon: faBoxesStacked },
  { to: "/forecast", label: "Forecasts", icon: faChartLine },
  { to: "/recommendations", label: "Recommendations", icon: faLightbulb },
  { to: "/sales", label: "Reports", icon: faChartBar },
  { to: "/expiry", label: "Expiry Tracking", icon: faClock },
];

export default function Sidebar({ user, onLogout }) {
  return (
    <div style={{
      width: 220,
      minHeight: "100vh",
      background: "#0f172a",
      padding: "1.5rem 1rem",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      flexShrink: 0,
    }}>
      {/* Branding */}
      <div style={{ marginBottom: "1.5rem", paddingLeft: 8 }}>
        <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>StoreWise</p>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Business Manager</p>
      </div>

      {/* Nav Links */}
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            color: isActive ? "#fff" : "#94a3b8",
            background: isActive ? "#1e40af" : "transparent",
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <FontAwesomeIcon icon={link.icon} style={{ width: 16 }} />
          {link.label}
        </NavLink>
      ))}

      {/* User Profile at Bottom */}
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#1e40af", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14,
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color: "#fff", fontSize: 13, margin: 0, fontWeight: 500 }}>{user?.name}</p>
            <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "8px",
            background: "transparent", color: "#94a3b8",
            border: "1px solid #1e293b", borderRadius: 6,
            cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
          }}
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          Sign out
        </button>
      </div>
    </div>
  );
}