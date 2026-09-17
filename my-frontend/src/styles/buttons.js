import { colors, radii, shadows } from "./tokens";

export const buttonDark = {
  padding: "10px 18px",
  background: colors.dark,
  color: "white",
  border: "none",
  borderRadius: radii.md,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13.5,
  boxShadow: shadows.buttonPrimary,
  transition: "all 0.2s",
};

export const buttonDanger = {
  padding: "10px 16px",
  background: colors.danger,
  color: "white",
  border: "none",
  borderRadius: radii.md,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13.5,
  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
  transition: "all 0.2s",
};

export const buttonInfo = {
  padding: "10px 20px",
  background: colors.info,
  color: "white",
  border: "none",
  borderRadius: radii.md,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
};

export const buttonExportDark = (isHovered) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255, 255, 255, 0.08)",
  color: colors.white,
  border: isHovered ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: radii.md,
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
  boxShadow: isHovered ? "0 6px 20px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
});

export const pillButton = (active) => ({
  border: active ? "1px solid rgba(14, 116, 144, 0.4)" : `1px solid ${colors.borderSlate}`,
  background: active ? colors.dark : "rgba(255, 255, 255, 0.7)",
  color: active ? "#fff" : "#334155",
  borderRadius: radii.pill,
  padding: "8px 16px",
  fontSize: 13.5,
  fontWeight: active ? 700 : 600,
  cursor: "pointer",
  boxShadow: active ? "0 4px 12px rgba(15, 23, 42, 0.2)" : "0 2px 6px rgba(0,0,0,0.02)",
  transition: "all 0.2s",
});

export const iconActionButton = (variant) => {
  const map = {
    add: { bg: "rgba(34, 197, 94, 0.1)", color: "#16a34a", border: "rgba(34, 197, 94, 0.3)" },
    reduce: { bg: "rgba(249, 115, 22, 0.1)", color: "#ea580c", border: "rgba(249, 115, 22, 0.3)" },
    delete: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
  };
  const v = map[variant];
  return {
    padding: "6px 12px",
    background: v.bg,
    color: v.color,
    border: `1px solid ${v.border}`,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  };
};