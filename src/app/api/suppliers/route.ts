import { handle } from "@/lib/api";
import { listSuppliers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(() => listSuppliers());
}
