/**
 * Centralised, validated access to connection secrets.
 *
 * All CognoDB / Neo4j credentials come from environment variables and are
 * NEVER hard-coded or committed. In development these are loaded from
 * `.env.local`; in production (Vercel etc.) they are set in the dashboard.
 */

export interface DbConfig {
  uri: string;
  username: string;
  password: string;
  database: string;
}

/** Thrown when required connection env vars are missing or malformed. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

let cached: DbConfig | null = null;

export function getDbConfig(): DbConfig {
  if (cached) return cached;

  const uri = process.env.NEO4J_URI?.trim();
  const username = process.env.NEO4J_USERNAME?.trim();
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE?.trim() || "neo4j";

  const missing: string[] = [];
  if (!uri) missing.push("NEO4J_URI");
  if (!username) missing.push("NEO4J_USERNAME");
  if (!password) missing.push("NEO4J_PASSWORD");

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env.local and fill in your CognoDB connection details.`,
    );
  }

  cached = { uri: uri!, username: username!, password: password!, database };
  return cached;
}
