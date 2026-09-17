import { useState } from "react";
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

export default function Sidebar({ user, onLogout, collapsed }) {
  const [hoveredPath, setHoveredPath] = useState(null);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  return (
    <div style={{
      width: collapsed ? 76 : 240,
      height: "100vh",
      position: "sticky",
      top: 0,
      background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(11, 15, 28, 0.95) 100%)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(255, 255, 255, 0.08)",
      padding: collapsed ? "1.5rem 0.75rem" : "1.5rem 1rem",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      flexShrink: 0,
      boxSizing: "border-box",
      boxShadow: "4px 0 24px rgba(0, 0, 0, 0.2)",
      transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden",
    }}>
      {/* Branding */}
      <div style={{
        marginBottom: "1.25rem",
        paddingLeft: collapsed ? 0 : 8,
        textAlign: collapsed ? "center" : "left",
      }}>
        {collapsed ? (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#1e40af",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 15,
            margin: "0 auto",
          }}>
            S
          </div>
        ) : (
          <>
            <p style={{ color: "#ffffff", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>StoreWise</p>
            <p style={{ color: "#64748b", fontSize: 12, margin: 0, fontWeight: 500 }}>Business Manager</p>
          </>
        )}
      </div>

      {/* Nav Links */}
      {links.map(link => {
        const isHovered = hoveredPath === link.to;

        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            title={collapsed ? link.label : undefined}
            onMouseEnter={() => setHoveredPath(link.to)}
            onMouseLeave={() => setHoveredPath(null)}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 12,
              padding: collapsed ? "11px 0" : "11px 14px",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 14,
              color: isActive || isHovered ? "#ffffff" : "#94a3b8",
              background: isActive
                ? "rgba(30, 64, 175, 0.45)"
                : isHovered
                ? "rgba(255, 255, 255, 0.08)"
                : "transparent",
              border: isActive
                ? "1px solid rgba(56, 189, 248, 0.3)"
                : isHovered
                ? "1px solid rgba(255, 255, 255, 0.2)"
                : "1px solid transparent",
              boxShadow: isActive
                ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(255, 255, 255, 0.1) inset"
                : isHovered
                ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                : "none",
              transform: !collapsed && (isHovered || isActive) ? "translateX(3px)" : "translateX(0)",
              fontWeight: isActive ? 700 : 500,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
            })}
          >
            {({ isActive }) => (
              <>
                <FontAwesomeIcon
                  icon={link.icon}
                  style={{ width: 16, color: isActive ? "#38bdf8" : "#94a3b8", flexShrink: 0 }}
                />
                {!collapsed && link.label}
              </>
            )}
          </NavLink>
        );
      })}

      {/* User Profile at Bottom */}
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #1e293b" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
          marginBottom: 12,
          paddingLeft: collapsed ? 0 : 4,
        }}>
          <div
            title={collapsed ? `${user?.name} (${user?.role})` : undefined}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#1e40af",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13,
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div>
              <p style={{ color: "#fff", fontSize: 13, margin: 0, fontWeight: 600 }}>{user?.name}</p>
              <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title={collapsed ? "Sign out" : undefined}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
          style={{
            width: "100%", padding: "10px",
            background: isLogoutHovered ? "rgba(239, 68, 68, 0.12)" : "rgba(255, 255, 255, 0.04)",
            color: isLogoutHovered ? "#ef4444" : "#94a3b8",
            border: isLogoutHovered ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            cursor: "pointer", fontSize: 13,
            fontWeight: 600,
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: collapsed ? 0 : 8,
            boxShadow: isLogoutHovered
              ? "0 4px 12px rgba(239, 68, 68, 0.15)"
              : "0 2px 6px rgba(0, 0, 0, 0.1)",
            transform: isLogoutHovered ? "translateY(-1px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}
