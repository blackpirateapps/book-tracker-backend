import { errorResponse, json } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";
import { upsertUserFromFirebase } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const firebaseUser = await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const user = await upsertUserFromFirebase(firebaseUser);
    return json({
      user,
      capabilities: {
        coverUpload: true,
        backups: false,
        directSearchProxy: false,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
