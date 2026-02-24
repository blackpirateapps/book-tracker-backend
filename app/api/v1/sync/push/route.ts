import { errorResponse, json } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await verifyFirebaseBearerToken(request.headers.get("authorization"));
    return json(
      {
        message: "Not implemented yet",
        hint: "Implement bulk sync push using the schema in docs/API_AGENT_BACKEND_BUILD_SPEC.md.",
      },
      { status: 501 },
    );
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
