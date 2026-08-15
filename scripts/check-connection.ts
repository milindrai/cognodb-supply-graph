/**
 * Quick connectivity check — verifies env vars + a live handshake with CognoDB.
 * Run with:  npm run check-db
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { verifyConnectivity, readQuery, closeDriver } from "../src/lib/neo4j";
import { getDbConfig } from "../src/lib/env";

loadEnv({ path: ".env.local" });

async function main() {
  const cfg = getDbConfig();
  console.log(`→ URI:      ${cfg.uri}`);
  console.log(`→ User:     ${cfg.username}`);
  console.log(`→ Database: ${cfg.database}`);
  console.log("→ Verifying connectivity…");
  await verifyConnectivity();
  const rows = await readQuery(
    "RETURN 'pong' AS msg, timestamp() AS ts",
    {},
    (r) => ({ msg: r.get("msg"), ts: r.get("ts") }),
  );
  console.log(`✓ Connected. Server replied: ${rows[0].msg}`);
}

main()
  .then(async () => {
    await closeDriver();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("✗ Connection check failed:", err.message ?? err);
    await closeDriver();
    process.exit(1);
  });
