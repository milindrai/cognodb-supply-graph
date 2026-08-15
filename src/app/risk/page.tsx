"use client";

import { useApi } from "@/lib/useApi";
import type { SpofComponent } from "@/lib/types";
import { Card, EmptyState, ErrorState, LoadingState, SectionTitle } from "@/components/ui";

export default function RiskPage() {
  const { data, error, code, loading, reload } = useApi<SpofComponent[]>("/api/spof");

  return (
    <div className="space-y-6 fade-in">
      <SectionTitle
        title="Single Points of Failure"
        subtitle="Components sourced from exactly one supplier — ranked by how many products they put at risk."
      />

      <Card className="border-brand/20 bg-brand/5">
        <p className="text-sm leading-relaxed text-subtle">
          A <span className="text-ink">single point of failure</span> is a component with only one
          qualified supplier: if that supplier fails, there is no fallback. This is a{" "}
          <span className="text-ink">degree-1 filter</span> on the{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11px] text-ink">SUPPLIES</code>{" "}
          relationship, followed by a variable-length walk to every dependent product — a natural
          graph query that is a multi-join headache in SQL.
        </p>
      </Card>

      {loading ? (
        <Card>
          <LoadingState rows={5} label="Scanning the graph for degree-1 components…" />
        </Card>
      ) : error ? (
        <ErrorState
          title={code === "DB_UNAVAILABLE" ? "Database unavailable" : "Couldn’t load risks"}
          message={error}
          onRetry={reload}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No single points of failure"
          hint="Every component in the graph is sourced from at least two suppliers."
        />
      ) : (
        <div className="space-y-3">
          {data.map((c, i) => (
            <Card key={c.componentId} className="transition hover:border-brand/40">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger/15 text-sm font-semibold text-danger">
                    #{i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{c.componentName}</h3>
                    <p className="text-xs text-subtle">{c.category}</p>
                    <p className="mt-1 text-sm text-subtle">
                      Sole supplier:{" "}
                      <span className="text-ink">{c.soleSupplier}</span>{" "}
                      <span className="text-subtle">({c.soleSupplierCountry})</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums text-danger">
                    {c.dependentProductCount}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-subtle">
                    products at risk
                  </div>
                </div>
              </div>

              {c.dependentProducts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-edge pt-3">
                  {c.dependentProducts.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-edge bg-canvas px-2.5 py-0.5 text-xs text-subtle"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
