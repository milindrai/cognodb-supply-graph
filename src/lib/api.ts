import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "./neo4j";
import { ConfigError } from "./env";

/**
 * Wrap an API handler so every route reports failures consistently and never
 * leaks stack traces. DB-unreachable and misconfiguration are mapped to 503 so
 * the UI can show a friendly "database unavailable" state.
 */
export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError || err instanceof ConfigError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: "DB_UNAVAILABLE" },
        { status: 503 },
      );
    }
    console.error("[api] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again.", code: "INTERNAL" },
      { status: 500 },
    );
  }
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ ok: false, error: message, code: "BAD_REQUEST" }, { status: 400 });
}
