import { NextRequest } from "next/server";
import { handle, badRequest } from "@/lib/api";
import { getNeighbourhood } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const depth = Number(searchParams.get("depth") ?? "2");

  if (!id) return badRequest("Missing required 'id' query parameter.");

  return handle(() => getNeighbourhood(id, depth));
}
