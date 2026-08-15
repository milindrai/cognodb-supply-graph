import { handle } from "@/lib/api";
import { verifyConnectivity } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await verifyConnectivity();
    return { status: "connected" };
  });
}
