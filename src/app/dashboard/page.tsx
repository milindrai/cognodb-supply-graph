"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";
import type { Stats } from "@/lib/types";
import { Card, ErrorState, LoadingState, SectionTitle, Stat } from "@/components/ui";

export default function DashboardPage() {
  const { data, error, code, loading, reload } = useApi<Stats>("/api/stats");

  return (
    <div className="space-y-8 fade-in">
      {/* Hero */}
      <section className="grid gap-6 rounded-2xl border border-edge bg-gradient-to-br from-panel/80 to-panelalt/50 p-7 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            Graph-powered · CognoDB
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
            See what breaks before it breaks.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-subtle">
            ChainLens maps how every product is built from components, sub-components
            and suppliers across the world. Ask it a question a spreadsheet can&apos;t
            answer: <span className="text-ink">&ldquo;If this supplier — or an entire region — goes
            dark, which products are at risk, and how far upstream is the cause?&rdquo;</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/simulate"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
            >
              Run a disruption simulation →
            </Link>
            <Link
              href="/risk"
              className="rounded-lg border border-edge bg-panel px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              Find single points of failure
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 self-center">
          {loading && !data ? (
            <div className="col-span-2">
              <LoadingState rows={3} label="Loading graph stats…" />
            </div>
          ) : error ? (
            <div className="col-span-2">
              <ErrorState
                title={code === "DB_UNAVAILABLE" ? "Database unavailable" : "Couldn’t load stats"}
                message={error}
                onRetry={reload}
              />
            </div>
          ) : data ? (
            <>
              <Stat value={data.suppliers} label="Suppliers" />
              <Stat value={data.components} label="Components" />
              <Stat value={data.products} label="Products" />
              <Stat value={data.relationships} label="Relationships" />
            </>
          ) : null}
        </div>
      </section>

      {/* Why a graph database */}
      <Card>
        <SectionTitle
          title="Why a graph database?"
          subtitle="The interesting questions here are about connections, not rows."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <WhyCard
            title="Variable-depth traversal"
            body="A product depends on components that depend on sub-components with no fixed depth. Cypher walks the whole chain in one pattern; SQL needs recursive CTEs and shortest-path bookkeeping."
          />
          <WhyCard
            title="Relationships are first-class"
            body="SUPPLIES, DEPENDS_ON, PART_OF and LOCATED_IN are edges you traverse directly — no exploding multi-table JOINs to reconstruct the network on every query."
          />
          <WhyCard
            title="Blast-radius & SPOF"
            body="“Which products break if supplier X fails?” and “which components have exactly one supplier?” are natural graph queries, and painful to express relationally."
          />
        </div>
      </Card>

      {/* How to use */}
      <Card>
        <SectionTitle title="Explore the graph" subtitle="Three ways in." />
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureLink
            href="/"
            title="Graph Explorer"
            body="Visually walk the neighbourhood around any supplier, component or product."
          />
          <FeatureLink
            href="/simulate"
            title="Disruption Simulator"
            body="Pick a supplier or region and see every impacted product, ranked by how many hops upstream the failure originates."
          />
          <FeatureLink
            href="/risk"
            title="Single Points of Failure"
            body="Components sourced from exactly one supplier — ranked by how many products they put at risk."
          />
        </div>
      </Card>
    </div>
  );
}

function WhyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-edge bg-panelalt/40 p-4">
      <h3 className="font-medium text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-subtle">{body}</p>
    </div>
  );
}

function FeatureLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-edge bg-panelalt/40 p-4 transition hover:border-brand/60"
    >
      <h3 className="flex items-center justify-between font-medium text-ink">
        {title}
        <span className="text-subtle transition group-hover:translate-x-0.5 group-hover:text-brand">→</span>
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-subtle">{body}</p>
    </Link>
  );
}
