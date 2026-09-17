import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export default function Header({ onToggleSidebar }) {
  return (
    <div style={{
      height: 56,
      display: "flex",
      alignItems: "center",
      padding: "0 1.25rem",
      borderBottom: "1px solid #e2e8f0",
      background: "#fff",
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>
      <button
        onClick={onToggleSidebar}
        title="Toggle sidebar"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          color: "#0f172a",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
        }}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
    </div>
  );
}
