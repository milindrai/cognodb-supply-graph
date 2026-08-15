import { handle } from "@/lib/api";
import { findSinglePointsOfFailure } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(() => findSinglePointsOfFailure());
}
