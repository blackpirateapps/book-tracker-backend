import { errorResponse, json } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";
import { searchOpenLibraryForApp } from "@/lib/server/openlibrary";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q) {
      return errorResponse(400, "Missing q");
    }
    const limit = Number(searchParams.get("limit") ?? 20) || 20;
    const results = await searchOpenLibraryForApp(q, limit);
    return json(results);
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
