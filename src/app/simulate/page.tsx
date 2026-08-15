"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { ImpactResult, SupplierSummary } from "@/lib/types";
import { Card, EmptyState, ErrorState, LoadingState, SectionTitle } from "@/components/ui";

type Mode = "supplier" | "region";
interface RegionRow {
  id: string;
  name: string;
  supplierCount: number;
}

export default function SimulatePage() {
  // Start from deterministic defaults so server and first client render match
  // (no hydration mismatch); adopt any URL params after mount.
  const [mode, setMode] = useState<Mode>("supplier");
  const [selected, setSelected] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  const suppliers = useApi<SupplierSummary[]>("/api/suppliers");
  const regions = useApi<RegionRow[]>("/api/regions");

  const impactUrl = selected ? `/api/impact?type=${mode}&id=${encodeURIComponent(selected)}` : null;
  const impact = useApi<ImpactResult>(impactUrl);

  // On mount: read shareable deep-link params from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("type") === "region") setMode("region");
    const id = params.get("id");
    if (id) setSelected(id);
    setHydrated(true);
  }, []);

  // Keep the URL in sync with the current selection (shareable deep links).
  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    if (selected) {
      url.searchParams.set("type", mode);
      url.searchParams.set("id", selected);
    } else {
      url.searchParams.delete("type");
      url.searchParams.delete("id");
    }
    window.history.replaceState(null, "", url.toString());
  }, [mode, selected, hydrated]);

  function switchMode(next: Mode) {
    setMode(next);
    setSelected("");
  }

  const options = mode === "supplier" ? suppliers.data ?? [] : regions.data ?? [];

  return (
    <div className="space-y-6 fade-in">
      <SectionTitle
        title="Disruption Simulator"
        subtitle="Take a supplier or a whole region offline and trace the blast radius across every product."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Controls */}
        <Card className="h-fit">
          <div className="mb-4 inline-flex rounded-lg border border-edge bg-canvas p-1 text-sm">
            <button
              onClick={() => switchMode("supplier")}
              className={`rounded-md px-3 py-1.5 transition ${
                mode === "supplier" ? "bg-panelalt text-ink" : "text-subtle hover:text-ink"
              }`}
            >
              Supplier
            </button>
            <button
              onClick={() => switchMode("region")}
              className={`rounded-md px-3 py-1.5 transition ${
                mode === "region" ? "bg-panelalt text-ink" : "text-subtle hover:text-ink"
              }`}
            >
              Region
            </button>
          </div>

          <label className="mb-1.5 block text-xs uppercase tracking-wide text-subtle">
            {mode === "supplier" ? "Disrupt supplier" : "Disrupt region"}
          </label>

          {(mode === "supplier" ? suppliers.loading : regions.loading) ? (
            <LoadingState rows={1} label="Loading options…" />
          ) : (mode === "supplier" ? suppliers.error : regions.error) ? (
            <ErrorState
              title="Couldn’t load options"
              message={(mode === "supplier" ? suppliers.error : regions.error) as string}
              onRetry={mode === "supplier" ? suppliers.reload : regions.reload}
            />
          ) : (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg border border-edge bg-canvas px-3 py-2 text-sm outline-none transition focus:border-brand"
            >
              <option value="">— choose one —</option>
              {mode === "supplier"
                ? (options as SupplierSummary[]).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country}) · risk {s.riskScore}
                    </option>
                  ))
                : (options as RegionRow[]).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.supplierCount} suppliers
                    </option>
                  ))}
            </select>
          )}

          <p className="mt-3 text-xs leading-relaxed text-subtle">
            The simulation walks{" "}
            <code className="rounded bg-canvas px-1 py-0.5 text-[11px] text-ink">
              SUPPLIES → DEPENDS_ON* → PART_OF
            </code>{" "}
            — a variable-length traversal that finds the shortest path from the
            disruption to each finished product.
          </p>
        </Card>

        {/* Results */}
        <div className="min-h-[300px]">
          {!selected ? (
            <EmptyState
              icon="◎"
              title="No simulation running"
              hint="Pick a supplier or region on the left to see which products would be impacted and how many hops upstream the disruption originates."
            />
          ) : impact.loading ? (
            <Card>
              <LoadingState rows={5} label="Tracing dependency paths through the graph…" />
            </Card>
          ) : impact.error ? (
            <ErrorState
              title={impact.code === "DB_UNAVAILABLE" ? "Database unavailable" : "Simulation failed"}
              message={impact.error}
              onRetry={impact.reload}
            />
          ) : impact.data ? (
            <ImpactReport result={impact.data} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ImpactReport({ result }: { result: ImpactResult }) {
  const pct = result.totalProducts
    ? Math.round((result.impactedProducts.length / result.totalProducts) * 100)
    : 0;

  const grouped = useMemo(() => {
    const byHop = new Map<number, typeof result.impactedProducts>();
    for (const p of result.impactedProducts) {
      const arr = byHop.get(p.hops) ?? [];
      arr.push(p);
      byHop.set(p.hops, arr);
    }
    return [...byHop.entries()].sort((a, b) => a[0] - b[0]);
  }, [result]);

  if (result.impactedProducts.length === 0) {
    return (
      <EmptyState
        icon="✓"
        title={`No products depend on ${result.sourceName}`}
        hint="This part of the supply chain is isolated from finished products, or is fully redundant."
      />
    );
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Summary banner */}
      <Card className="border-warn/30 bg-warn/5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-subtle">Disruption source</div>
            <div className="text-lg font-semibold">{result.sourceName}</div>
            <div className="text-xs text-subtle capitalize">{result.sourceType}</div>
          </div>
          <div className="h-10 w-px bg-edge" />
          <Metric value={result.impactedProducts.length} label="Products at risk" accent />
          <Metric value={`${pct}%`} label="of catalogue" />
          <Metric value={result.impactedComponentCount} label="Components involved" />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-subtle">
            <span>Catalogue exposure</span>
            <span>
              {result.impactedProducts.length}/{result.totalProducts}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warn to-danger transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Impacted products grouped by hop distance */}
      {grouped.map(([hops, products]) => (
        <Card key={hops}>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand/15 px-2 text-xs font-semibold text-brand">
              {hops} hop{hops === 1 ? "" : "s"}
            </span>
            <span className="text-sm text-subtle">
              {hops <= 2 ? "direct exposure" : "deep upstream dependency"}
            </span>
          </div>
          <ul className="divide-y divide-edge">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-2.5">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-subtle">{p.category}</div>
                </div>
                <div className="hidden max-w-[50%] flex-wrap justify-end gap-1 sm:flex">
                  {p.viaComponents.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-edge bg-canvas px-2 py-0.5 text-[11px] text-subtle"
                    >
                      via {c}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function Metric({
  value,
  label,
  accent = false,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className={`text-2xl font-semibold tabular-nums ${accent ? "text-danger" : "text-ink"}`}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide text-subtle">{label}</div>
    </div>
  );
}
