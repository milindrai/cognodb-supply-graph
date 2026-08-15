import { NextRequest } from "next/server";
import { handle, badRequest } from "@/lib/api";
import { simulateSupplierDisruption, simulateRegionDisruption } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!id) return badRequest("Missing required 'id' query parameter.");
  if (type !== "supplier" && type !== "region") {
    return badRequest("Query parameter 'type' must be 'supplier' or 'region'.");
  }

  return handle(() =>
    type === "supplier" ? simulateSupplierDisruption(id) : simulateRegionDisruption(id),
  );
}
