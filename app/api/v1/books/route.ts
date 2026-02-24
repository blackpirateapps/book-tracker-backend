import { errorResponse, json } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await verifyFirebaseBearerToken(request.headers.get("authorization"));
    return json(
      {
        message: "Not implemented yet",
        hint: "Use /api/books for the current Android app integration. Build /api/v1/* sync routes on top of the Firebase+Turso spec in docs/API_AGENT_BACKEND_BUILD_SPEC.md.",
      },
      { status: 501 },
    );
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
