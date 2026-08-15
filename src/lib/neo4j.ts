import neo4j, { Driver, Session, RecordShape } from "neo4j-driver";
import { getDbConfig } from "./env";

/**
 * Neo4j / CognoDB driver singleton.
 *
 * The Neo4j driver is designed to be created ONCE per application and shared —
 * it manages a connection pool internally. In Next.js dev the module can be
 * re-evaluated on hot-reload, so we stash the driver on `globalThis` to avoid
 * leaking connections.
 */

const GLOBAL_KEY = "__cognodb_driver__" as const;

interface DriverHolder {
  [GLOBAL_KEY]?: Driver;
}
const holder = globalThis as unknown as DriverHolder;

export function getDriver(): Driver {
  if (holder[GLOBAL_KEY]) return holder[GLOBAL_KEY]!;

  const { uri, username, password } = getDbConfig();

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    // Fail fast instead of hanging when the DB is unreachable.
    connectionAcquisitionTimeout: 10_000,
    connectionTimeout: 10_000,
    maxConnectionPoolSize: 50,
    // CognoDB free tier allows up to 200 connections; stay well under.
    disableLosslessIntegers: true,
  });

  holder[GLOBAL_KEY] = driver;
  return driver;
}

/** A well-typed error surfaced to API routes for graceful handling. */
export class DatabaseUnavailableError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

/**
 * Run a read query with parameters and map each record via `mapper`.
 * ALWAYS parameterised — callers pass a params object, never string-built Cypher.
 */
export async function readQuery<T>(
  cypher: string,
  params: Record<string, unknown>,
  mapper: (record: RecordShape) => T,
): Promise<T[]> {
  const { database } = getDbConfig();
  let session: Session | null = null;
  try {
    session = getDriver().session({ database, defaultAccessMode: neo4j.session.READ });
    const result = await session.run(cypher, params);
    return result.records.map(mapper);
  } catch (err: unknown) {
    throw normaliseError(err);
  } finally {
    await session?.close();
  }
}

/** Run a write query with parameters (used by the seed script and mutations). */
export async function writeQuery<T = RecordShape>(
  cypher: string,
  params: Record<string, unknown>,
  mapper?: (record: RecordShape) => T,
): Promise<T[]> {
  const { database } = getDbConfig();
  let session: Session | null = null;
  try {
    session = getDriver().session({ database, defaultAccessMode: neo4j.session.WRITE });
    const result = await session.run(cypher, params);
    return mapper ? result.records.map(mapper) : (result.records as unknown as T[]);
  } catch (err: unknown) {
    throw normaliseError(err);
  } finally {
    await session?.close();
  }
}

/** Lightweight health check used by the /api/health route. */
export async function verifyConnectivity(): Promise<void> {
  try {
    await getDriver().verifyConnectivity();
  } catch (err) {
    throw normaliseError(err);
  }
}

/**
 * Translate low-level driver/network failures into a typed, user-safe error.
 * Neo4j connection issues surface as codes like `ServiceUnavailable` or
 * `SessionExpired`, or as raw network errors (ECONNREFUSED / ENOTFOUND).
 */
function normaliseError(err: unknown): Error {
  const code = (err as { code?: string })?.code ?? "";
  const message = (err as { message?: string })?.message ?? String(err);

  const isConnectivity =
    code.includes("ServiceUnavailable") ||
    code.includes("SessionExpired") ||
    code.includes("Unauthorized") ||
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|connection|routing/i.test(message);

  if (isConnectivity) {
    return new DatabaseUnavailableError(
      "The graph database is currently unreachable. Check that your CognoDB " +
        "instance is running and that NEO4J_URI / credentials are correct.",
      err,
    );
  }
  return err instanceof Error ? err : new Error(message);
}

/** Close the driver (used by scripts on exit). */
export async function closeDriver(): Promise<void> {
  if (holder[GLOBAL_KEY]) {
    await holder[GLOBAL_KEY]!.close();
    holder[GLOBAL_KEY] = undefined;
  }
}
