"use client";

import { useMemo, useState } from "react";
import type { GraphData } from "@/lib/types";
import { TYPE_COLORS } from "./ui";

interface Positioned {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
}

const WIDTH = 720;
const HEIGHT = 460;

/**
 * Dependency-free graph renderer. Runs a short, deterministic force simulation
 * (fixed seed positions from a circle, no Math.random) so the layout is stable
 * across renders and SSR-safe.
 */
export function GraphView({ data, centerId }: { data: GraphData; centerId: string }) {
  const [hover, setHover] = useState<string | null>(null);

  const positions = useMemo(() => layout(data, centerId), [data, centerId]);
  const posById = useMemo(() => {
    const m = new Map<string, Positioned>();
    positions.forEach((p) => m.set(p.id, p));
    return m;
  }, [positions]);

  if (data.nodes.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="min-w-[640px] w-full rounded-lg border border-edge bg-canvas"
        role="img"
        aria-label="Graph neighbourhood visualisation"
      >
        {/* edges */}
        {data.edges.map((e, i) => {
          const a = posById.get(e.source);
          const b = posById.get(e.target);
          if (!a || !b) return null;
          const dim = hover && hover !== e.source && hover !== e.target;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={i} opacity={dim ? 0.15 : 1}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#28324a" strokeWidth={1.5} />
              <text x={mx} y={my} dy={-3} textAnchor="middle" className="fill-subtle" fontSize={8}>
                {e.type}
              </text>
            </g>
          );
        })}

        {/* nodes */}
        {positions.map((n) => {
          const color = TYPE_COLORS[n.type] ?? "#8aa0c6";
          const isCenter = n.id === centerId;
          const dim = hover && hover !== n.id && !isNeighbour(data, hover, n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              opacity={dim ? 0.25 : 1}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            >
              <circle
                r={isCenter ? 13 : 9}
                fill={color}
                fillOpacity={0.9}
                stroke={isCenter ? "#fff" : "#0b0f19"}
                strokeWidth={isCenter ? 2 : 1.5}
              />
              <text
                x={0}
                y={isCenter ? 26 : 20}
                textAnchor="middle"
                className="fill-ink"
                fontSize={isCenter ? 11 : 9.5}
                fontWeight={isCenter ? 600 : 400}
              >
                {truncate(n.label, 22)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

function isNeighbour(data: GraphData, a: string, b: string): boolean {
  return data.edges.some(
    (e) => (e.source === a && e.target === b) || (e.source === b && e.target === a),
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * Deterministic layout: center node in the middle, all others seeded on a
 * circle by index, then a few iterations of simple spring + repulsion forces.
 */
function layout(data: GraphData, centerId: string): Positioned[] {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const nodes = data.nodes;
  const n = nodes.length;

  const pts = nodes.map((node, i) => {
    if (node.id === centerId) return { ...node, x: cx, y: cy, vx: 0, vy: 0 };
    const angle = (2 * Math.PI * i) / Math.max(n - 1, 1);
    const radius = 150 + (i % 3) * 30;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const idx = new Map(pts.map((p, i) => [p.id, i]));
  const edges = data.edges
    .map((e) => [idx.get(e.source), idx.get(e.target)] as [number | undefined, number | undefined])
    .filter((e): e is [number, number] => e[0] !== undefined && e[1] !== undefined);

  const ITER = 220;
  for (let it = 0; it < ITER; it++) {
    // repulsion (all pairs)
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        let dx = pts[i].x - pts[j].x;
        let dy = pts[i].y - pts[j].y;
        let d2 = dx * dx + dy * dy || 0.01;
        const rep = 4200 / d2;
        const d = Math.sqrt(d2);
        dx /= d;
        dy /= d;
        pts[i].vx += dx * rep;
        pts[i].vy += dy * rep;
        pts[j].vx -= dx * rep;
        pts[j].vy -= dy * rep;
      }
    }
    // spring along edges
    for (const [a, b] of edges) {
      let dx = pts[b].x - pts[a].x;
      let dy = pts[b].y - pts[a].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (d - 120) * 0.02;
      dx /= d;
      dy /= d;
      pts[a].vx += dx * force;
      pts[a].vy += dy * force;
      pts[b].vx -= dx * force;
      pts[b].vy -= dy * force;
    }
    // integrate with damping; pin the center node
    for (const p of pts) {
      if (p.id === centerId) {
        p.x = cx;
        p.y = cy;
        p.vx = 0;
        p.vy = 0;
        continue;
      }
      p.x += Math.max(-8, Math.min(8, p.vx));
      p.y += Math.max(-8, Math.min(8, p.vy));
      p.vx *= 0.85;
      p.vy *= 0.85;
      // keep within bounds
      p.x = Math.max(30, Math.min(WIDTH - 30, p.x));
      p.y = Math.max(30, Math.min(HEIGHT - 30, p.y));
    }
  }

  return pts.map(({ id, label, type, x, y }) => ({ id, label, type, x, y }));
}
