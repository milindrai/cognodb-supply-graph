import { handle } from "@/lib/api";
import { listRegions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(() => listRegions());
}
