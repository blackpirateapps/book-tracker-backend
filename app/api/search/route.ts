import { errorResponse, json } from "@/lib/server/http";
import { searchOpenLibrary } from "@/lib/server/openlibrary";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q) {
      return errorResponse(400, "Missing q");
    }
    return json(await searchOpenLibrary(q));
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Internal server error");
  }
}
