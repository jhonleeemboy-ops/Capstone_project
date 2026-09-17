import { colors } from "./tokens";

export const pageWrapper = {
  width: "100%",
  color: colors.textPrimary,
  fontFamily: "inherit",
  padding: "1.5rem",
  background: colors.pageBg,
  minHeight: "100vh",
  boxSizing: "border-box",
};

export const pageLoading = {
  width: "100%",
  padding: "3rem",
  textAlign: "center",
  color: colors.textMuted,
  background: colors.pageBg,
  minHeight: "100vh",
};

export const headerBlock = { marginBottom: "2rem" };

export const headerBlockCentered = { textAlign: "center", marginBottom: "2.5rem" };

export const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "2rem",
  flexWrap: "wrap",
  gap: 12,
};

export const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1.25rem",
  flexWrap: "wrap",
  gap: 12,
};

export const gridAutoFit = (min = 240, gap = 20) => ({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
  gap,
});