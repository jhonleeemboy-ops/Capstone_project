import { colors, radii, shadows } from "./tokens";

export const lightGlassPanel = {
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${colors.borderLight}`,
  borderRadius: radii.xl,
  padding: "1.5rem",
  boxShadow: shadows.glassPanel,
};

export const lightGlassPanelSpaced = {
  ...lightGlassPanel,
  marginBottom: "1.5rem",
};

export const lightGlassCard = (isHovered) => ({
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: isHovered ? "1px solid rgba(14, 116, 144, 0.4)" : `1px solid ${colors.borderLight}`,
  borderRadius: 20,
  padding: "1.25rem",
  boxShadow: isHovered ? shadows.glassPanelHover : shadows.glassPanel,
  transform: isHovered ? "translateY(-3px)" : "translateY(0)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
});

export const lightGlassIconBox = {
  width: 38,
  height: 38,
  borderRadius: 12,
  background: "rgba(255, 255, 255, 0.8)",
  border: `1px solid ${colors.borderLight}`,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const darkGlassCard = {
  background: "linear-gradient(135deg, #071325 0%, #0c213f 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: radii.xl,
  padding: "1.5rem",
  marginBottom: "1.5rem",
  boxShadow: shadows.darkCard,
};

export const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.4)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

export const modalPanel = {
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(241, 245, 249, 0.98) 100%)",
  backdropFilter: "blur(20px)",
  border: `1px solid ${colors.borderLight}`,
  padding: "1.75rem",
  borderRadius: radii.xl,
  width: 340,
  boxShadow: "0 20px 50px rgba(31, 38, 135, 0.25)",
};

export const alertBanner = (variant = "danger") => {
  const map = {
    danger: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", color: "#dc2626" },
    warning: { bg: "rgba(249, 115, 22, 0.12)", border: "rgba(249, 115, 22, 0.3)", color: "#c2410c" },
  };
  const v = map[variant];
  return {
    background: v.bg,
    border: `1px solid ${v.border}`,
    color: v.color,
    padding: "12px 16px",
    borderRadius: 14,
    marginBottom: "1.5rem",
    fontSize: 14,
    fontWeight: 600,
    backdropFilter: "blur(10px)",
  };
};