import React from "react";

/** Card container with consistent panel styling. */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-edge bg-panel/70 p-5 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-subtle">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/** Loading skeleton rows. */
export function LoadingState({ rows = 4, label = "Loading…" }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
      <p className="text-sm text-subtle">{label}</p>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Empty state with an icon and helpful copy. */
export function EmptyState({
  title,
  hint,
  icon = "◎",
}: {
  title: string;
  hint?: string;
  icon?: string;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-edge py-12 text-center">
      <div className="mb-2 text-3xl text-subtle">{icon}</div>
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-subtle">{hint}</p>}
    </div>
  );
}

/** Error state, specialised for DB-unreachable but reusable. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 p-5" role="alert">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-danger/20 text-danger">
          !
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm text-subtle">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 rounded-lg border border-edge bg-panelalt px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Colour-coded risk badge based on a 0-100 score. */
export function RiskBadge({ score }: { score: number }) {
  const tier = score >= 65 ? "high" : score >= 40 ? "medium" : "low";
  const styles = {
    high: "bg-danger/15 text-danger border-danger/30",
    medium: "bg-warn/15 text-warn border-warn/30",
    low: "bg-ok/15 text-ok border-ok/30",
  }[tier];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score} · {tier}
    </span>
  );
}

/** Small labelled stat. */
export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-edge bg-panel/60 px-4 py-3">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-subtle">{label}</div>
    </div>
  );
}

/** Node-type colour used consistently across the app. */
export const TYPE_COLORS: Record<string, string> = {
  Supplier: "#5b8cff",
  Component: "#3ecf8e",
  Product: "#f5a524",
  Facility: "#c084fc",
  Region: "#38bdf8",
};
