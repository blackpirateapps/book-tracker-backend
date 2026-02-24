import { errorResponse, json } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";
import { listUserChangesSince } from "@/lib/server/v1-books";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    if (!since) {
      return errorResponse(400, "Missing since");
    }
    return json(await listUserChangesSince(user.uid, since));
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
