import React from "react";

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CLASSES: Record<string, string> = {
  created: "badge-gray", ontology_generated: "badge-blue", graph_building: "badge-yellow",
  graph_completed: "badge-green", completed: "badge-green", failed: "badge-red",
  pending: "badge-gray", processing: "badge-yellow", preparing: "badge-yellow",
  ready: "badge-accent", running: "badge-green", stopped: "badge-gray",
  paused: "badge-yellow", generating: "badge-yellow", idle: "badge-gray",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_CLASSES[status] ?? "badge-gray"}`}>{status}</span>;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "accent", pulse = false }: { value: number; color?: string; pulse?: boolean }) {
  return (
    <div className="progress-bar">
      <div className={`progress-fill ${color === "blue" ? "blue" : ""} ${pulse ? "pulse" : ""}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text3)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text2)" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Toast strip ─────────────────────────────────────────────────────────────
type ToastType = "info" | "ok" | "error" | "warn";
export function Toast({ type, msg }: { type: ToastType; msg: string }) {
  const cls = { info: "toast-info", ok: "toast-ok", error: "toast-error", warn: "toast-warn" }[type];
  const icon = { info: "ℹ", ok: "✓", error: "✕", warn: "⚠" }[type];
  return <div className={`toast-strip ${cls}`}><span>{icon}</span><span>{msg}</span></div>;
}

// ─── Section divider ──────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "var(--text3)", marginBottom: 10 }}>
      {children}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-val" style={{ color: color ?? "var(--text)" }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}