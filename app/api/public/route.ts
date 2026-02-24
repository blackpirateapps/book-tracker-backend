import { errorResponse, json } from "@/lib/server/http";
import { getPublicStats, getRandomHighlight, listPublicBooks, listTags } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      return json(await getPublicStats(), { headers: { "Cache-Control": "s-maxage=10" } });
    }
    if (action === "randomHighlight") {
      return json(await getRandomHighlight(), { headers: { "Cache-Control": "s-maxage=10" } });
    }
    if (action === "tags") {
      return json(await listTags(), { headers: { "Cache-Control": "s-maxage=10" } });
    }

    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? 20) || 20));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
    const q = searchParams.get("q")?.trim() ?? undefined;
    const books = await listPublicBooks({ limit, offset, q });
    return json(books, { headers: { "Cache-Control": "s-maxage=10" } });
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Internal server error");
  }
}
