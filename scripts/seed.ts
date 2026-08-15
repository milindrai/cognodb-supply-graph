/**
 * Seed script — loads the supply-chain graph into CognoDB / Neo4j.
 *
 * Run with:  npm run seed
 *
 * Everything is parameterised: rows are passed as a list parameter and expanded
 * server-side with UNWIND. No values are concatenated into the Cypher string.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { writeQuery, verifyConnectivity, closeDriver } from "../src/lib/neo4j";
import {
  regions,
  suppliers,
  components,
  products,
  facilities,
  supplies,
  dependsOn,
  partOf,
  assembledAt,
} from "./data";

// Load .env.local (Next.js convention) in addition to .env
loadEnv({ path: ".env.local" });

async function main() {
  console.log("→ Verifying connectivity to the graph database…");
  await verifyConnectivity();
  console.log("✓ Connected.\n");

  console.log("→ Clearing existing graph…");
  await writeQuery("MATCH (n) DETACH DELETE n", {});

  console.log("→ Creating uniqueness constraints…");
  // Constraints are DDL; run each separately. IF NOT EXISTS keeps this idempotent.
  for (const label of ["Region", "Supplier", "Component", "Product", "Facility"]) {
    await writeQuery(
      `CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS
       FOR (n:${label}) REQUIRE n.id IS UNIQUE`,
      {},
    );
  }

  console.log("→ Loading nodes…");
  await writeQuery(
    `UNWIND $rows AS row
     MERGE (r:Region {id: row.id})
     SET r.name = row.name, r.riskNote = row.riskNote`,
    { rows: regions },
  );
  await writeQuery(
    `UNWIND $rows AS row
     MERGE (s:Supplier {id: row.id})
     SET s.name = row.name, s.country = row.country,
         s.tier = row.tier, s.riskScore = row.riskScore`,
    { rows: suppliers },
  );
  await writeQuery(
    `UNWIND $rows AS row
     MERGE (c:Component {id: row.id})
     SET c.name = row.name, c.category = row.category`,
    { rows: components },
  );
  await writeQuery(
    `UNWIND $rows AS row
     MERGE (p:Product {id: row.id})
     SET p.name = row.name, p.category = row.category`,
    { rows: products },
  );
  await writeQuery(
    `UNWIND $rows AS row
     MERGE (f:Facility {id: row.id})
     SET f.name = row.name, f.country = row.country`,
    { rows: facilities },
  );

  console.log("→ Loading relationships…");
  // Supplier LOCATED_IN Region  &  Facility LOCATED_IN Region
  await writeQuery(
    `UNWIND $rows AS row
     MATCH (s:Supplier {id: row.id}), (r:Region {id: row.regionId})
     MERGE (s)-[:LOCATED_IN]->(r)`,
    { rows: suppliers.map((s) => ({ id: s.id, regionId: s.regionId })) },
  );
  await writeQuery(
    `UNWIND $rows AS row
     MATCH (f:Facility {id: row.id}), (r:Region {id: row.regionId})
     MERGE (f)-[:LOCATED_IN]->(r)`,
    { rows: facilities.map((f) => ({ id: f.id, regionId: f.regionId })) },
  );

  await loadEdges("SUPPLIES", "Supplier", "Component", supplies);
  await loadEdges("DEPENDS_ON", "Component", "Component", dependsOn);
  await loadEdges("PART_OF", "Component", "Product", partOf);
  await loadEdges("ASSEMBLED_AT", "Product", "Facility", assembledAt);

  const counts = await writeQuery(
    `MATCH (n) WITH count(n) AS nodes
     MATCH ()-[r]->() RETURN nodes, count(r) AS rels`,
    {},
    (rec) => ({ nodes: rec.get("nodes"), rels: rec.get("rels") }),
  );
  console.log(`\n✓ Seed complete: ${counts[0].nodes} nodes, ${counts[0].rels} relationships.`);
}

/** Generic parameterised edge loader: (from)-[:TYPE]->(to) by id pairs. */
async function loadEdges(
  relType: string,
  fromLabel: string,
  toLabel: string,
  pairs: Array<[string, string]>,
) {
  await writeQuery(
    `UNWIND $rows AS row
     MATCH (a:${fromLabel} {id: row.from}), (b:${toLabel} {id: row.to})
     MERGE (a)-[:${relType}]->(b)`,
    { rows: pairs.map(([from, to]) => ({ from, to })) },
  );
}

main()
  .then(async () => {
    await closeDriver();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n✗ Seed failed:", err.message ?? err);
    await closeDriver();
    process.exit(1);
  });
