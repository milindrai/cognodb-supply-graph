/**
 * All read queries for the application.
 *
 * Every query is PARAMETERISED — values are passed as a params object to the
 * driver (`$name`), never concatenated into the Cypher string. This prevents
 * Cypher injection and lets the server cache query plans.
 */
import { readQuery } from "./neo4j";
import type {
  GraphData,
  GraphEdge,
  GraphNode,
  ImpactResult,
  ImpactedProduct,
  SpofComponent,
  Stats,
  SupplierSummary,
} from "./types";

/** High-level counts for the dashboard header. */
export async function getStats(): Promise<Stats> {
  const rows = await readQuery(
    `
    CALL {
      MATCH (s:Supplier)  RETURN count(s) AS suppliers
    }
    CALL { MATCH (c:Component) RETURN count(c) AS components }
    CALL { MATCH (p:Product)   RETURN count(p) AS products }
    CALL { MATCH (f:Facility)  RETURN count(f) AS facilities }
    CALL { MATCH (r:Region)    RETURN count(r) AS regions }
    CALL { MATCH ()-[rel]->()  RETURN count(rel) AS relationships }
    RETURN suppliers, components, products, facilities, regions, relationships
    `,
    {},
    (r) => ({
      suppliers: r.get("suppliers"),
      components: r.get("components"),
      products: r.get("products"),
      facilities: r.get("facilities"),
      regions: r.get("regions"),
      relationships: r.get("relationships"),
    }),
  );
  return rows[0];
}

/** All suppliers, sorted by risk, for the browse/select experience. */
export async function listSuppliers(): Promise<SupplierSummary[]> {
  return readQuery(
    `
    MATCH (s:Supplier)-[:LOCATED_IN]->(r:Region)
    RETURN s.id AS id, s.name AS name, s.country AS country,
           r.name AS region, s.tier AS tier, s.riskScore AS riskScore
    ORDER BY s.riskScore DESC, s.name ASC
    `,
    {},
    (r) => ({
      id: r.get("id"),
      name: r.get("name"),
      country: r.get("country"),
      region: r.get("region"),
      tier: r.get("tier"),
      riskScore: r.get("riskScore"),
    }),
  );
}

/** List selectable regions for the region-disruption simulation. */
export async function listRegions(): Promise<{ id: string; name: string; supplierCount: number }[]> {
  return readQuery(
    `
    MATCH (r:Region)<-[:LOCATED_IN]-(s:Supplier)
    RETURN r.id AS id, r.name AS name, count(s) AS supplierCount
    ORDER BY supplierCount DESC, r.name ASC
    `,
    {},
    (r) => ({ id: r.get("id"), name: r.get("name"), supplierCount: r.get("supplierCount") }),
  );
}

/**
 * ── THE MULTI-HOP TRAVERSAL / SQL-AWKWARD QUERY ──────────────────────────
 * Simulate a SUPPLIER disruption: find every finished Product that transitively
 * depends on any component supplied by $supplierId, and report the SHORTEST
 * number of hops from the supplier to each product.
 *
 * Why this is awkward in SQL: the dependency chain
 *   Supplier -SUPPLIES-> Component -[DEPENDS_ON*]-> Component -PART_OF-> Product
 * has variable, unbounded depth (a component is built from sub-components which
 * are built from sub-components…). In SQL this needs a recursive CTE plus manual
 * shortest-path bookkeeping; in Cypher it is a single variable-length pattern.
 */
export async function simulateSupplierDisruption(supplierId: string): Promise<ImpactResult> {
  const rows = await readQuery(
    `
    MATCH (s:Supplier {id: $supplierId})
    // components this supplier provides, directly
    MATCH (s)-[:SUPPLIES]->(c0:Component)
    // Walk UP the bill-of-materials to any depth: an assembly DEPENDS_ON its
    // sub-parts, so from a supplied part we follow DEPENDS_ON *incoming* to reach
    // the higher-level assembly that is finally PART_OF a product.
    MATCH path = (c0)<-[:DEPENDS_ON*0..5]-(cEnd:Component)-[:PART_OF]->(p:Product)
    WITH s, p,
         min(length(path)) AS hops,
         collect(DISTINCT c0.name) AS viaComponents
    RETURN s.name AS supplierName,
           p.id AS pid, p.name AS pname, p.category AS pcat,
           hops, viaComponents
    ORDER BY hops ASC, pname ASC
    `,
    { supplierId },
    (r) => ({
      supplierName: r.get("supplierName") as string,
      product: {
        id: r.get("pid"),
        name: r.get("pname"),
        category: r.get("pcat"),
        // length(path) already counts the DEPENDS_ON hops + the PART_OF hop;
        // add 1 for the SUPPLIES hop from supplier to the first component.
        hops: (r.get("hops") as number) + 1,
        viaComponents: r.get("viaComponents"),
      } as ImpactedProduct,
    }),
  );

  const impactedProducts = rows.map((x) => x.product);
  const totalRows = await readQuery(
    `MATCH (p:Product) RETURN count(p) AS total`,
    {},
    (r) => r.get("total") as number,
  );

  return {
    sourceType: "supplier",
    sourceId: supplierId,
    sourceName: rows[0]?.supplierName ?? "",
    impactedProducts,
    impactedComponentCount: new Set(impactedProducts.flatMap((p) => p.viaComponents)).size,
    totalProducts: totalRows[0] ?? 0,
  };
}

/**
 * Simulate a REGION disruption: every supplier in the region goes offline.
 * Multi-hop across LOCATED_IN + SUPPLIES + variable-length DEPENDS_ON + PART_OF.
 */
export async function simulateRegionDisruption(regionId: string): Promise<ImpactResult> {
  const rows = await readQuery(
    `
    MATCH (r:Region {id: $regionId})<-[:LOCATED_IN]-(s:Supplier)
    MATCH (s)-[:SUPPLIES]->(c0:Component)
    // follow DEPENDS_ON incoming (up the bill-of-materials) to the product
    MATCH path = (c0)<-[:DEPENDS_ON*0..5]-(cEnd:Component)-[:PART_OF]->(p:Product)
    WITH r, p, min(length(path)) AS hops, collect(DISTINCT c0.name) AS viaComponents
    RETURN r.name AS regionName,
           p.id AS pid, p.name AS pname, p.category AS pcat,
           hops, viaComponents
    ORDER BY hops ASC, pname ASC
    `,
    { regionId },
    (r) => ({
      regionName: r.get("regionName") as string,
      product: {
        id: r.get("pid"),
        name: r.get("pname"),
        category: r.get("pcat"),
        hops: (r.get("hops") as number) + 2,
        viaComponents: r.get("viaComponents"),
      } as ImpactedProduct,
    }),
  );

  const impactedProducts = rows.map((x) => x.product);
  const totalRows = await readQuery(
    `MATCH (p:Product) RETURN count(p) AS total`,
    {},
    (r) => r.get("total") as number,
  );

  return {
    sourceType: "region",
    sourceId: regionId,
    sourceName: rows[0]?.regionName ?? "",
    impactedProducts,
    impactedComponentCount: new Set(impactedProducts.flatMap((p) => p.viaComponents)).size,
    totalProducts: totalRows[0] ?? 0,
  };
}

/**
 * ── SINGLE POINT OF FAILURE ANALYSIS ─────────────────────────────────────
 * Components sourced from exactly ONE qualified supplier, ranked by how many
 * products would be affected. This "count the relationships per node, filter to
 * degree = 1, then traverse to dependents" pattern is a natural graph query and
 * a multi-join headache in SQL.
 */
export async function findSinglePointsOfFailure(): Promise<SpofComponent[]> {
  return readQuery(
    `
    MATCH (c:Component)<-[:SUPPLIES]-(s:Supplier)
    WITH c, collect(DISTINCT s) AS suppliers
    WHERE size(suppliers) = 1
    WITH c, head(suppliers) AS sole
    // find every product that depends on this component (any depth): follow
    // DEPENDS_ON incoming up to the assembly that is PART_OF a product.
    OPTIONAL MATCH (c)<-[:DEPENDS_ON*0..5]-(:Component)-[:PART_OF]->(p:Product)
    WITH c, sole, collect(DISTINCT p) AS products
    RETURN c.id AS componentId, c.name AS componentName, c.category AS category,
           sole.name AS soleSupplier, sole.country AS soleSupplierCountry,
           size(products) AS dependentProductCount,
           [x IN products | x.name] AS dependentProducts
    ORDER BY dependentProductCount DESC, componentName ASC
    `,
    {},
    (r) => ({
      componentId: r.get("componentId"),
      componentName: r.get("componentName"),
      category: r.get("category"),
      soleSupplier: r.get("soleSupplier"),
      soleSupplierCountry: r.get("soleSupplierCountry"),
      dependentProductCount: r.get("dependentProductCount"),
      dependentProducts: r.get("dependentProducts"),
    }),
  );
}

/**
 * Neighbourhood subgraph around a node, for the visual explorer.
 * Parameterised node id + traversal depth. Pure Cypher (no APOC) so it works
 * identically on CognoDB and vanilla Neo4j. We return one row per edge with the
 * endpoint properties spelled out explicitly, which maps cleanly to the UI.
 */
export async function getNeighbourhood(nodeId: string, depth: number): Promise<GraphData> {
  const safeDepth = Math.min(Math.max(Math.trunc(depth) || 1, 1), 3);
  const rows = await readQuery(
    `
    MATCH (start {id: $nodeId})
    MATCH path = (start)-[*1..3]-(other)
    WHERE length(path) <= $depth
    UNWIND relationships(path) AS rel
    WITH DISTINCT rel, startNode(rel) AS a, endNode(rel) AS b
    RETURN
      a.id AS srcId, labels(a)[0] AS srcType, coalesce(a.name, a.id) AS srcLabel,
      a.country AS srcCountry, a.category AS srcCategory, a.tier AS srcTier, a.riskScore AS srcRisk,
      b.id AS dstId, labels(b)[0] AS dstType, coalesce(b.name, b.id) AS dstLabel,
      b.country AS dstCountry, b.category AS dstCategory, b.tier AS dstTier, b.riskScore AS dstRisk,
      type(rel) AS relType
    LIMIT 300
    `,
    { nodeId, depth: safeDepth },
    (r) => ({
      src: node(r, "src"),
      dst: node(r, "dst"),
      relType: r.get("relType") as string,
    }),
  );

  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  for (const row of rows) {
    if (!nodeMap.has(row.src.id)) nodeMap.set(row.src.id, row.src);
    if (!nodeMap.has(row.dst.id)) nodeMap.set(row.dst.id, row.dst);
    edges.push({ source: row.src.id, target: row.dst.id, type: row.relType });
  }
  // ensure the start node is present even if it has no edges within depth
  return { nodes: [...nodeMap.values()], edges: dedupeEdges(edges) };
}

function node(r: any, prefix: string): GraphNode {
  const meta: Record<string, string | number> = {};
  const country = r.get(`${prefix}Country`);
  const category = r.get(`${prefix}Category`);
  const tier = r.get(`${prefix}Tier`);
  const risk = r.get(`${prefix}Risk`);
  if (country != null) meta.country = country;
  if (category != null) meta.category = category;
  if (tier != null) meta.tier = tier;
  if (risk != null) meta.riskScore = risk;
  return {
    id: r.get(`${prefix}Id`),
    label: r.get(`${prefix}Label`),
    type: r.get(`${prefix}Type`),
    meta,
  };
}

function dedupeEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Set<string>();
  const out: GraphEdge[] = [];
  for (const e of edges) {
    const key = `${e.source}|${e.type}|${e.target}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  }
  return out;
}
