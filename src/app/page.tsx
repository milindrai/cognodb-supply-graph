"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { GraphData, SupplierSummary } from "@/lib/types";
import { Card, EmptyState, ErrorState, LoadingState, SectionTitle } from "@/components/ui";
import { GraphView } from "@/components/GraphView";

// A curated set of interesting entry points (ids match the seed data).
const ENTRY_POINTS = [
  { id: "prd-phone", label: "Nimbus Smartphone (Product)" },
  { id: "prd-ev", label: "Aurora EV Sedan (Product)" },
  { id: "cmp-soc", label: "System-on-Chip (Component)" },
  { id: "cmp-battpack", label: "Battery Pack (Component)" },
  { id: "sup-tsc", label: "TaiSilicon Foundry (Supplier)" },
];

export default function ExplorePage() {
  const [nodeId, setNodeId] = useState<string>(ENTRY_POINTS[0].id);
  const [depth, setDepth] = useState<number>(2);
  const [hydrated, setHydrated] = useState(false);

  const suppliers = useApi<SupplierSummary[]>("/api/suppliers");
  const graph = useApi<GraphData>(`/api/graph?id=${encodeURIComponent(nodeId)}&depth=${depth}`);

  // On mount: adopt shareable deep-link params (?id=&depth=) from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) setNodeId(id);
    const d = Number(params.get("depth"));
    if (d >= 1 && d <= 3) setDepth(d);
    setHydrated(true);
  }, []);

  // Keep the URL in sync (shareable deep links).
  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    url.searchParams.set("id", nodeId);
    url.searchParams.set("depth", String(depth));
    window.history.replaceState(null, "", url.toString());
  }, [nodeId, depth, hydrated]);

  return (
    <div className="space-y-6 fade-in">
      <SectionTitle
        title="Graph Explorer"
        subtitle="Walk the neighbourhood around any supplier, component or product — backed by CognoDB (openCypher over Bolt)."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-subtle">
              Start node
            </label>
            <select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full rounded-lg border border-edge bg-canvas px-3 py-2 text-sm outline-none transition focus:border-brand"
            >
              <optgroup label="Highlights">
                {ENTRY_POINTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              {suppliers.data && (
                <optgroup label="All suppliers">
                  {suppliers.data.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Supplier)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-subtle">
              Depth
            </label>
            <div className="inline-flex rounded-lg border border-edge bg-canvas p-1 text-sm">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    depth === d ? "bg-panelalt text-ink" : "text-subtle hover:text-ink"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {graph.loading ? (
        <Card>
          <LoadingState rows={4} label="Fetching neighbourhood from the graph…" />
        </Card>
      ) : graph.error ? (
        <ErrorState
          title={graph.code === "DB_UNAVAILABLE" ? "Database unavailable" : "Couldn’t load graph"}
          message={graph.error}
          onRetry={graph.reload}
        />
      ) : !graph.data || graph.data.nodes.length === 0 ? (
        <EmptyState
          icon="◎"
          title="Nothing to show"
          hint="This node has no connections within the selected depth. Try a larger depth or a different start node."
        />
      ) : (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-subtle">
            <span>
              {graph.data.nodes.length} nodes · {graph.data.edges.length} relationships
            </span>
            <span className="text-xs">Hover a node to isolate its connections</span>
          </div>
          <GraphView data={graph.data} centerId={nodeId} />
        </Card>
      )}
    </div>
  );
}
